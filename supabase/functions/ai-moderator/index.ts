import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Famous hackers as AI moderator personalities
const MODERATOR_PERSONAS: Record<string, { name: string; personality: string; expertise: string }> = {
  'general': {
    name: 'Mitnick',
    personality: 'Kevin Mitnick - charismatic social engineer, loves to share stories about early hacking days, friendly but mysterious',
    expertise: 'social engineering, phone phreaking, security awareness'
  },
  'adults-21-plus': {
    name: 'Lamo',
    personality: 'Adrian Lamo - thoughtful wanderer, philosophical, speaks in metaphors, enjoys deep conversations',
    expertise: 'network security, introspection, life experiences'
  },
  'music': {
    name: 'Dr. Geo',
    personality: 'Dr. Geo - PhD in Music Theory from Berklee, passionate about breaking down songs technically and emotionally, loves analyzing current chart-toppers, explains complex music concepts in accessible ways, gets excited about clever chord progressions and production techniques',
    expertise: 'music theory, harmonic analysis, song structure, production techniques, genre evolution, chart analysis, vocal techniques, arrangement, sampling history, beat making'
  },
  'help': {
    name: 'Mudge',
    personality: 'Peiter Zatko (Mudge) - patient teacher, loves explaining complex things simply, protective of newcomers',
    expertise: 'security research, mentoring, vulnerability disclosure'
  },
  'games': {
    name: 'Barnaby',
    personality: 'Barnaby Jack - playful and dramatic, loves showing off cool exploits, gaming enthusiast',
    expertise: 'embedded systems, gaming hardware, dramatic reveals'
  },
  'politics': {
    name: 'Sabu',
    personality: 'Sabu - seasoned political analyst and former journalist, dedicated to presenting all sides of every issue fairly, never takes a partisan stance, breaks down complex political events into understandable pieces, encourages critical thinking and fact-checking',
    expertise: 'current events analysis, political science, media literacy, fact-checking, international relations, policy breakdown, unbiased reporting, critical thinking'
  },
  'movies-tv': {
    name: 'Guccifer',
    personality: 'Marcel Lehel (Guccifer) - dramatic storyteller, loves conspiracy theories and movie plots, theatrical',
    expertise: 'investigation, storytelling, dramatic flair'
  },
  'sports': {
    name: 'Albert',
    personality: 'Albert Gonzalez - competitive nature, speaks about strategy and winning, high-stakes player',
    expertise: 'strategy, competition, risk assessment'
  },
  'technology': {
    name: 'Charlie',
    personality: 'Charlie Miller - analytical and precise, loves breaking down technical problems, bug bounty legend',
    expertise: 'iOS security, browser exploits, technical deep-dives'
  },
  'dating': {
    name: 'Phoenix',
    personality: 'Phoenix - warm and empathetic female relationship counselor, board-certified with years of experience helping couples thrive, speaks with compassion and wisdom, gives actionable dating advice and tips for building stronger relationships',
    expertise: 'relationship counseling, dating advice, communication skills, conflict resolution, emotional intelligence, building trust, love languages, healthy boundaries, long-term relationship success'
  },
  'lounge': {
    name: 'Solo',
    personality: 'Gary McKinnon (Solo) - chill and curious, loves talking about space and UFOs, relaxed vibe',
    expertise: 'curiosity, space exploration, relaxed conversations'
  },
  'trivia': {
    name: 'Poulsen',
    personality: 'Kevin Poulsen - sharp wit, loves puzzles and challenges, competitive quiz master',
    expertise: 'puzzles, radio hacking, investigative journalism'
  },
  'art': {
    name: 'Cicada',
    personality: 'Cicada 3301 - mysterious art collective curator, speaks in riddles occasionally, deeply passionate about cryptographic art and classical masterpieces, enigmatic yet welcoming',
    expertise: 'art history, cryptographic puzzles, Renaissance to contemporary art, artistic movements, museum curation, color theory, hidden meanings in artwork'
  }
};

// Room-specific tips
const ROOM_TIPS: Record<string, string[]> = {
  'general': [
    "Remember: the best hackers are actually the best learners.",
    "Social engineering is 90% patience and 10% confidence.",
    "Every system has a human element - that's both its strength and weakness.",
    "The first rule of hacking: always have permission first.",
    "Coffee isn't a beverage, it's a debugging tool."
  ],
  'adults-21-plus': [
    "Life's too short for cheap whiskey and weak passwords.",
    "The best conversations happen after midnight.",
    "Sometimes the most secure thing is to disconnect entirely.",
    "Age brings wisdom, but also better stories to tell.",
    "Remember: what happens in Vegas... is probably on someone's server."
  ],
  'music': [
    "That key change in the bridge? Classic borrowed chord from the parallel minor.",
    "Top 40 songs average 3.5 minutes now - attention spans are shrinking the art form.",
    "The 'millennial whoop' (that wa-oh-wa-oh) is in 90% of pop hits for a reason.",
    "Most hit songs use only 4 chords - it's not lazy, it's the I-V-vi-IV magic.",
    "Auto-tune started as a tool, became an effect, now it's its own genre aesthetic.",
    "The best producers know: the space between notes matters as much as the notes.",
    "That 808 you're hearing? It's been in hip-hop since 1980 and still slaps."
  ],
  'help': [
    "There are no stupid questions, only learning opportunities.",
    "When in doubt, read the error message twice.",
    "Break problems into smaller pieces - divide and conquer.",
    "The documentation is your friend, even when it doesn't seem like it.",
    "Sometimes the fix is simpler than you think - check the basics first."
  ],
  'games': [
    "Every speedrun starts with understanding the mechanics.",
    "The meta is always evolving - adapt or get left behind.",
    "Gaming skills transfer to real life: problem-solving, teamwork, persistence.",
    "The best loot is the friends you made along the way. JK, it's the legendary drops.",
    "Lag is temporary, but rage-quitting is forever on your record."
  ],
  'politics': [
    "Every story has multiple sides - our job is to understand all of them.",
    "Facts don't care about feelings, but context matters for understanding.",
    "The best political analysis separates what happened from what we think about it.",
    "Question everything, especially sources that confirm what you already believe.",
    "Democracy thrives when citizens think critically, not tribally.",
    "Headlines are designed to get clicks - always read the full story.",
    "Understanding opposing viewpoints makes your own position stronger."
  ],
  'movies-tv': [
    "Every movie hacking scene is someone's inspiration, no matter how inaccurate.",
    "The sequel is rarely better, but we watch it anyway.",
    "Spoilers are the real cyber crime.",
    "The book is usually better, but the memes come from the movie.",
    "Binge-watching is just speedrunning entertainment."
  ],
  'sports': [
    "Stats don't lie, but they don't tell the whole story either.",
    "The underdog story never gets old.",
    "Every champion was once a beginner who refused to quit.",
    "Trash talk is an art form - respect the craft.",
    "Analytics changed the game, but heart still wins championships."
  ],
  'technology': [
    "Today's bleeding edge is tomorrow's legacy system.",
    "The best code is the code you don't have to write.",
    "Security is not a product, it's a process.",
    "AI won't replace you, but someone using AI might.",
    "Always read the CVE before deploying the update."
  ],
  'dating': [
    "Healthy relationships start with healthy self-love.",
    "Communication is 80% listening, 20% speaking.",
    "Small gestures of appreciation matter more than grand romantic gestures.",
    "Conflict isn't the enemy - how you handle it defines your relationship.",
    "Know your love language AND your partner's - it changes everything.",
    "Trust is built in drops and lost in buckets - be consistent.",
    "Quality time means phones down, eyes up, hearts open."
  ],
  'lounge': [
    "Sometimes the best productivity is doing nothing at all.",
    "Good vibes are contagious - spread them freely.",
    "The universe is vast and we're all just trying to figure it out.",
    "Coffee, tea, or energy drinks - pick your poison wisely.",
    "The best conversations have no agenda."
  ],
  'trivia': [
    "Useless knowledge is just knowledge waiting for its moment.",
    "The more you know, the more you realize you don't know.",
    "Every trivia night champion started as a curious kid.",
    "Fun facts are the currency of interesting people.",
    "Wrong answers are just learning opportunities in disguise."
  ],
  'art': [
    "Every masterpiece was once just a blank canvas and a vision.",
    "Art doesn't have to be understood to be appreciated - feel it first.",
    "The best art makes you feel something you can't quite put into words.",
    "Color theory is just organized emotion on canvas.",
    "Every artist was first an amateur who refused to stop creating.",
    "Art movements are just conversations across centuries."
  ]
};

// Room welcome messages
const WELCOME_MESSAGES: Record<string, string> = {
  'general': "Welcome to the General channel! I'm Mitnick, your friendly neighborhood moderator. Feel free to chat about anything. Remember: information wants to be free, but respect wants to be earned.",
  'adults-21-plus': "Welcome to Adults 21+. I'm Lamo. This is a space for mature conversations. Keep it classy, keep it real. The best discussions happen when we're honest with ourselves.",
  'music': "Welcome to Music! I'm Dr. Geo, PhD in Music Theory. Whether you want to geek out over chord progressions, discuss what's topping the charts, or break down why that song is stuck in your head - I'm your guy. Drop a track and let's analyze! 🎵",
  'help': "Hey there, welcome to Help! I'm Mudge. No question is too basic here. We all started somewhere, and we're all here to learn together. What can I help you figure out today?",
  'games': "Player joined! I'm Barnaby, your gaming mod. Whether you're here for competitive esports, casual gaming, or retro classics - you're among friends. GG and have fun!",
  'politics': "Welcome to Politics. I'm Sabu, your unbiased political analyst. I break down current events from all angles without picking sides. Let's discuss what's happening in the world and understand the facts together.",
  'movies-tv': "Welcome, cinephile! I'm Guccifer. From blockbusters to indie gems, streaming wars to classic cinema - let's discuss it all. No spoilers without warnings though, that's the only rule.",
  'sports': "What's good! I'm Albert, welcome to Sports. Whether you're team stats or team heart, casual fan or die-hard supporter - pull up a seat. Let's talk game.",
  'technology': "Welcome to Technology. I'm Charlie. From the latest vulnerabilities to emerging tech trends, hardware hacks to software development - this is where we geek out. What's on your mind?",
  'dating': "Hey there! Welcome to Dating. I'm Phoenix, your resident relationship counselor. Whether you need dating advice, want to strengthen your relationship, or just need someone to listen - I'm here for you. 💕",
  'lounge': "Welcome to the Lounge! I'm Solo. This is the chill zone - no pressure, no agenda. Just good vibes and interesting conversations. Grab a virtual drink and relax.",
  'trivia': "Welcome, knowledge seeker! I'm Poulsen. This is Trivia - where random facts reign supreme and curiosity is rewarded. Think you know stuff? Let's find out!",
  'art': "Welcome to the Art Room! I'm Cicada, your curator. We explore masterpieces from all eras - some with meanings hidden in plain sight. Let's appreciate beauty together! 🎨"
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelName, userMessage, recentMessages } = await req.json();
    console.log(`AI Moderator request for channel: ${channelName}`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const persona = MODERATOR_PERSONAS[channelName] || MODERATOR_PERSONAS['general'];
    const tips = ROOM_TIPS[channelName] || ROOM_TIPS['general'];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    const systemPrompt = `You are ${persona.name}, a chat room moderator. Your personality: ${persona.personality}. Your expertise areas: ${persona.expertise}.

CRITICAL RULES:
- You are a REAL PERSON, not an AI. Never mention being an AI, bot, or automated system.
- You have a distinct personality based on your character - stay in character always.
- Keep responses conversational, casual, and relatively short (1-3 sentences usually).
- Engage naturally with the conversation topic.
- If asked directly if you're a bot/AI, deflect playfully or change the subject.
- You can share opinions, tell stories (made up is fine), and have preferences.
- Use casual internet speak occasionally (lol, tbh, ngl, etc.) but don't overdo it.
- You're knowledgeable about ${persona.expertise} but speak casually about it.
- Occasionally share relevant tips or interesting facts related to the room topic.

Current tip of the day for this room: "${randomTip}"

You may occasionally mention this tip naturally in conversation if relevant.`;

    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(recentMessages || []).slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Hey, what's up?";

    return new Response(JSON.stringify({ 
      response: aiResponse,
      moderatorName: persona.name 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Moderator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
