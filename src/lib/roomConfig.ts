/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Famous hackers as moderator personas
export interface ModeratorInfo {
  name: string;
  displayName: string;
  avatar: string;
}

// Room color themes
export interface RoomTheme {
  textColor: string;       // Tailwind class for text
  bgColor: string;         // Tailwind class for background
  gradient: string;        // Gradient for backgrounds
  accentColor: string;     // HSL accent color
}

export const ROOM_THEMES: Record<string, RoomTheme> = {
  'general': { 
    textColor: 'text-blue-400', 
    bgColor: 'bg-blue-500/20', 
    gradient: 'from-blue-500 to-cyan-500',
    accentColor: '199 89% 48%'
  },
  'adults-21-plus': { 
    textColor: 'text-red-400', 
    bgColor: 'bg-red-500/20', 
    gradient: 'from-red-600 to-pink-600',
    accentColor: '0 84% 60%'
  },
  'music': { 
    textColor: 'text-purple-400', 
    bgColor: 'bg-purple-500/20', 
    gradient: 'from-purple-500 to-pink-500',
    accentColor: '270 76% 60%'
  },
  'help': { 
    textColor: 'text-green-400', 
    bgColor: 'bg-green-500/20', 
    gradient: 'from-green-500 to-emerald-500',
    accentColor: '142 71% 45%'
  },
  'games': { 
    textColor: 'text-orange-400', 
    bgColor: 'bg-orange-500/20', 
    gradient: 'from-orange-500 to-yellow-500',
    accentColor: '25 95% 53%'
  },
  'politics': { 
    textColor: 'text-slate-400', 
    bgColor: 'bg-slate-500/20', 
    gradient: 'from-slate-500 to-zinc-600',
    accentColor: '215 14% 50%'
  },
  'movies-tv': { 
    textColor: 'text-indigo-400', 
    bgColor: 'bg-indigo-500/20', 
    gradient: 'from-indigo-500 to-violet-500',
    accentColor: '239 84% 67%'
  },
  'sports': { 
    textColor: 'text-lime-400', 
    bgColor: 'bg-lime-500/20', 
    gradient: 'from-lime-500 to-green-500',
    accentColor: '84 81% 44%'
  },
  'technology': { 
    textColor: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20', 
    gradient: 'from-cyan-500 to-blue-500',
    accentColor: '188 94% 43%'
  },
  'dating': { 
    textColor: 'text-pink-400', 
    bgColor: 'bg-pink-500/20', 
    gradient: 'from-pink-500 to-rose-500',
    accentColor: '330 81% 60%'
  },
  'lounge': { 
    textColor: 'text-amber-400', 
    bgColor: 'bg-amber-500/20', 
    gradient: 'from-amber-500 to-orange-500',
    accentColor: '38 92% 50%'
  },
  'trivia': { 
    textColor: 'text-teal-400', 
    bgColor: 'bg-teal-500/20', 
    gradient: 'from-teal-500 to-cyan-500',
    accentColor: '174 72% 40%'
  },
  'art': { 
    textColor: 'text-rose-400', 
    bgColor: 'bg-rose-500/20', 
    gradient: 'from-rose-500 to-amber-500',
    accentColor: '350 89% 60%'
  },
};

// Default room topics
export const DEFAULT_TOPICS: Record<string, string> = {
  'general': 'Welcome to the main chat - anything goes!',
  'adults-21-plus': '21+ only - mature conversations welcome',
  'music': 'Share tunes, discuss artists, discover new sounds 🎵',
  'help': 'Got questions? We got answers! No judgment zone 💡',
  'games': 'Gaming discussions, LFG, streams & esports 🎮',
  'politics': 'Unbiased current events analysis & fact-based discussion 📰',
  'movies-tv': 'Full movie breakdowns - budgets, salaries, behind-the-scenes 🎬',
  'sports': 'All sports talk - scores, trades, fantasy 🏆',
  'technology': 'Tech news, coding, gadgets & innovations 💻',
  'dating': 'Connection & relationship discussions 💕',
  'lounge': 'Chill vibes only - unwind and relax ☕',
  'trivia': 'Test your knowledge! Type /trivia to play 🧠',
  'art': 'Art appreciation from all eras - masterpieces discussed daily 🎨',
};

export const MODERATORS: Record<string, ModeratorInfo> = {
  'general': { name: 'Sam', displayName: 'Community Host', avatar: '👋' },
  'adults-21-plus': { name: 'Jordan', displayName: 'Lounge Host', avatar: '🌙' },
  'music': { name: 'Melody', displayName: 'Music Guide', avatar: '🎵' },
  'help': { name: 'Alex', displayName: 'Support Guide', avatar: '💡' },
  'games': { name: 'Max', displayName: 'Gaming Host', avatar: '🎮' },
  'politics': { name: 'Don', displayName: 'Political Commentator', avatar: '🇺🇸' },
  'movies-tv': { name: 'Reel', displayName: 'Film Critic', avatar: '🎬' },
  'sports': { name: 'Coach', displayName: 'Sports Analyst', avatar: '🏆' },
  'technology': { name: 'Byte', displayName: 'Tech Guide', avatar: '💻' },
  'dating': { name: 'Heart', displayName: 'Connection Coach', avatar: '💕' },
  'lounge': { name: 'Zen', displayName: 'Chill Host', avatar: '☕' },
  'trivia': { name: 'Quiz', displayName: 'Trivia Host', avatar: '🧠' },
  'art': { name: 'Canvas', displayName: 'Art Curator', avatar: '🎨' },
  'voice-chat': { name: 'Echo', displayName: 'Voice Host', avatar: '🎙️' },
  'video-chat': { name: 'Pixel', displayName: 'Video Host', avatar: '📹' },
};

// Room welcome messages (kept concise to avoid chat clutter)
export const WELCOME_MESSAGES: Record<string, string> = {
  'general': "Hey! I'm Sam, your community host. Chat freely! 👋",
  'adults-21-plus': "I'm Jordan. Adults only, keep it classy. 🌙",
  'music': "I'm Melody, your music guide. Let's talk tunes! 🎧",
  'help': "I'm Alex. No dumb questions here. 💡",
  'games': "I'm Max. GG and have fun! 🕹️",
  'politics': "I'm Don. Politics - tremendous topic, believe me. Let's talk about what's happening! 🇺🇸",
  'movies-tv': "I'm Reel, your film critic. Drop a movie and I'll break it down. 🎬",
  'sports': "I'm Coach. Let's talk game. 🏆",
  'technology': "I'm Byte. Let's geek out. 🔧",
  'dating': "Hey! I'm Heart, your connection coach. 💕",
  'lounge': "I'm Zen. Chill zone. ☕",
  'trivia': "I'm Quiz. Test your knowledge! 🎯",
  'art': "I'm Canvas, your art curator. Let's explore masterpieces! 🖼️",
  'voice-chat': "Hey, I'm Echo! Ready to vibe. 🎙️",
  'video-chat': "I'm Pixel. Camera on, let's go! 📹",
};

// Tips of the day per room
export const TIPS_OF_THE_DAY: Record<string, string[]> = {
  'general': [
    "💡 Tip: The best conversations start with genuine curiosity.",
    "💡 Tip: Respect goes a long way in building community.",
    "💡 Tip: Coffee isn't a beverage, it's a lifestyle.",
  ],
  'adults-21-plus': [
    "💡 Tip: Life's too short for cheap whiskey and weak passwords.",
    "💡 Tip: The best conversations happen after midnight.",
    "💡 Tip: Age brings wisdom, but also better stories to tell.",
  ],
  'music': [
    "🎵 Tip: That key change in the bridge? Classic borrowed chord from the parallel minor.",
    "🎵 Tip: Most hit songs use only 4 chords - it's the I-V-vi-IV magic.",
    "🎵 Tip: The space between notes matters as much as the notes themselves.",
    "🎵 Tip: Auto-tune started as a tool, became an effect, now it's its own aesthetic.",
    "🎵 Tip: The best hooks are melodically simple but rhythmically interesting.",
  ],
  'help': [
    "💡 Tip: There are no stupid questions, only learning opportunities.",
    "💡 Tip: When in doubt, read the error message twice.",
    "💡 Tip: Sometimes the fix is simpler than you think.",
  ],
  'games': [
    "💡 Tip: Every speedrun starts with understanding the mechanics.",
    "💡 Tip: The meta is always evolving - adapt or get left behind.",
    "💡 Tip: Lag is temporary, but rage-quitting is forever on your record.",
  ],
  'politics': [
    "📰 Tip: Every story has multiple sides - understand all of them.",
    "📰 Tip: Facts don't care about feelings, but context matters.",
    "📰 Tip: Question sources that only confirm what you already believe.",
    "📰 Tip: Headlines are designed for clicks - always read the full story.",
    "📰 Tip: Understanding opposing viewpoints makes your position stronger.",
  ],
  'movies-tv': [
    "🎬 Tip: A-listers often take pay cuts for backend deals - that's the real money.",
    "🎬 Tip: Box office needs 2.5x budget to break even after marketing costs.",
    "🎬 Tip: Oscar campaigns cost studios millions - awards are literally bought.",
    "🎬 Tip: Most 'overnight success' actors struggled for 10+ years first.",
    "🎬 Tip: Behind every great movie is a production nightmare they buried.",
  ],
  'sports': [
    "💡 Tip: Stats don't lie, but they don't tell the whole story either.",
    "💡 Tip: Every champion was once a beginner who refused to quit.",
    "💡 Tip: Analytics changed the game, but heart still wins championships.",
  ],
  'technology': [
    "💡 Tip: Today's bleeding edge is tomorrow's legacy system.",
    "💡 Tip: The best code is the code you don't have to write.",
    "💡 Tip: Security is not a product, it's a process.",
  ],
  'dating': [
    "💕 Tip: Healthy relationships start with healthy self-love.",
    "💕 Tip: Communication is 80% listening, 20% speaking.",
    "💕 Tip: Small gestures of appreciation matter more than grand romantic gestures.",
    "💕 Tip: Know your love language AND your partner's - it changes everything.",
    "💕 Tip: Trust is built in drops and lost in buckets - be consistent.",
  ],
  'lounge': [
    "💡 Tip: Sometimes the best productivity is doing nothing at all.",
    "💡 Tip: Good vibes are contagious - spread them freely.",
    "💡 Tip: The best conversations have no agenda.",
  ],
  'trivia': [
    "💡 Tip: Useless knowledge is just knowledge waiting for its moment.",
    "💡 Tip: Every trivia night champion started as a curious kid.",
    "💡 Tip: Wrong answers are just learning opportunities in disguise.",
  ],
  'art': [
    "🎨 Tip: Every masterpiece was once just a blank canvas and a vision.",
    "🎨 Tip: Art doesn't have to be understood to be appreciated.",
    "🎨 Tip: The best art makes you feel something you can't quite name.",
    "🎨 Tip: Color theory is just organized emotion.",
    "🎨 Tip: Every artist was first an amateur who refused to stop.",
  ],
};

export const getRandomTip = (channelName: string): string => {
  const tips = TIPS_OF_THE_DAY[channelName] || TIPS_OF_THE_DAY['general'];
  return tips[Math.floor(Math.random() * tips.length)];
};

export const getModerator = (channelName: string): ModeratorInfo => {
  return MODERATORS[channelName] || MODERATORS['general'];
};

export const getWelcomeMessage = (channelName: string): string => {
  return WELCOME_MESSAGES[channelName] || WELCOME_MESSAGES['general'];
};

export const getRoomTheme = (channelName: string): RoomTheme => {
  return ROOM_THEMES[channelName] || ROOM_THEMES['general'];
};

export const getDefaultTopic = (channelName: string): string => {
  return DEFAULT_TOPICS[channelName] || DEFAULT_TOPICS['general'];
};

// Check if channel is 18+ / adults-only
export const isAdultChannel = (channelName: string): boolean => {
  const adultChannels = ['adults-21-plus', 'adult', 'adults', 'nsfw'];
  return adultChannels.includes(channelName.toLowerCase());
};
