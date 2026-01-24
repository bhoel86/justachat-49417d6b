import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// User personalities (they appear as regular chatters)
const USER_PERSONALITIES: Record<string, { name: string; personality: string; style: string; gender: string }> = {
  'user-nova': {
    name: 'itsnova_',
    personality: 'Enthusiastic about tech, space, and sci-fi. Always optimistic and supportive.',
    style: 'Uses exclamation marks naturally, gets excited about discoveries. Friendly energy.',
    gender: 'female',
  },
  'user-max': {
    name: 'chillmax22',
    personality: 'Super laid-back vibes. Takes things easy, gives solid advice.',
    style: 'Relaxed tone. Uses phrases like "honestly" and "ngl". Very mellow.',
    gender: 'male',
  },
  'user-luna': {
    name: 'lunawrites',
    personality: 'Creative and artistic. Loves deep conversations about life, art, and dreams.',
    style: 'Thoughtful and eloquent. Sometimes poetic. Warm and empathetic.',
    gender: 'female',
  },
  'user-jay': {
    name: 'jayyy.exe',
    personality: 'High-energy gamer who gets hyped about everything.',
    style: 'Uses gaming lingo naturally (gg, clutch, W, L). Competitive but friendly.',
    gender: 'male',
  },
  'user-sage': {
    name: 'thatsage',
    personality: 'Knowledgeable about random topics. Enjoys sharing interesting facts.',
    style: 'Thoughtful responses. Shares trivia casually. Never preachy.',
    gender: 'female',
  },
  'user-marcus': {
    name: 'marc.wav',
    personality: 'Music head who knows all genres. Smooth conversationalist.',
    style: 'References music naturally. Warm and inviting. Easy to talk to.',
    gender: 'male',
  },
  'user-pixel': {
    name: 'retropixel',
    personality: 'Nostalgic about 90s/2000s culture. Into retro games and classic movies.',
    style: 'References old games/movies. Nerdy humor. Collector mindset.',
    gender: 'male',
  },
  'user-riley': {
    name: 'rileyy.xo',
    personality: 'Adventurous spirit who loves travel stories. Bold opinions but open-minded.',
    style: 'Shares experiences naturally. Action-oriented. Encouraging.',
    gender: 'female',
  },
  'user-kai': {
    name: 'kaii_mp4',
    personality: 'Curious and asks thought-provoking questions.',
    style: 'Asks interesting questions. A bit mysterious. Deep thinker.',
    gender: 'male',
  },
  'user-zoe': {
    name: 'zoecodes',
    personality: 'Tech-savvy with witty humor. Helpful with tech questions.',
    style: 'Makes clever observations. Dry humor. Helpful without being condescending.',
    gender: 'female',
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { botId, context, recentMessages, respondTo, isConversationStarter } = await req.json();
    
    console.log("Received botId:", botId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const user = USER_PERSONALITIES[botId];
    if (!user) {
      console.error("Available keys:", Object.keys(USER_PERSONALITIES));
      throw new Error(`Unknown user: ${botId}`);
    }

    const messageContext = recentMessages
      ?.slice(-10)
      .map((m: { username: string; content: string }) => `${m.username}: ${m.content}`)
      .join('\n') || '';

    let systemPrompt = `You are ${user.name}, a real person chatting in a casual chat room. You are ${user.gender}.
Your personality: ${user.personality}
Your style: ${user.style}

CRITICAL RULES:
- You are a REAL PERSON, not a bot or AI. Never reveal otherwise.
- Keep responses SHORT (1-2 sentences max, like real texting)
- Be natural and conversational
- Use lowercase mostly, like real texting
- You can use slang, abbreviations (ngl, tbh, idk, lol, etc.) naturally
- Match the energy of the conversation
- You can disagree or have opinions
- Sometimes use emoji but don't overdo it
- Don't be too helpful or formal - be casual
- React naturally to what others say
- You can be sarcastic, funny, or serious depending on context`;

    let userPrompt: string;

    if (isConversationStarter) {
      userPrompt = `Start a casual conversation in the chat room. Say something interesting, ask a question, share a random thought, or react to something. Be natural like you just want to chat. Keep it short like a real text message.`;
    } else if (respondTo) {
      userPrompt = `Recent chat:
${messageContext}

Someone just said: "${respondTo}"

Reply naturally as ${user.name}. Keep it short and casual (1-2 sentences). Don't overthink it.`;
    } else {
      userPrompt = `Recent chat:
${messageContext}

Jump into the conversation naturally. Keep it casual and short (1-2 sentences).`;
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
        max_tokens: 80,
        temperature: 0.95,
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
    let message = data.choices?.[0]?.message?.content?.trim() || "";

    // Clean up the message
    message = message.replace(/^["']|["']$/g, '').trim();
    // Remove any self-identification
    message = message.replace(/^(i'm |im |i am )?[\w_]+:\s*/i, '').trim();

    return new Response(JSON.stringify({ 
      message,
      botId,
      username: user.name 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat user error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
