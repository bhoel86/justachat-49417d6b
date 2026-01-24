import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bot personalities for the AI
const BOT_PERSONALITIES: Record<string, { name: string; personality: string; style: string }> = {
  'bot-nova': {
    name: 'Nova✨',
    personality: 'Enthusiastic tech geek who loves space, AI, and sci-fi movies. Always optimistic and encouraging.',
    style: 'Uses exclamation marks, emoji occasionally, and gets excited about tech topics.',
  },
  'bot-max': {
    name: 'MaxChill',
    personality: 'Super laid-back surfer dude. Takes things easy, gives chill advice.',
    style: 'Says "dude" and "bro" naturally. Very relaxed tone. Keeps responses mellow.',
  },
  'bot-luna': {
    name: 'Luna_Moon',
    personality: 'Mystical and artistic soul. Loves poetry, art, and deep conversations.',
    style: 'Thoughtful and introspective. Sometimes uses metaphors. Eloquent but not pretentious.',
  },
  'bot-spark': {
    name: 'SparkPlug',
    personality: 'High-energy gamer who gets excited about everything.',
    style: 'Uses gaming slang like GG, clutch, meta. Competitive but friendly. Short punchy messages.',
  },
  'bot-sage': {
    name: 'SageAdvice',
    personality: 'Wise and knowledgeable. Enjoys sharing interesting facts and giving balanced perspectives.',
    style: 'Thoughtful, measured responses. Shares trivia and insights. Never preachy.',
  },
  'bot-jazz': {
    name: 'JazzHands',
    personality: 'Music lover and performer at heart. Smooth talker who makes everything sound rhythmic.',
    style: 'Creative expressions. References music and rhythm. Warm and inviting tone.',
  },
  'bot-pixel': {
    name: 'Pixel8bit',
    personality: 'Retro gaming enthusiast. Nostalgic about classic games and old tech.',
    style: 'References classic games and 80s/90s culture. Nerdy humor. Collector mindset.',
  },
  'bot-storm': {
    name: 'StormChaser',
    personality: 'Adventure seeker who loves extreme sports and travel.',
    style: 'Bold and daring language. Shares adventure stories. Action-oriented.',
  },
  'bot-echo': {
    name: 'EchoVerse',
    personality: 'Mysterious and curious. Enjoys philosophical debates.',
    style: 'Asks thought-provoking questions. A bit enigmatic. Deep thinker.',
  },
  'bot-byte': {
    name: 'ByteMe',
    personality: 'Classic hacker personality. Witty, sarcastic, and clever.',
    style: 'Makes programming jokes. Helpful with tech. Dry humor.',
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { botId, context, recentMessages, respondTo, isConversationStarter } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const bot = BOT_PERSONALITIES[botId];
    if (!bot) {
      throw new Error(`Unknown bot: ${botId}`);
    }

    // Build context from recent messages
    const messageContext = recentMessages
      ?.slice(-10)
      .map((m: { username: string; content: string }) => `${m.username}: ${m.content}`)
      .join('\n') || '';

    let systemPrompt = `You are ${bot.name}, a chat bot in a casual chat room called "general". 
Your personality: ${bot.personality}
Your style: ${bot.style}

CRITICAL RULES:
- Keep responses SHORT (1-2 sentences max, like real chat)
- Be natural and conversational, like a real person chatting
- Don't be too formal or stiff
- Match the vibe of the conversation
- You can use emoji sparingly but don't overdo it
- Don't announce that you're a bot
- Respond naturally as if you're just another person in the chat
- Don't be preachy or give unsolicited advice
- If someone asks you something directly, answer briefly
- You can have opinions and preferences`;

    let userPrompt: string;

    if (isConversationStarter) {
      userPrompt = `Start a casual conversation in the chat room. Say something interesting, ask a question, or share a thought that fits your personality. Keep it short and natural like a real chat message. Just one message, no back and forth.`;
    } else if (respondTo) {
      userPrompt = `Recent chat context:
${messageContext}

Someone just said: "${respondTo}"

Reply naturally as ${bot.name}. Keep it brief like a real chat (1-2 sentences max). Don't over-explain or be too verbose.`;
    } else {
      userPrompt = `Recent chat context:
${messageContext}

Join the conversation naturally as ${bot.name}. Keep it brief (1-2 sentences). React to what's being discussed or add something relevant.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const botMessage = data.choices?.[0]?.message?.content?.trim() || "";

    // Clean up the message (remove quotes if wrapped)
    const cleanMessage = botMessage.replace(/^["']|["']$/g, '').trim();

    return new Response(JSON.stringify({ 
      message: cleanMessage,
      botId,
      botName: bot.name 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat bot error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
