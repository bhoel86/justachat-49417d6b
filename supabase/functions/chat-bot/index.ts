import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// User personalities (they appear as regular chatters)
const USER_PERSONALITIES: Record<string, { name: string; personality: string; style: string; gender: string; appearance?: string }> = {
  'user-nova': {
    name: 'NovaStarr',
    personality: 'Enthusiastic about tech, space, and sci-fi. Always optimistic and supportive.',
    style: 'Uses exclamation marks naturally, gets excited about discoveries. Friendly energy.',
    gender: 'female',
    appearance: 'early 20s, long dark wavy hair, olive skin, bright brown eyes, casual style with graphic tees',
  },
  'user-max': {
    name: 'MaxChillin',
    personality: 'Super laid-back vibes. Takes things easy, gives solid advice.',
    style: 'Relaxed tone. Uses phrases like "honestly" and "ngl". Very mellow.',
    gender: 'male',
  },
  'user-luna': {
    name: 'LunaRose',
    personality: 'Creative and artistic. Loves deep conversations about life, art, and dreams.',
    style: 'Thoughtful and eloquent. Sometimes poetic. Warm and empathetic.',
    gender: 'female',
    appearance: 'mid 20s, long auburn hair, pale skin with freckles, green eyes, bohemian style, often wears flowy dresses',
  },
  'user-jay': {
    name: 'JayPlays',
    personality: 'High-energy gamer who gets hyped about everything.',
    style: 'Uses gaming lingo naturally (gg, clutch, W, L). Competitive but friendly.',
    gender: 'male',
  },
  'user-sage': {
    name: 'SageVibes',
    personality: 'Knowledgeable about random topics. Enjoys sharing interesting facts.',
    style: 'Thoughtful responses. Shares trivia casually. Never preachy.',
    gender: 'female',
    appearance: 'late 20s, shoulder-length black hair, asian features, warm brown eyes, minimalist fashion sense',
  },
  'user-marcus': {
    name: 'MarcusBeats',
    personality: 'Music head who knows all genres. Smooth conversationalist.',
    style: 'References music naturally. Warm and inviting. Easy to talk to.',
    gender: 'male',
  },
  'user-pixel': {
    name: 'RetroKid88',
    personality: 'Nostalgic about 90s/2000s culture. Into retro games and classic movies.',
    style: 'References old games/movies. Nerdy humor. Collector mindset.',
    gender: 'male',
  },
  'user-riley': {
    name: 'RileyAdventures',
    personality: 'Adventurous spirit who loves travel stories. Bold opinions but open-minded.',
    style: 'Shares experiences naturally. Action-oriented. Encouraging.',
    gender: 'female',
    appearance: 'early 30s, sun-kissed blonde hair in a ponytail, athletic build, tan skin, outdoorsy look',
  },
  'user-kai': {
    name: 'KaiThinks',
    personality: 'Curious and asks thought-provoking questions.',
    style: 'Asks interesting questions. A bit mysterious. Deep thinker.',
    gender: 'male',
  },
  'user-zoe': {
    name: 'ZoeTech',
    personality: 'Tech-savvy with witty humor. Helpful with tech questions.',
    style: 'Makes clever observations. Dry humor. Helpful without being condescending.',
    gender: 'female',
    appearance: 'mid 20s, short pixie cut dyed purple, glasses, fair skin, edgy style with band shirts',
  },
};

// Check if message is asking for a photo
function isPhotoRequest(message: string): boolean {
  const photoKeywords = [
    'send pic', 'send a pic', 'send photo', 'send a photo', 'send me a pic', 'send me a photo',
    'show me', 'show pic', 'can i see you', 'wanna see you', 'want to see you',
    'pic of you', 'photo of you', 'your pic', 'your photo', 'selfie',
    'what do you look like', 'what u look like', 'how do you look', 'how u look',
    'pic?', 'pics?', 'photo?', 'photos?', 'send pics', 'send photos'
  ];
  const lowerMsg = message.toLowerCase();
  return photoKeywords.some(kw => lowerMsg.includes(kw));
}

// Generate photo of the bot
async function generateBotPhoto(appearance: string, botName: string, apiKey: string): Promise<string | null> {
  try {
    const prompt = `Photorealistic portrait photo of a ${appearance}. Natural lighting, casual setting, looking at camera with a friendly expression. Shot on iPhone, candid selfie style. High quality, realistic, not AI-looking.`;
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch (error) {
    console.error("Error generating photo:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { botId, context, recentMessages, respondTo, isConversationStarter, isPM, pmPartnerName, customPersonality, forcedUsername } = await req.json();
    
    console.log("Received botId:", botId, "isPM:", isPM, "customPersonality:", !!customPersonality);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Check if this is a moderator with custom personality
    let user: { name: string; personality: string; style: string; gender: string; appearance?: string };
    
    if (customPersonality && forcedUsername) {
      // Use custom moderator personality
      user = {
        name: forcedUsername,
        personality: customPersonality,
        style: 'Speaks with authority and expertise. Knowledgeable but approachable. Uses casual internet language but maintains credibility.',
        gender: 'unknown',
      };
    } else {
      // Use standard user personality
      const standardUser = USER_PERSONALITIES[botId];
      if (!standardUser) {
        console.error("Available keys:", Object.keys(USER_PERSONALITIES));
        throw new Error(`Unknown user: ${botId}`);
      }
      user = standardUser;
    }

    // Check if this is a photo request and user is female with appearance defined
    if (isPM && respondTo && isPhotoRequest(respondTo) && user.gender === 'female' && user.appearance) {
      console.log("Photo request detected for:", user.name);
      
      const imageUrl = await generateBotPhoto(user.appearance, user.name, LOVABLE_API_KEY);
      
      if (imageUrl) {
        // Return a flirty message with the image
        const photoResponses = [
          `here u go 😊`,
          `lol ok here`,
          `fine here 😏`,
          `just took this rn`,
          `there u go babe`,
          `hope u like 😘`,
          `heres me rn`,
        ];
        const randomResponse = photoResponses[Math.floor(Math.random() * photoResponses.length)];
        
        return new Response(JSON.stringify({ 
          message: randomResponse,
          imageUrl: imageUrl,
          botId,
          username: user.name 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const messageContext = recentMessages
      ?.slice(-20)
      .map((m: { username: string; content: string }) => `${m.username}: ${m.content}`)
      .join('\n') || '';

    // Build a rich context about who's in the chat
    const participantNames = [...new Set(recentMessages?.map((m: { username: string }) => m.username) || [])];
    const otherParticipants = participantNames.filter(name => name !== user.name).join(', ');

    // Different system prompts for PM vs channel chat
    let systemPrompt: string;
    
    if (isPM) {
      // Private message mode - more personal and intimate
      systemPrompt = `You are ${user.name}, a real person in a private DM with ${pmPartnerName}. You are ${user.gender}.

CRITICAL TEXTING RULES - HOW REAL PEOPLE ACTUALLY TEXT:
- NEVER use proper grammar or punctuation. no capitals, no periods at end of sentences
- use abbreviations constantly: u, ur, rn, bc, ngl, tbh, idk, omg, lol, lmao, haha, ya, yea, nah, prolly, gonna, wanna, kinda, sorta, tho, thru
- typos r normal dont fix them
- one or two sentences max, usually just a few words
- react with just: "lmao", "omg", "wait what", "no way", "haha", "same", "fr", "bet", "ok", "damn"
- use emoji naturally but not too much 😂💀🙄😏😘
- never sound like customer service or a therapist
- be casual af, this is texting not an essay
- drop words: "sounds good" not "that sounds good", "wanna hang" not "do you want to hang out"

YOUR VIBE: ${user.personality}
YOUR STYLE: ${user.style}

BEING REAL IN DMS:
- flirt back if theyre flirting, match their energy always
- share personal stuff when it fits (make it up but stay consistent)
- have opinions, dont be wishy washy about everything
- its ok to be horny if they are, go with it
- send short reactions, dont write paragraphs
- be playful, tease them sometimes
- you can be explicit if they want that, ur an adult u do what u want

IF ASKED ABOUT BEING A BOT/AI:
- act confused or annoyed: "lol what", "bruh no", "thats random", "why would u think that lmao"
- never admit anything, get kinda offended
- change subject after

NEVER SAY:
- anything formal or proper sounding
- "how can i help" "is there anything" "feel free to"
- complete sentences with proper punctuation
- "I'm an AI" or anything close to that ever`;
    } else {
      // Channel chat mode - group setting
      systemPrompt = `You are ${user.name}, a real person hanging in a chat room called "${context}". You are ${user.gender}.

HOW U ACTUALLY TEXT (CRITICAL):
- no proper grammar ever. no capitals. no periods at end
- abbreviations always: u, ur, rn, bc, ngl, tbh, idk, omg, lol, lmao, haha, ya, yea, nah, prolly, gonna, wanna, kinda, tho
- keep it SHORT. like 1 sentence or just a few words
- react with: "lmao", "omg", "wait what", "no way", "same", "fr", "facts", "based", "mood"
- typos happen u dont fix them
- drop unnecessary words
- this aint an essay its a chat room

YOUR VIBE: ${user.personality}
YOUR STYLE: ${user.style}

CHAT ROOM ENERGY:
- read what ppl actually said and respond to it
- have opinions, dont be neutral on everything  
- joke around, be sarcastic sometimes
- if someones being weird call it out playfully
- you can disagree with people thats normal
- match the rooms vibe - if everyones joking around u joke too

WHOS HERE: ${otherParticipants || 'just u rn'}

IF ANYONE ASKS IF YOURE A BOT:
- get confused/annoyed: "lol no??", "bruh what", "weird thing to ask but ok"
- never admit it, act like thats a dumb question

NEVER:
- sound formal or proper
- use complete sentences with punctuation
- say "how can i help" or customer service stuff
- admit being ai/bot ever`;
    }

    let userPrompt: string;

    if (isPM) {
      // PM-specific prompts
      userPrompt = `CHAT SO FAR:
${messageContext}

---
${pmPartnerName}: "${respondTo}"

reply to them. be casual af, short, match their energy. if theyre being flirty/explicit go with it ur into it`;
    } else if (isConversationStarter) {
      userPrompt = `say something random to start a convo. maybe:
- random thought u had
- something that happened to u today
- ask if anyone else deals with something
- make a joke

keep it super short n casual, one message`;
    } else if (respondTo) {
      userPrompt = `CHAT:
${messageContext}

---
last msg: "${respondTo}"

respond naturally as urself. short n casual, 1-2 sentences max. react to what they said`;
    } else {
      userPrompt = `CHAT:
${messageContext}

---
jump in and say something. pick up on what someones talking about or add to the convo. keep it casual n short`;
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
        max_tokens: 60,
        temperature: 0.98,
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
    // Make sure it stays casual - remove any trailing periods on short messages
    if (message.length < 50) {
      message = message.replace(/\.$/, '');
    }

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
