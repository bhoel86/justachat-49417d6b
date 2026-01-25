import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: max 5 uploads per minute per user
const MAX_UPLOADS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// In-memory rate limit store (resets on function cold start)
const uploadRateLimits = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = uploadRateLimits.get(userId);
  
  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    uploadRateLimits.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_UPLOADS_PER_MINUTE - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (userLimit.count >= MAX_UPLOADS_PER_MINUTE) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  userLimit.count++;
  return { 
    allowed: true, 
    remaining: MAX_UPLOADS_PER_MINUTE - userLimit.count,
    resetIn: RATE_LIMIT_WINDOW_MS - (now - userLimit.windowStart)
  };
}

async function checkForNudity(imageBase64: string): Promise<{ safe: boolean; reason?: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    // Fail open but log - in production you might want to fail closed
    return { safe: true };
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image for content moderation. Respond with ONLY a JSON object in this exact format:
{"safe": true} if the image is appropriate
{"safe": false, "reason": "brief reason"} if the image contains:
- Nudity or sexually explicit content
- Genitalia, bare breasts, or explicit body parts
- Sexual acts or suggestive poses

Be strict about nudity detection. Artistic nudity, partial nudity, and suggestive content should all be flagged as unsafe.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error("AI moderation request failed:", response.status);
      // Fail closed on AI error - reject upload
      return { safe: false, reason: "Content moderation temporarily unavailable" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI moderation response:", content);
    
    // Parse the JSON response
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return { 
          safe: result.safe === true, 
          reason: result.reason 
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }
    
    // If we can't parse, check for keywords
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('"safe": false') || lowerContent.includes("nudity") || 
        lowerContent.includes("explicit") || lowerContent.includes("inappropriate")) {
      return { safe: false, reason: "Content flagged by moderation" };
    }
    
    return { safe: true };
  } catch (error) {
    console.error("AI moderation error:", error);
    return { safe: false, reason: "Content moderation error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header and verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      const resetSeconds = Math.ceil(rateLimit.resetIn / 1000);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          message: `Too many uploads. Please wait ${resetSeconds} seconds.`,
          resetIn: resetSeconds
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + resetSeconds)
          } 
        }
      );
    }

    // Parse upload payload.
    // Supports:
    //  1) multipart/form-data with field "file" (legacy)
    //  2) raw binary body (Blob/File) with metadata in headers (preferred)
    const contentTypeHeader = req.headers.get("content-type") || "";
    let uploadName = "upload";
    let uploadType = "application/octet-stream";
    let uploadBytes: ArrayBuffer;
    let bucket = "avatars";
    let requestedPath: string | undefined;

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      bucket = (formData.get("bucket") as string) || bucket;
      requestedPath = (formData.get("path") as string) || undefined;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      uploadName = file.name || uploadName;
      uploadType = file.type || uploadType;
      uploadBytes = await file.arrayBuffer();
    } else {
      bucket = req.headers.get("x-bucket") || bucket;
      requestedPath = req.headers.get("x-path") || undefined;
      uploadName = req.headers.get("x-file-name") || uploadName;
      uploadType = req.headers.get("x-file-type") || req.headers.get("content-type") || uploadType;
      uploadBytes = await req.arrayBuffer();

      if (!uploadBytes || uploadBytes.byteLength === 0) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(uploadType)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (uploadBytes.byteLength > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing upload for user ${user.id}: ${uploadName} (${uploadBytes.byteLength} bytes)`);

    // Convert bytes to base64 for AI analysis
    const uint8Array = new Uint8Array(uploadBytes);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    const imageBase64 = `data:${uploadType};base64,${base64}`;

    // AI nudity screening
    console.log("Running AI content moderation...");
    const moderationResult = await checkForNudity(imageBase64);
    
    if (!moderationResult.safe) {
      console.log(`Image rejected: ${moderationResult.reason}`);
      return new Response(
        JSON.stringify({ 
          error: "Content policy violation", 
          message: moderationResult.reason || "Image contains inappropriate content and cannot be uploaded."
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Image passed content moderation");

    // Generate file path
    const fileExt = uploadName.split(".").pop() || "jpg";

    // Security: force uploads into the caller's folder to avoid overwriting other users' files.
    const cleanedRequestedPath = requestedPath
      ? requestedPath.replace(/^\/+/, "").replace(/\.\./g, "")
      : undefined;

    let fileName = cleanedRequestedPath || `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    if (!fileName.startsWith(`${user.id}/`)) {
      fileName = `${user.id}/${fileName}`;
    }

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, uploadBytes, {
        contentType: uploadType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Upload failed", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`Upload successful: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        path: fileName,
        remaining: rateLimit.remaining
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateLimit.remaining)
        } 
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
