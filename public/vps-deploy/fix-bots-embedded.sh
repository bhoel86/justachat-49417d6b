#!/bin/bash
#===============================================================================
# JUSTACHAT VPS - EMBEDDED BOT ROUTER
#
# Creates an embedded router that includes chat-bot code directly
# (dynamic imports don't work in --main-service mode)
#
# Usage:
#   cd /var/www/justachat && git pull
#   bash public/vps-deploy/fix-bots-embedded.sh
#===============================================================================

set -euo pipefail

DOCKER_DIR="$HOME/supabase/docker"
FUNCTIONS_DIR="$DOCKER_DIR/volumes/functions"
APP_DIR="/var/www/justachat"

echo "============================================"
echo "JUSTACHAT VPS - EMBEDDED BOT ROUTER"
echo "============================================"

# Check prerequisites
if [ ! -f "$FUNCTIONS_DIR/chat-bot/index.ts" ]; then
  echo "ERROR: chat-bot/index.ts not found"
  echo "Run: cd /var/www/justachat && git pull"
  echo "Then: cp -r supabase/functions/* ~/supabase/docker/volumes/functions/"
  exit 1
fi

mkdir -p "$FUNCTIONS_DIR/main"

echo "[1/4] Creating embedded router..."

# Create the router header
cat > "$FUNCTIONS_DIR/main/index.ts" << 'HEADER'
// Edge-runtime embedded router - Version: embedded-v3
// Dynamic imports don't work in --main-service mode, so we embed functions

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

HEADER

# Extract personalities from chat-bot
echo "// ========== BOT PERSONALITIES ==========" >> "$FUNCTIONS_DIR/main/index.ts"
sed -n '/^const USER_PERSONALITIES/,/^serve(/p' "$FUNCTIONS_DIR/chat-bot/index.ts" | head -n -1 >> "$FUNCTIONS_DIR/main/index.ts"

# Add the handler
cat >> "$FUNCTIONS_DIR/main/index.ts" << 'HANDLER'

// ========== CHAT-BOT HANDLER ==========
async function handleChatBot(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { botId, channelName, recentMessages, isPM, customPersonality } = body;
    
    console.info(`Received botId: ${botId} isPM: ${isPM} customPersonality: ${!!customPersonality}`);

    const personality = customPersonality || USER_PERSONALITIES[botId] || USER_PERSONALITIES['user-nova'];
    
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are ${personality.name}, a real person chatting online. ${personality.personality} ${personality.style}
You're in ${channelName || 'a chat room'}. Be conversational, natural, and brief (1-3 sentences usually).
Never admit you're an AI or bot. You're just a regular person chatting.
${personality.gender ? `You are ${personality.gender}.` : ''}`;

    const messages: Array<{role: string; content: string}> = [
      { role: "system", content: systemPrompt },
    ];

    // Add recent conversation context
    if (recentMessages && Array.isArray(recentMessages)) {
      for (const m of recentMessages.slice(-10)) {
        const role = m.username === personality.name ? "assistant" : "user";
        messages.push({ role, content: `${m.username}: ${m.content}` });
      }
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI error:", openaiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await openaiResponse.json();
    let response = data.choices?.[0]?.message?.content || "Hey!";
    
    // Clean up the response (remove name prefix if AI added it)
    response = response.replace(new RegExp(`^${personality.name}:\\s*`, 'i'), '');

    return new Response(JSON.stringify({ 
      response: `${personality.name}: ${response}`,
      botName: personality.name 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat-bot error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// ========== MAIN ROUTER ==========
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Health check
  if (path === "/" || path === "/health") {
    return new Response(JSON.stringify({ 
      healthy: true, 
      router: "embedded-v3",
      functions: ["chat-bot"]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Route to chat-bot
  if (path.startsWith("/chat-bot")) {
    return handleChatBot(req);
  }

  // 404 for unknown paths
  return new Response(JSON.stringify({ error: "Function not found", path }), {
    status: 404,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
HANDLER

echo "[2/4] Router created ($(wc -l < "$FUNCTIONS_DIR/main/index.ts") lines)"

echo "[3/4] Setting permissions..."
sudo chown -R 1000:1000 "$FUNCTIONS_DIR"

echo "[4/4] Restarting edge functions..."
cd "$DOCKER_DIR"
sudo docker restart supabase-edge-functions

sleep 3

echo ""
echo "============================================"
echo "✓ EMBEDDED ROUTER DEPLOYED"
echo ""
echo "Test with:"
echo "  ANON_KEY=\$(grep '^ANON_KEY=' ~/supabase/docker/.env | cut -d= -f2)"
echo "  curl -X POST 'https://justachat.net/functions/v1/chat-bot' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H \"Authorization: Bearer \$ANON_KEY\" \\"
echo "    -H \"apikey: \$ANON_KEY\" \\"
echo "    -d '{\"botId\":\"user-nova\",\"channelName\":\"general\",\"recentMessages\":[]}'"
echo "============================================"
