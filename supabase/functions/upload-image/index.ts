/**
 * JustAChat™ Image Upload Edge Function
 * Works with both Lovable Cloud and VPS (self-hosted Supabase with Kong)
 * 
 * Key features:
 * - Rate limiting (5 uploads/minute per user)
 * - AI content moderation (optional, requires OPENAI_API_KEY)
 * - Multipart form-data support
 * - VPS URL mapping (kong:8000 -> public domain)
 * - Service role fallback for RLS bypass
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bucket, x-path, x-file-name, x-file-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate limiting: max 5 uploads per minute per user
const MAX_UPLOADS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const uploadRateLimits = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = uploadRateLimits.get(userId);
  
  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
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
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  
  if (!OPENAI_API_KEY) {
    console.log("No OPENAI_API_KEY configured - skipping AI moderation");
    return { safe: true };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image for content moderation. Respond with ONLY a JSON object:
{"safe": true} if appropriate
{"safe": false, "reason": "brief reason"} if it contains nudity, explicit content, or inappropriate material.`
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
      // Fail open on service errors
      if (response.status === 402 || response.status === 429 || response.status >= 500) {
        return { safe: true };
      }
      return { safe: false, reason: "Content moderation temporarily unavailable" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI moderation response:", content);
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return { safe: result.safe === true, reason: result.reason };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }
    
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('"safe": false') || lowerContent.includes("nudity") || 
        lowerContent.includes("explicit") || lowerContent.includes("inappropriate")) {
      return { safe: false, reason: "Content flagged by moderation" };
    }
    
    return { safe: true };
  } catch (error) {
    console.error("AI moderation error:", error);
    return { safe: true }; // Fail open
  }
}

/**
 * Map internal Docker URLs to public VPS domain
 * Kong internally uses http://kong:8000 but we need https://justachat.net
 */
function mapToPublicUrl(internalUrl: string): string {
  // Get public URL from environment or default
  const publicUrl = Deno.env.get("VPS_PUBLIC_URL") || Deno.env.get("SITE_URL") || "https://justachat.net";
  
  // Replace internal Docker URLs with public domain
  let finalUrl = internalUrl;
  
  // Common internal patterns
  const internalPatterns = [
    /https?:\/\/kong:8000/gi,
    /https?:\/\/localhost:8000/gi,
    /https?:\/\/127\.0\.0\.1:8000/gi,
    /https?:\/\/supabase-kong:8000/gi,
  ];
  
  for (const pattern of internalPatterns) {
    if (pattern.test(finalUrl)) {
      finalUrl = finalUrl.replace(pattern, publicUrl);
      console.log(`URL mapped: ${internalUrl} -> ${finalUrl}`);
      break;
    }
  }
  
  // Also fix http -> https if needed
  if (finalUrl.startsWith("http://justachat.net")) {
    finalUrl = finalUrl.replace("http://", "https://");
  }
  
  return finalUrl;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("=== Upload Image Request ===");
  console.log("Method:", req.method);
  console.log("Content-Type:", req.headers.get("content-type"));

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("SUPABASE_URL:", supabaseUrl);
    console.log("Has Service Role Key:", !!supabaseServiceRoleKey);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user-scoped client for auth verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    const userId = userData?.user?.id;

    if (userError || !userId) {
      console.error("Auth error:", userError?.message || "No user ID");
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", userId);

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
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

    // Parse upload - support both multipart/form-data and raw binary
    const contentType = req.headers.get("content-type") || "";
    let uploadBytes: ArrayBuffer;
    let uploadName = "upload.jpg";
    let uploadType = "image/jpeg";
    let bucket = "avatars";
    let requestedPath: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      console.log("Parsing multipart/form-data...");
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
      console.log(`Received file: ${uploadName} (${uploadBytes.byteLength} bytes, type: ${uploadType})`);
    } else {
      // Raw binary with headers
      bucket = req.headers.get("x-bucket") || bucket;
      requestedPath = req.headers.get("x-path") || undefined;
      uploadName = req.headers.get("x-file-name") || uploadName;
      uploadType = req.headers.get("x-file-type") || contentType || uploadType;
      uploadBytes = await req.arrayBuffer();

      if (!uploadBytes || uploadBytes.byteLength === 0) {
        return new Response(
          JSON.stringify({ error: "No file data provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Received raw binary: ${uploadBytes.byteLength} bytes`);
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

    // AI content moderation (if key available)
    const uint8Array = new Uint8Array(uploadBytes);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    const imageBase64 = `data:${uploadType};base64,${base64}`;

    console.log("Running AI content moderation...");
    const moderationResult = await checkForNudity(imageBase64);
    
    if (!moderationResult.safe) {
      console.log(`Image rejected: ${moderationResult.reason}`);
      return new Response(
        JSON.stringify({ 
          error: "Content policy violation", 
          message: moderationResult.reason || "Image contains inappropriate content"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Image passed moderation");

    // Generate secure file path (force into user's folder)
    const fileExt = uploadName.split(".").pop() || "jpg";
    const cleanPath = requestedPath?.replace(/^\/+/, "").replace(/\.\./g, "") || undefined;
    let fileName = cleanPath || `${userId}/${crypto.randomUUID()}.${fileExt}`;
    if (!fileName.startsWith(`${userId}/`)) {
      fileName = `${userId}/${fileName}`;
    }

    // Validate bucket
    const allowedBuckets = new Set(["avatars", "chat-images"]);
    if (!allowedBuckets.has(bucket)) {
      return new Response(
        JSON.stringify({ error: "Invalid bucket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading to bucket: ${bucket}, path: ${fileName}`);

    // Try upload with user token first (respects RLS)
    let uploadData: any = null;
    let uploadError: any = null;

    const userUpload = await supabaseUser.storage.from(bucket).upload(fileName, uploadBytes, {
      contentType: uploadType,
      upsert: true,
    });
    uploadData = userUpload.data;
    uploadError = userUpload.error;

    // Fallback to service role if user upload fails
    if (uploadError && supabaseServiceRoleKey) {
      console.warn("User upload failed, trying service role:", uploadError.message);
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      const adminUpload = await supabaseAdmin.storage.from(bucket).upload(fileName, uploadBytes, {
        contentType: uploadType,
        upsert: true,
      });
      uploadData = adminUpload.data;
      uploadError = adminUpload.error;
    }

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      
      const errorMsg = uploadError.message || "Upload failed";
      if (errorMsg.includes("row-level security") || errorMsg.includes("violates row-level security")) {
        return new Response(
          JSON.stringify({
            error: "Upload failed",
            message: "Storage permissions blocked this upload (RLS)",
            details: errorMsg,
            bucket,
            path: fileName,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Upload failed", details: errorMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful, generating public URL...");

    // Get public URL and map to public domain
    const { data: urlData } = supabaseUser.storage.from(bucket).getPublicUrl(fileName);
    const rawPublicUrl = urlData?.publicUrl || "";
    const finalUrl = mapToPublicUrl(rawPublicUrl);

    console.log("Raw URL:", rawPublicUrl);
    console.log("Final URL:", finalUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: finalUrl,
        path: fileName,
        bucket,
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
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
