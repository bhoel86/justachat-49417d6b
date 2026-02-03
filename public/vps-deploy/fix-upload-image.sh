#!/bin/bash
# Fix upload-image edge function on VPS
# Run: bash fix-upload-image.sh

set -e

TARGET="/home/unix/supabase/docker/volumes/functions/main/upload-image/index.ts"

echo "🔧 Fixing upload-image edge function..."

mkdir -p "$(dirname "$TARGET")"

cat > "$TARGET" << 'EDGEFUNC'
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

// Content moderation using GPT-4o-mini vision
async function moderateImage(base64Image: string, openaiApiKey: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a content moderation system. Analyze the image and determine if it contains:
1. Nudity or sexually explicit content
2. Graphic violence or gore
3. Hate symbols or extremist content
4. Child exploitation (immediate reject)

Respond with JSON only: {"safe": true} or {"safe": false, "reason": "brief reason"}

Be strict about nudity - any exposed private parts should be flagged.
Artistic nudity in classical art context may be allowed.
Suggestive but clothed content is generally acceptable.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: base64Image.startsWith("data:") ? base64Image : `data:image/jpeg;base64,${base64Image}`,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0
      }),
    });

    if (!response.ok) {
      console.error("OpenAI moderation failed:", await response.text());
      // On API failure, allow upload but log it
      return { safe: true };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    try {
      const result = JSON.parse(content);
      return { safe: result.safe !== false, reason: result.reason };
    } catch {
      // If we can't parse, check for obvious rejection keywords
      if (content.toLowerCase().includes('"safe": false') || content.toLowerCase().includes("unsafe")) {
        return { safe: false, reason: "Content flagged by moderation" };
      }
      return { safe: true };
    }
  } catch (error) {
    console.error("Moderation error:", error);
    // On error, allow upload but log it
    return { safe: true };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token for auth check
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client with user's JWT for authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please wait before uploading again.",
          resetIn: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000))
          } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { image, bucket = "avatars", folder } = body;

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate bucket
    const allowedBuckets = ["avatars", "chat-images"];
    if (!allowedBuckets.includes(bucket)) {
      return new Response(
        JSON.stringify({ error: "Invalid bucket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Content moderation for chat-images bucket (avatars are public-facing, chat images need moderation)
    if (bucket === "chat-images" && openaiApiKey) {
      console.log("Running content moderation...");
      const moderationResult = await moderateImage(image, openaiApiKey);
      
      if (!moderationResult.safe) {
        console.log("Image rejected by moderation:", moderationResult.reason);
        return new Response(
          JSON.stringify({ 
            error: "Image flagged as unsafe and cannot be uploaded.",
            reason: moderationResult.reason
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Content moderation passed");
    }

    // Extract base64 data
    let base64Data = image;
    let mimeType = "image/jpeg";
    
    if (image.includes(",")) {
      const parts = image.split(",");
      base64Data = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Validate image type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({ error: "Invalid image type. Allowed: JPEG, PNG, GIF, WebP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (bytes.length > maxSize) {
      return new Response(
        JSON.stringify({ error: "Image too large. Maximum size is 10MB" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate filename
    const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    let fileName: string;
    if (folder) {
      fileName = `${folder}/${timestamp}-${random}.${ext}`;
    } else if (bucket === "avatars") {
      fileName = `${user.id}/${timestamp}-${random}.${ext}`;
    } else {
      fileName = `${user.id}/${timestamp}-${random}.${ext}`;
    }

    console.log(`Uploading to ${bucket}/${fileName} (${bytes.length} bytes)`);

    // Try upload with user's JWT first (works with authenticated RLS policies)
    let uploadResult = await supabaseAuth.storage
      .from(bucket)
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    // If user JWT fails and we have service role key, try that as fallback
    if (uploadResult.error && supabaseServiceKey) {
      console.log("User JWT upload failed, trying service role fallback...");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });
      
      uploadResult = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, bytes, {
          contentType: mimeType,
          upsert: true,
        });
    }

    if (uploadResult.error) {
      console.error("Upload error:", uploadResult.error);
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadResult.error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL - use a public client for URL generation
    const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    const {
      data: { publicUrl: rawPublicUrl },
    } = supabasePublic.storage.from(bucket).getPublicUrl(fileName);

    // VPS fix: Replace internal kong URL with public domain
    let finalUrl = rawPublicUrl;
    if (rawPublicUrl.includes("kong:8000")) {
      // VPS environment - use public domain
      const vpsPublicUrl = Deno.env.get("VPS_PUBLIC_URL") || "https://justachat.net";
      finalUrl = rawPublicUrl.replace(/https?:\/\/kong:8000/, vpsPublicUrl);
      console.log(`VPS URL fix: ${rawPublicUrl} -> ${finalUrl}`);
    }

    console.log(`Upload successful: ${finalUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: finalUrl,
        path: fileName,
        remaining: rateLimit.remaining
      }),
      { 
        status: 200, 
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
      JSON.stringify({ error: `Upload failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
EDGEFUNC

echo "✅ File written: $TARGET"
echo "📊 Line count: $(wc -l < "$TARGET")"

# Restart functions container
cd /home/unix/supabase/docker
echo "🔄 Restarting edge functions..."
docker compose restart functions

sleep 3
echo "📋 Recent logs:"
docker compose logs functions 2>&1 | grep -i "upload-image\|error\|listening" | tail -10

echo ""
echo "✅ Done! Test image upload in chat."
