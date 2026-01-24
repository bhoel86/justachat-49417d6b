import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-protocol",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// IRC Server configuration
const SERVER_NAME = "jac.chat";
const SERVER_VERSION = "JAC-IRC-1.0";
const NETWORK_NAME = "JACNet";
const LOCAL_HOST_NAME = "Unix";

// Simple hash function for IP masking (returns 8 hex chars)
function hashIpForDisplay(userId: string): string {
  let hash = 0;
  const str = userId + "jac-salt";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8);
}

// Active IRC sessions
const sessions = new Map<string, IRCSession>();

// Channel to session mapping for realtime relay
const channelSubscriptions = new Map<string, Set<string>>(); // channelId -> Set<sessionId>

// Simulated bot names per channel (subset of the full 140 bots)
const channelBots: Record<string, string[]> = {
  "general": ["CryptoKing", "NightOwl88", "PixelDreamer", "JazzCat", "ThunderStrike", "MoonWalker", "StarGazer", "CodeNinja", "RetroGamer", "NeonRider"],
  "lounge": ["ChillVibes", "MidnightDJ", "SmoothOperator", "UrbanLegend", "CoffeeAddict", "BookWorm", "MovieBuff", "TravelJunkie", "FoodieLife", "ArtLover"],
  "dating": ["LoveSeeker", "HeartBreaker", "RomanticSoul", "SingleAndReady", "CharmingOne", "SweetTalker", "DateNight", "FlirtMaster", "CupidArrow", "MatchMaker"],
  "technology": ["TechGeek", "CodeMaster", "ByteRunner", "DigitalNomad", "CyberPunk", "AIEnthusiast", "DevOpsGuru", "CloudArchitect", "DataScientist", "HackerNews"],
  "sports": ["GoalScorer", "SlamDunk", "HomeRun", "TouchDown", "FastLane", "ChampionMind", "TeamPlayer", "MVPstatus", "GoldMedal", "GameChanger"],
  "music": ["BassDropper", "MelodyMaker", "VinylCollector", "ConcertGoer", "GuitarHero", "DrumBeat", "SynthWave", "HipHopHead", "RockStar", "JazzFusion"],
  "movies": ["FilmCritic", "PopcornTime", "CinematicMind", "BlockBuster", "IndieFan", "HorrorNight", "ActionJunkie", "RomComLover", "SciFiGeek", "ClassicFilm"],
  "games": ["ProGamer", "QuestMaster", "LootHunter", "BossSlayer", "SpeedRunner", "RetroKing", "VRExplorer", "StreamerLife", "EsportsLegend", "CasualPlay"],
  "politics": ["DebateMaster", "PolicyWonk", "NewsJunkie", "FactChecker", "VoterVoice", "CivicMinded", "HistoryBuff", "GlobalWatch", "LocalActivist", "BipartisanBob"],
  "adults-21-plus": ["NightLife", "PartyStarter", "ClubHopper", "MixMaster", "VIPaccess", "AfterHours", "WeekendWarrior", "SocialButterfly", "UrbanExplorer", "NightCrawler"],
  "trivia": ["QuizWhiz", "FactMachine", "BrainTeaser", "TriviaKing", "KnowledgeSeeker", "AnswerBot", "SmartCookie", "QuestionMaster", "LearnItAll", "CuriousMind"],
  "help": ["HelpDesk", "SupportHero", "GuideBot", "NewbieHelper", "TechSupport", "FriendlyFace", "WelcomeWagon", "InfoCenter", "AskMeAnything", "AssistantPro"],
};

function getBotsForChannel(channelName: string): string[] {
  const normalized = channelName.toLowerCase().replace(/-/g, "-");
  return channelBots[normalized] || channelBots["general"] || [];
}

interface IRCSession {
  ws: WebSocket;
  nick: string | null;
  user: string | null;
  realname: string | null;
  registered: boolean;
  authenticated: boolean;
  userId: string | null;
  channels: Set<string>;
  lastPing: number;
  supabase: ReturnType<typeof createClient> | null;
  sessionId: string;
}

// IRC numeric replies
const RPL = {
  WELCOME: "001",
  YOURHOST: "002",
  CREATED: "003",
  MYINFO: "004",
  ISUPPORT: "005",
  LUSERCLIENT: "251",
  LUSEROP: "252",
  LUSERUNKNOWN: "253",
  LUSERCHANNELS: "254",
  LUSERME: "255",
  MOTDSTART: "375",
  MOTD: "372",
  ENDOFMOTD: "376",
  NAMREPLY: "353",
  ENDOFNAMES: "366",
  TOPIC: "332",
  NOTOPIC: "331",
  WHOISUSER: "311",
  WHOISSERVER: "312",
  ENDOFWHOIS: "318",
  LIST: "322",
  LISTEND: "323",
  CHANNELMODEIS: "324",
  WHOREPLY: "352",
  ENDOFWHO: "315",
};

const ERR = {
  NOSUCHNICK: "401",
  NOSUCHCHANNEL: "403",
  CANNOTSENDTOCHAN: "404",
  UNKNOWNCOMMAND: "421",
  NONICKNAMEGIVEN: "431",
  ERRONEUSNICKNAME: "432",
  NICKNAMEINUSE: "433",
  USERNOTINCHANNEL: "441",
  NOTONCHANNEL: "442",
  USERONCHANNEL: "443",
  NOTREGISTERED: "451",
  NEEDMOREPARAMS: "461",
  ALREADYREGISTRED: "462",
  PASSWDMISMATCH: "464",
  CHANOPRIVSNEEDED: "482",
};

// mIRC color codes for role-based coloring
// Format: \x03FG or \x03FG,BG where colors are 0-15
const IRC_COLORS = {
  WHITE: "\x0300",
  BLACK: "\x0301",
  BLUE: "\x0302",
  GREEN: "\x0303",
  RED: "\x0304",
  BROWN: "\x0305",
  PURPLE: "\x0306",
  ORANGE: "\x0307",
  YELLOW: "\x0308",
  LIME: "\x0309",
  TEAL: "\x0310",
  CYAN: "\x0311",
  ROYAL: "\x0312",
  PINK: "\x0313",
  GREY: "\x0314",
  SILVER: "\x0315",
  BOLD: "\x02",
  ITALIC: "\x1D",
  UNDERLINE: "\x1F",
  RESET: "\x0F",
};

// Room theme configuration for mIRC - includes foreground, background, and accent colors
interface IRCRoomTheme {
  fg: string;        // Foreground color code
  bg: string;        // Background color code (number only for combining)
  fgBg: string;      // Combined foreground,background format
  accent: string;    // Accent color for highlights
  banner: string;    // Banner text with background
}

const ROOM_IRC_THEMES: Record<string, IRCRoomTheme> = {
  'general': { 
    fg: "\x0302",      // Blue
    bg: "01",          // Black background
    fgBg: "\x0300,02", // White on blue
    accent: "\x0311",  // Cyan accent
    banner: "\x0315,02", // Silver on blue
  },
  'adults-21-plus': { 
    fg: "\x0304",      // Red
    bg: "01",          // Black background
    fgBg: "\x0300,04", // White on red
    accent: "\x0313",  // Pink accent
    banner: "\x0315,04", // Silver on red
  },
  'music': { 
    fg: "\x0306",      // Purple
    bg: "01",          // Black background
    fgBg: "\x0300,06", // White on purple
    accent: "\x0313",  // Pink accent
    banner: "\x0315,06", // Silver on purple
  },
  'help': { 
    fg: "\x0303",      // Green
    bg: "01",          // Black background
    fgBg: "\x0300,03", // White on green
    accent: "\x0309",  // Lime accent
    banner: "\x0315,03", // Silver on green
  },
  'games': { 
    fg: "\x0307",      // Orange
    bg: "01",          // Black background
    fgBg: "\x0301,07", // Black on orange
    accent: "\x0308",  // Yellow accent
    banner: "\x0301,07", // Black on orange
  },
  'politics': { 
    fg: "\x0314",      // Grey
    bg: "01",          // Black background
    fgBg: "\x0300,14", // White on grey
    accent: "\x0315",  // Silver accent
    banner: "\x0300,14", // White on grey
  },
  'movies-tv': { 
    fg: "\x0312",      // Royal blue
    bg: "01",          // Black background
    fgBg: "\x0300,12", // White on royal
    accent: "\x0306",  // Purple accent
    banner: "\x0315,12", // Silver on royal
  },
  'sports': { 
    fg: "\x0309",      // Lime
    bg: "01",          // Black background
    fgBg: "\x0301,09", // Black on lime
    accent: "\x0303",  // Green accent
    banner: "\x0301,09", // Black on lime
  },
  'technology': { 
    fg: "\x0311",      // Cyan
    bg: "01",          // Black background
    fgBg: "\x0301,11", // Black on cyan
    accent: "\x0302",  // Blue accent
    banner: "\x0301,11", // Black on cyan
  },
  'dating': { 
    fg: "\x0313",      // Pink
    bg: "01",          // Black background
    fgBg: "\x0300,13", // White on pink  
    accent: "\x0304",  // Red accent
    banner: "\x0315,13", // Silver on pink
  },
  'lounge': { 
    fg: "\x0307",      // Orange/Amber
    bg: "01",          // Black background
    fgBg: "\x0301,07", // Black on orange
    accent: "\x0305",  // Brown accent
    banner: "\x0301,07", // Black on orange
  },
  'trivia': { 
    fg: "\x0310",      // Teal
    bg: "01",          // Black background
    fgBg: "\x0300,10", // White on teal
    accent: "\x0311",  // Cyan accent
    banner: "\x0315,10", // Silver on teal
  },
  'art': { 
    fg: "\x0313",      // Pink/Rose
    bg: "01",          // Black background
    fgBg: "\x0300,05", // White on brown (artsy feel)
    accent: "\x0307",  // Orange accent
    banner: "\x0315,05", // Silver on brown
  },
};

// Legacy simple color mappings (for basic coloring)
const ROOM_IRC_COLORS: Record<string, string> = {
  'general': IRC_COLORS.BLUE,
  'adults-21-plus': IRC_COLORS.RED,
  'music': IRC_COLORS.PURPLE,
  'help': IRC_COLORS.GREEN,
  'games': IRC_COLORS.ORANGE,
  'politics': IRC_COLORS.GREY,
  'movies-tv': IRC_COLORS.ROYAL,
  'sports': IRC_COLORS.LIME,
  'technology': IRC_COLORS.CYAN,
  'dating': IRC_COLORS.PINK,
  'lounge': IRC_COLORS.ORANGE,
  'trivia': IRC_COLORS.TEAL,
  'art': IRC_COLORS.PINK,
};

// Room welcome messages for IRC (enhanced versions)
const ROOM_WELCOME_MESSAGES: Record<string, { moderator: string; message: string; tips: string[] }> = {
  'general': {
    moderator: 'Mitnick',
    message: "Welcome to #general! I'm Kevin Mitnick, your channel moderator. This is the main hub - chat freely, be cool, and remember: the best hackers are the best learners.",
    tips: ["Use /list to see all channels", "Type /msg <nick> to private message someone", "Bots are here to chat - try mentioning them!"]
  },
  'adults-21-plus': {
    moderator: 'Lamo',
    message: "Welcome to #adults-21-plus! I'm Adrian Lamo. This is a 21+ space for mature conversations. Keep it classy, keep it real.",
    tips: ["Age verification applies", "Respect all participants", "Report issues with /msg admin"]
  },
  'music': {
    moderator: 'Dr. Geo',
    message: "Welcome to #music! I'm Dr. Geo, Music Theory PhD. Drop any song and I'll break down the theory - key changes, chord progressions, production techniques. Let's geek out!",
    tips: ["Ask about any song's theory", "Share what you're listening to", "Discuss artists and genres"]
  },
  'help': {
    moderator: 'Mudge',
    message: "Welcome to #help! I'm Mudge, your friendly neighborhood helper. No question is too basic here - that's what we're for. Fire away!",
    tips: ["Describe your issue clearly", "Check /topic for common solutions", "Be patient - help is coming!"]
  },
  'games': {
    moderator: 'Barnaby',
    message: "Welcome to #games! I'm Barnaby Jack. Whether you're speedrunning, grinding ranks, or just casual gaming - you're among friends. GG!",
    tips: ["Share your current games", "LFG posts welcome", "Discuss esports and streams"]
  },
  'politics': {
    moderator: 'Sabu',
    message: "Welcome to #politics! I'm Sabu, your unbiased political analyst. We break down news from ALL perspectives here. Facts matter, civility required.",
    tips: ["Cite sources when possible", "Attack ideas, not people", "Multiple viewpoints encouraged"]
  },
  'movies-tv': {
    moderator: 'Guccifer',
    message: "Welcome to #movies-tv! I'm Guccifer, your film industry insider. Drop any movie and I'll give you the FULL breakdown - budgets, salaries, behind-the-scenes drama, box office analysis.",
    tips: ["Ask about any film's budget", "Get actor salary breakdowns", "Behind-the-scenes stories available"]
  },
  'sports': {
    moderator: 'Albert',
    message: "Welcome to #sports! I'm Albert Gonzalez. All sports, all leagues, all the time. Scores, trades, fantasy advice - let's talk game!",
    tips: ["Share hot takes", "Fantasy league discussion", "Live game reactions welcome"]
  },
  'technology': {
    moderator: 'Charlie',
    message: "Welcome to #technology! I'm Charlie Miller. From coding to gadgets, AI to cybersecurity - if it's tech, we're talking about it. Let's geek out!",
    tips: ["Ask coding questions", "Share tech news", "Discuss new gadgets and innovations"]
  },
  'dating': {
    moderator: 'Phoenix',
    message: "Welcome to #dating! I'm Phoenix, your relationship counselor. Whether you're seeking advice, sharing experiences, or just here to connect - this is your space.",
    tips: ["Be respectful always", "Share experiences openly", "Ask for relationship advice"]
  },
  'lounge': {
    moderator: 'Solo',
    message: "Welcome to #lounge! I'm Solo. This is the chill zone - no pressure, no agenda, just good vibes. Grab a coffee and relax.",
    tips: ["Slow-paced conversations", "Random topics welcome", "Just hang out"]
  },
  'trivia': {
    moderator: 'Poulsen',
    message: "Welcome to #trivia! I'm Kevin Poulsen. Test your knowledge! Type /trivia to start a game. Every question is a chance to learn something new.",
    tips: ["Type /trivia to play", "Points tracked on leaderboard", "Learn while having fun"]
  },
  'art': {
    moderator: 'Cicada',
    message: "Welcome to #art! I'm Cicada 3301, your art curator. We explore masterpieces from every era - classical, modern, digital. What art moves you?",
    tips: ["Discuss any artwork", "Share your own creations", "Art history discussions welcome"]
  },
};

// ASCII art banners for each room
const ROOM_ASCII_ART: Record<string, string[]> = {
  'general': [
    "   ██████╗ ███████╗███╗   ██╗███████╗██████╗  █████╗ ██╗     ",
    "  ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔══██╗██╔══██╗██║     ",
    "  ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██████╔╝███████║██║     ",
    "  ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██╗██╔══██║██║     ",
    "  ╚██████╔╝███████╗██║ ╚████║███████╗██║  ██║██║  ██║███████╗",
    "   ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝",
  ],
  'adults-21-plus': [
    "   █████╗ ██████╗ ██╗   ██╗██╗  ████████╗███████╗    ██████╗  ██╗ ██╗    ",
    "  ██╔══██╗██╔══██╗██║   ██║██║  ╚══██╔══╝██╔════╝    ╚════██╗███║██╔╝    ",
    "  ███████║██║  ██║██║   ██║██║     ██║   ███████╗     █████╔╝╚██║██║     ",
    "  ██╔══██║██║  ██║██║   ██║██║     ██║   ╚════██║    ██╔═══╝  ██║██║     ",
    "  ██║  ██║██████╔╝╚██████╔╝███████╗██║   ███████║    ███████╗ ██║╚██████╗",
    "  ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝╚═╝   ╚══════╝    ╚══════╝ ╚═╝ ╚═════╝",
  ],
  'music': [
    "  ███╗   ███╗██╗   ██╗███████╗██╗ ██████╗    ♪ ♫ ♬",
    "  ████╗ ████║██║   ██║██╔════╝██║██╔════╝   ♫     ♪",
    "  ██╔████╔██║██║   ██║███████╗██║██║        ♪   ♫  ",
    "  ██║╚██╔╝██║██║   ██║╚════██║██║██║          ♬   ♪",
    "  ██║ ╚═╝ ██║╚██████╔╝███████║██║╚██████╗   ♪   ♫  ",
    "  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝ ╚═════╝    ♫ ♪ ♬ ",
  ],
  'help': [
    "  ██╗  ██╗███████╗██╗     ██████╗     ██████╗ ███████╗███████╗██╗  ██╗",
    "  ██║  ██║██╔════╝██║     ██╔══██╗    ██╔══██╗██╔════╝██╔════╝██║ ██╔╝",
    "  ███████║█████╗  ██║     ██████╔╝    ██║  ██║█████╗  ███████╗█████╔╝ ",
    "  ██╔══██║██╔══╝  ██║     ██╔═══╝     ██║  ██║██╔══╝  ╚════██║██╔═██╗ ",
    "  ██║  ██║███████╗███████╗██║         ██████╔╝███████╗███████║██║  ██╗",
    "  ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝         ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝",
  ],
  'games': [
    "   ██████╗  █████╗ ███╗   ███╗███████╗███████╗   ▄▄▄▄▄",
    "  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██╔════╝  █ ● ● █",
    "  ██║  ███╗███████║██╔████╔██║█████╗  ███████╗  █  ▄  █",
    "  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚════██║  █ █▄█ █",
    "  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗███████║  ▀▀▀▀▀▀▀",
    "   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝         ",
  ],
  'politics': [
    "  ██████╗  ██████╗ ██╗     ██╗████████╗██╗ ██████╗███████╗",
    "  ██╔══██╗██╔═══██╗██║     ██║╚══██╔══╝██║██╔════╝██╔════╝",
    "  ██████╔╝██║   ██║██║     ██║   ██║   ██║██║     ███████╗",
    "  ██╔═══╝ ██║   ██║██║     ██║   ██║   ██║██║     ╚════██║",
    "  ██║     ╚██████╔╝███████╗██║   ██║   ██║╚██████╗███████║",
    "  ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝   ╚═╝ ╚═════╝╚══════╝",
  ],
  'movies-tv': [
    "  ███╗   ███╗ ██████╗ ██╗   ██╗██╗███████╗███████╗   📽️ 🎬",
    "  ████╗ ████║██╔═══██╗██║   ██║██║██╔════╝██╔════╝   🎥    ",
    "  ██╔████╔██║██║   ██║██║   ██║██║█████╗  ███████╗      📺 ",
    "  ██║╚██╔╝██║██║   ██║╚██╗ ██╔╝██║██╔══╝  ╚════██║   🍿    ",
    "  ██║ ╚═╝ ██║╚██████╔╝ ╚████╔╝ ██║███████╗███████║      🎞️ ",
    "  ╚═╝     ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚══════╝╚══════╝         ",
  ],
  'sports': [
    "  ███████╗██████╗  ██████╗ ██████╗ ████████╗███████╗  ⚽🏀🏈",
    "  ██╔════╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝  🎾⚾🏒",
    "  ███████╗██████╔╝██║   ██║██████╔╝   ██║   ███████╗  🏆🥇🎖️",
    "  ╚════██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║        ",
    "  ███████║██║     ╚██████╔╝██║  ██║   ██║   ███████║        ",
    "  ╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝        ",
  ],
  'technology': [
    "  ████████╗███████╗ ██████╗██╗  ██╗   </> {;} [#]",
    "  ╚══██╔══╝██╔════╝██╔════╝██║  ██║   ▄▄▄▄▄▄▄▄▄▄▄",
    "     ██║   █████╗  ██║     ███████║   █ 01001011 █",
    "     ██║   ██╔══╝  ██║     ██╔══██║   █ 10110100 █",
    "     ██║   ███████╗╚██████╗██║  ██║   ▀▀▀▀▀▀▀▀▀▀▀",
    "     ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝   </>  ⌨️  💻 ",
  ],
  'dating': [
    "  ██████╗  █████╗ ████████╗██╗███╗   ██╗ ██████╗     💕",
    "  ██╔══██╗██╔══██╗╚══██╔══╝██║████╗  ██║██╔════╝    💖 💗",
    "  ██║  ██║███████║   ██║   ██║██╔██╗ ██║██║  ███╗  💘   💝",
    "  ██║  ██║██╔══██║   ██║   ██║██║╚██╗██║██║   ██║   💓 💞",
    "  ██████╔╝██║  ██║   ██║   ██║██║ ╚████║╚██████╔╝    💕  ",
    "  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝         ",
  ],
  'lounge': [
    "  ██╗      ██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ███████╗",
    "  ██║     ██╔═══██╗██║   ██║████╗  ██║██╔════╝ ██╔════╝",
    "  ██║     ██║   ██║██║   ██║██╔██╗ ██║██║  ███╗█████╗  ",
    "  ██║     ██║   ██║██║   ██║██║╚██╗██║██║   ██║██╔══╝  ",
    "  ███████╗╚██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝███████╗",
    "  ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝",
    "           ☕ Chill Vibes Only ☕                      ",
  ],
  'trivia': [
    "  ████████╗██████╗ ██╗██╗   ██╗██╗ █████╗     ❓",
    "  ╚══██╔══╝██╔══██╗██║██║   ██║██║██╔══██╗   ❔ ❓",
    "     ██║   ██████╔╝██║██║   ██║██║███████║  ❓   ❔",
    "     ██║   ██╔══██╗██║╚██╗ ██╔╝██║██╔══██║   ❔ ❓",
    "     ██║   ██║  ██║██║ ╚████╔╝ ██║██║  ██║    ❓  ",
    "     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚═╝╚═╝  ╚═╝   🧠💡 ",
  ],
  'art': [
    "   █████╗ ██████╗ ████████╗    ╔═══════════╗",
    "  ██╔══██╗██╔══██╗╚══██╔══╝    ║  🎨 🖼️ 🖌️  ║",
    "  ███████║██████╔╝   ██║       ║   ╭───╮   ║",
    "  ██╔══██║██╔══██╗   ██║       ║   │ ◉ │   ║",
    "  ██║  ██║██║  ██║   ██║       ║   ╰───╯   ║",
    "  ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═══════════╝",
  ],
};

function getAsciiArt(channelName: string): string[] {
  return ROOM_ASCII_ART[channelName.toLowerCase()] || ROOM_ASCII_ART['general'];
}

function getRoomColor(channelName: string): string {
  return ROOM_IRC_COLORS[channelName.toLowerCase()] || IRC_COLORS.BLUE;
}

function getRoomTheme(channelName: string): IRCRoomTheme {
  return ROOM_IRC_THEMES[channelName.toLowerCase()] || ROOM_IRC_THEMES['general'];
}

function formatColoredRoomName(channelName: string): string {
  const theme = getRoomTheme(channelName);
  return `${IRC_COLORS.BOLD}${theme.fg}#${channelName}${IRC_COLORS.RESET}`;
}

function formatThemedBanner(text: string, channelName: string): string {
  const theme = getRoomTheme(channelName);
  // Use background color for banner effect
  return `${IRC_COLORS.BOLD}${theme.banner} ${text} ${IRC_COLORS.RESET}`;
}

function formatThemedHeader(text: string, channelName: string): string {
  const theme = getRoomTheme(channelName);
  return `${IRC_COLORS.BOLD}${theme.fgBg} ${text} ${IRC_COLORS.RESET}`;
}

function getWelcomeInfo(channelName: string): { moderator: string; message: string; tips: string[] } {
  return ROOM_WELCOME_MESSAGES[channelName.toLowerCase()] || ROOM_WELCOME_MESSAGES['general'];
}

function sendIRC(session: IRCSession, message: string) {
  try {
    if (session.ws.readyState === WebSocket.OPEN) {
      console.log(`[IRC OUT] ${message}`);
      session.ws.send(message + "\r\n");
    }
  } catch (e) {
    console.error("Failed to send IRC message:", e);
  }
}

function sendNumeric(session: IRCSession, numeric: string, params: string) {
  const nick = session.nick || "*";
  sendIRC(session, `:${SERVER_NAME} ${numeric} ${nick} ${params}`);
}

async function handleNICK(session: IRCSession, params: string[]) {
  if (params.length === 0) {
    sendNumeric(session, ERR.NONICKNAMEGIVEN, ":No nickname given");
    return;
  }

  const newNick = params[0];
  
  // Validate nickname
  if (!/^[a-zA-Z][a-zA-Z0-9_\-\[\]\\`^{}]{0,15}$/.test(newNick)) {
    sendNumeric(session, ERR.ERRONEUSNICKNAME, `${newNick} :Erroneous nickname`);
    return;
  }

  // Check if nick is in use by another session
  for (const [, s] of sessions) {
    if (s !== session && s.nick?.toLowerCase() === newNick.toLowerCase()) {
      sendNumeric(session, ERR.NICKNAMEINUSE, `${newNick} :Nickname is already in use`);
      return;
    }
  }

  const oldNick = session.nick;
  session.nick = newNick;

  if (oldNick && session.registered) {
    // Broadcast nick change to all channels user is in
    sendIRC(session, `:${oldNick}!${session.user}@irc.${SERVER_NAME} NICK :${newNick}`);
  }

  // Check if we can complete registration
  if (!session.registered && session.nick && session.user) {
    await completeRegistration(session);
  }
}

async function handleUSER(session: IRCSession, params: string[]) {
  if (session.registered) {
    sendNumeric(session, ERR.ALREADYREGISTRED, ":You may not reregister");
    return;
  }

  if (params.length < 4) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "USER :Not enough parameters");
    return;
  }

  session.user = params[0];
  session.realname = params.slice(3).join(" ").replace(/^:/, "");

  // Check if we can complete registration
  if (session.nick && session.user) {
    await completeRegistration(session);
  }
}

async function handlePASS(session: IRCSession, params: string[]) {
  if (session.registered) {
    sendNumeric(session, ERR.ALREADYREGISTRED, ":You may not reregister");
    return;
  }

  if (params.length === 0) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "PASS :Not enough parameters");
    return;
  }

  // Password format:
  //  - email:password (recommended)
  //  - email|password (mIRC-safe; some clients strip text before ':' when used as the /server "password" arg)
  //  - access_token (JWT)
  const raw = params[0].replace(/^:/, "");
  let password = raw;
  try {
    // allow URL-encoded payloads (e.g. email%3Apassword)
    if (/%[0-9A-Fa-f]{2}/.test(raw)) password = decodeURIComponent(raw);
  } catch {
    // ignore
  }
  console.log(`[IRC] Processing PASS command (length: ${password.length})`);
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const delimiter = password.includes(":")
      ? ":"
      : password.includes("|")
        ? "|"
        : password.includes(";")
          ? ";"
          : password.includes(",")
            ? ","
            : null;

    if (delimiter) {
      const idx = password.indexOf(delimiter);
      const email = password.substring(0, idx);
      const pass = password.substring(idx + 1);
      
      console.log(`[IRC] Attempting auth for: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      
      if (error || !data.user) {
        console.log("Auth failed:", error?.message);
        sendNumeric(session, ERR.PASSWDMISMATCH, ":Password incorrect");
        return;
      }
      
      session.userId = data.user.id;
      session.authenticated = true;
      session.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`,
          },
        },
      });
      console.log(`[IRC] User authenticated: ${data.user.id}`);
      sendIRC(session, `:${SERVER_NAME} NOTICE * :*** Authentication successful`);
      
      // Try to complete registration now that auth is done
      if (session.nick && session.user && !session.registered) {
        console.log(`[IRC] Completing registration after PASS (nick: ${session.nick}, user: ${session.user})`);
        await completeRegistration(session);
      }
    } else {
      // Access token format
      const { data, error } = await supabase.auth.getUser(password);
      
      if (error || !data.user) {
        sendNumeric(session, ERR.PASSWDMISMATCH, ":Password incorrect");
        return;
      }
      
      session.userId = data.user.id;
      session.authenticated = true;
      session.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${password}`,
          },
        },
      });
      console.log(`[IRC] User authenticated via token: ${data.user.id}`);
      sendIRC(session, `:${SERVER_NAME} NOTICE * :*** Authentication successful`);
      
      // Try to complete registration now that auth is done
      if (session.nick && session.user && !session.registered) {
        await completeRegistration(session);
      }
    }
  } catch (e) {
    console.error("Auth error:", e);
    sendNumeric(session, ERR.PASSWDMISMATCH, ":Password incorrect");
  }
}

async function completeRegistration(session: IRCSession) {
  if (!session.authenticated) {
    sendIRC(
      session,
      `:${SERVER_NAME} NOTICE * :*** You must authenticate with PASS email:password (or email|password for mIRC) before registering`,
    );
    return;
  }

  session.registered = true;

  // Generate hashed IP display for privacy
  const hashedIp = session.userId ? hashIpForDisplay(session.userId) : "unknown";
  
  // Send welcome messages
  sendNumeric(session, RPL.WELCOME, `:Welcome to the ${NETWORK_NAME} IRC Network, ${session.nick}!`);
  sendNumeric(session, RPL.YOURHOST, `:Your host is ${LOCAL_HOST_NAME} [${hashedIp}], running version ${SERVER_VERSION}`);
  sendNumeric(session, RPL.CREATED, `:This server was created for JAC - Just A Chat`);
  sendNumeric(session, RPL.MYINFO, `${SERVER_NAME} ${SERVER_VERSION} o o`);
  sendNumeric(session, RPL.ISUPPORT, "CHANTYPES=# PREFIX=(qaov)~&@+ NETWORK=JACNet CASEMAPPING=ascii :are supported by this server");

  // Send styled MOTD
  sendNumeric(session, RPL.MOTDSTART, `:- ${SERVER_NAME} Message of the Day -`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}     ██╗ █████╗  ██████╗${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}     ██║██╔══██╗██╔════╝${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}     ██║███████║██║     ${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}██   ██║██╔══██║██║     ${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}╚█████╔╝██║  ██║╚██████╗${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN} ╚════╝ ╚═╝  ╚═╝ ╚═════╝${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}Just A Chat${IRC_COLORS.RESET} ${IRC_COLORS.GREY}- Chat. Connect. Chill.${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.GREY}════════════════════════════════════════${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.GREEN}▸${IRC_COLORS.RESET} ${IRC_COLORS.BOLD}Getting Started${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.GREY}/list${IRC_COLORS.RESET}          - See all channels`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.GREY}/join #channel${IRC_COLORS.RESET} - Join a channel`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.GREY}/msg nick${IRC_COLORS.RESET}      - Private message`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.PINK}▸${IRC_COLORS.RESET} ${IRC_COLORS.BOLD}Room Moderators${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.GREY}Each room has an AI moderator who can help${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.GREY}you and answer questions about the topic.${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.GREY}Just mention their name or /msg them!${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.CYAN}▸${IRC_COLORS.RESET} ${IRC_COLORS.BOLD}User Roles${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-     ${IRC_COLORS.YELLOW}~${IRC_COLORS.RESET} ${IRC_COLORS.GREY}Owner${IRC_COLORS.RESET}  ${IRC_COLORS.RED}&${IRC_COLORS.RESET} ${IRC_COLORS.GREY}Admin${IRC_COLORS.RESET}  ${IRC_COLORS.GREEN}@${IRC_COLORS.RESET} ${IRC_COLORS.GREY}Operator${IRC_COLORS.RESET}  ${IRC_COLORS.CYAN}+${IRC_COLORS.RESET} ${IRC_COLORS.GREY}Bot${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.GREY}════════════════════════════════════════${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:-   ${IRC_COLORS.GREY}Online: ${IRC_COLORS.GREEN}${sessions.size}${IRC_COLORS.GREY} users${IRC_COLORS.RESET}   ${IRC_COLORS.GREY}Web: https://justachat.net${IRC_COLORS.RESET}`);
  sendNumeric(session, RPL.MOTD, `:- `);
  sendNumeric(session, RPL.ENDOFMOTD, `:End of MOTD command`);

  // Update the user's nickname in the database if different
  if (session.supabase && session.userId) {
    try {
      const { data: profile } = await session.supabase
        .from("profiles")
        .select("username")
        .eq("user_id", session.userId)
        .single();
      
      const profileData = profile as { username: string } | null;
      if (profileData && profileData.username !== session.nick) {
        // Use database username as nick for consistency
        const oldNick = session.nick;
        session.nick = profileData.username;
        sendIRC(session, `:${oldNick}!${session.user}@irc.${SERVER_NAME} NICK :${session.nick}`);
      }
    } catch (e) {
      console.error("Failed to sync nickname:", e);
    }
  }
}

async function handleJOIN(session: IRCSession, params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  if (params.length === 0) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "JOIN :Not enough parameters");
    return;
  }

  const channelNames = params[0].split(",");

  for (const channelName of channelNames) {
    if (!channelName.startsWith("#")) {
      sendNumeric(session, ERR.NOSUCHCHANNEL, `${channelName} :No such channel`);
      continue;
    }

    const dbChannelName = channelName.slice(1).toLowerCase();

    try {
      // Find channel in database
      const { data: channelData, error } = await session.supabase!
        .from("channels")
        .select("id, name, description")
        .ilike("name", dbChannelName)
        .maybeSingle();

      const channel = channelData as { id: string; name: string; description: string | null } | null;

      if (error || !channel) {
        sendNumeric(session, ERR.NOSUCHCHANNEL, `${channelName} :No such channel`);
        continue;
      }

      session.channels.add(channel.id);
      
      // Track channel subscription for realtime
      if (!channelSubscriptions.has(channel.id)) {
        channelSubscriptions.set(channel.id, new Set());
      }
      channelSubscriptions.get(channel.id)!.add(session.sessionId);

      // Send JOIN confirmation with colored room name
      const roomColor = getRoomColor(dbChannelName);
      const roomTheme = getRoomTheme(dbChannelName);
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} JOIN ${channelName}`);

      // Send topic with themed background color
      const { data: settingsData } = await session.supabase!
        .from("channel_settings")
        .select("topic")
        .eq("channel_id", channel.id)
        .maybeSingle();

      const settings = settingsData as { topic: string | null } | null;
      const topicText = settings?.topic || channel.description || getDefaultTopicForRoom(dbChannelName);
      // Topic with themed foreground and background
      const coloredTopic = `${roomTheme.fgBg} ${topicText} ${IRC_COLORS.RESET}`;
      sendNumeric(session, RPL.TOPIC, `${channelName} :${coloredTopic}`);

      // Get channel members for NAMES
      const { data: members } = await session.supabase!
        .from("channel_members")
        .select("user_id")
        .eq("channel_id", channel.id);

      const { data: profiles } = await session.supabase!
        .from("profiles")
        .select("user_id, username");

      // Check for room admins and owners
      const { data: roomAdmins } = await session.supabase!
        .from("room_admins")
        .select("user_id")
        .eq("channel_id", channel.id);

      // Check global roles for all users
      const { data: userRoles } = await session.supabase!
        .from("user_roles")
        .select("user_id, role");

      // Get channel owner
      const { data: channelOwnerData } = await session.supabase!
        .from("channels")
        .select("created_by")
        .eq("id", channel.id)
        .single();

      const channelOwnerId = (channelOwnerData as { created_by: string | null } | null)?.created_by;

      const memberList = members as { user_id: string }[] | null;
      const profileList = profiles as { user_id: string; username: string }[] | null;
      const roomAdminList = roomAdmins as { user_id: string }[] | null;
      const rolesList = userRoles as { user_id: string; role: string }[] | null;
      
      const profileMap = new Map(profileList?.map((p) => [p.user_id, p.username]) || []);
      const roomAdminSet = new Set(roomAdminList?.map((a) => a.user_id) || []);
      
      // Build role maps
      const globalOwners = new Set(rolesList?.filter(r => r.role === 'owner').map(r => r.user_id) || []);
      const globalAdmins = new Set(rolesList?.filter(r => r.role === 'admin').map(r => r.user_id) || []);
      const globalMods = new Set(rolesList?.filter(r => r.role === 'moderator').map(r => r.user_id) || []);
      
      // Categorize members
      const owners: string[] = [];
      const admins: string[] = [];
      const ops: string[] = [];
      const users: string[] = [];
      
      for (const m of memberList || []) {
        const username = profileMap.get(m.user_id) || "unknown";
        
        if (globalOwners.has(m.user_id) || m.user_id === channelOwnerId) {
          owners.push(username);
        } else if (globalAdmins.has(m.user_id)) {
          admins.push(username);
        } else if (roomAdminSet.has(m.user_id) || globalMods.has(m.user_id)) {
          ops.push(username);
        } else {
          users.push(username);
        }
      }

      // Add simulated bots to the channel (subset of 10 per room)
      const botNames = getBotsForChannel(dbChannelName);
      
      // Add room moderator bot with @ prefix (operator status)
      const welcomeInfo = getWelcomeInfo(dbChannelName);
      
      // Build colored member names for IRC prefixes:
      // ~ = owner (channel creator or global owner) - Yellow
      // & = admin (global admin) - Red
      // @ = op (room admin or global moderator / room moderator) - Green
      // + = bot - Cyan
      // (no prefix) = regular user - Cyan
      const coloredOwners = owners.map(u => `${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}~${u}${IRC_COLORS.RESET}`);
      const coloredAdmins = admins.map(u => `${IRC_COLORS.BOLD}${IRC_COLORS.RED}&${u}${IRC_COLORS.RESET}`);
      const coloredOps = ops.map(u => `${IRC_COLORS.GREEN}@${u}${IRC_COLORS.RESET}`);
      const coloredModerator = `${IRC_COLORS.GREEN}@${welcomeInfo.moderator}${IRC_COLORS.RESET}`;
      const coloredBots = botNames.map(b => `${IRC_COLORS.CYAN}+${b}${IRC_COLORS.RESET}`);
      const coloredUsers = users.map(u => `${IRC_COLORS.CYAN}${u}${IRC_COLORS.RESET}`);
      
      // Total user count
      const totalUsers = owners.length + admins.length + ops.length + users.length + botNames.length + 1;
      
      // Send channel header with themed background banner
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${formatThemedHeader(`══════ ${channelName.toUpperCase()} ══════`, dbChannelName)}`);
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${roomTheme.accent}${IRC_COLORS.BOLD}Online:${IRC_COLORS.RESET} ${IRC_COLORS.GREEN}${totalUsers} users${IRC_COLORS.RESET}  ${IRC_COLORS.GREY}│${IRC_COLORS.RESET}  ${roomTheme.accent}${IRC_COLORS.BOLD}Theme:${IRC_COLORS.RESET} ${formatThemedBanner(dbChannelName.charAt(0).toUpperCase() + dbChannelName.slice(1), dbChannelName)}`);
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);
      
      // Send grouped member sections
      if (coloredOwners.length > 0) {
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}▸ Owners (${owners.length})${IRC_COLORS.RESET}`);
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :  ${coloredOwners.join(' ')}`);
      }
      if (coloredAdmins.length > 0) {
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.BOLD}${IRC_COLORS.RED}▸ Admins (${admins.length})${IRC_COLORS.RESET}`);
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :  ${coloredAdmins.join(' ')}`);
      }
      
      // Ops section (including room moderator bot)
      const allOps = [...coloredOps, coloredModerator];
      if (allOps.length > 0) {
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.BOLD}${IRC_COLORS.GREEN}▸ Operators (${ops.length + 1})${IRC_COLORS.RESET}`);
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :  ${allOps.join(' ')}`);
      }
      
      if (coloredBots.length > 0) {
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}▸ Bots (${botNames.length})${IRC_COLORS.RESET}`);
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :  ${coloredBots.join(' ')}`);
      }
      
      if (coloredUsers.length > 0) {
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.GREY}▸ Users (${users.length})${IRC_COLORS.RESET}`);
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :  ${coloredUsers.join(' ')}`);
      }
      
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);
      
      // Build standard IRC NAMES reply (for IRC protocol compliance)
      const standardOwners = owners.map(u => `~${u}`);
      const standardAdmins = admins.map(u => `&${u}`);
      const standardOps = ops.map(u => `@${u}`);
      const moderatorNick = `@${welcomeInfo.moderator}`;
      
      const allNames = [...standardOwners, ...standardAdmins, ...standardOps, moderatorNick, ...botNames, ...users].join(' ');

      sendNumeric(session, RPL.NAMREPLY, `= ${channelName} :${allNames}`);
      sendNumeric(session, RPL.ENDOFNAMES, `${channelName} :End of /NAMES list`);
      
      // Grant appropriate mode to the current user based on their role
      if (globalOwners.has(session.userId!) || session.userId === channelOwnerId) {
        sendIRC(session, `:${SERVER_NAME} MODE ${channelName} +qo ${session.nick} ${session.nick}`);
      } else if (globalAdmins.has(session.userId!)) {
        sendIRC(session, `:${SERVER_NAME} MODE ${channelName} +ao ${session.nick} ${session.nick}`);
      } else if (roomAdminSet.has(session.userId!) || globalMods.has(session.userId!)) {
        sendIRC(session, `:${SERVER_NAME} MODE ${channelName} +o ${session.nick}`);
      }

      // Send enhanced welcome message for the room with ASCII art
      const asciiArt = getAsciiArt(dbChannelName);
      
      // ASCII art banner with themed colors
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);
      for (const line of asciiArt) {
        // Use themed foreground color for ASCII art
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.BOLD}${roomTheme.fg}${line}${IRC_COLORS.RESET}`);
      }
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);
      
      // Welcome divider with themed background
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${formatThemedHeader('════════════════════════════════════════════════════════════', dbChannelName)}`);
      
      // Moderator message with themed accent
      sendIRC(session, `:${IRC_COLORS.GREEN}@${welcomeInfo.moderator}${IRC_COLORS.RESET}!${welcomeInfo.moderator}@mod.${SERVER_NAME} PRIVMSG ${channelName} :${roomTheme.accent}${welcomeInfo.message}${IRC_COLORS.RESET}`);
      
      // Tips section with themed styling
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${roomTheme.fg}${IRC_COLORS.BOLD}💡 Quick Tips:${IRC_COLORS.RESET}`);
      for (const tip of welcomeInfo.tips) {
        sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${IRC_COLORS.GREY}   ${roomTheme.accent}▸${IRC_COLORS.RESET} ${IRC_COLORS.GREY}${tip}${IRC_COLORS.RESET}`);
      }
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} :${formatThemedHeader('════════════════════════════════════════════════════════════', dbChannelName)}`);
      sendIRC(session, `:${SERVER_NAME} NOTICE ${channelName} : `);

      // Join in database - use insert with conflict handling
      await (session.supabase as any)
        .from("channel_members")
        .insert({
          channel_id: channel.id,
          user_id: session.userId!,
        });

    } catch (e) {
      console.error("JOIN error:", e);
      sendNumeric(session, ERR.NOSUCHCHANNEL, `${channelName} :No such channel`);
    }
  }
}

// Default room topics for IRC
function getDefaultTopicForRoom(channelName: string): string {
  const topics: Record<string, string> = {
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
  return topics[channelName.toLowerCase()] || 'Welcome to this channel!';
}

async function handlePART(session: IRCSession, params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  if (params.length === 0) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "PART :Not enough parameters");
    return;
  }

  const channelNames = params[0].split(",");
  const reason = params.slice(1).join(" ").replace(/^:/, "") || "Leaving";

  for (const channelName of channelNames) {
    if (!channelName.startsWith("#")) continue;

    const dbChannelName = channelName.slice(1).toLowerCase();

    try {
      const { data: channelData } = await session.supabase!
        .from("channels")
        .select("id")
        .ilike("name", dbChannelName)
        .maybeSingle();

      const channel = channelData as { id: string } | null;

      if (channel && session.channels.has(channel.id)) {
        session.channels.delete(channel.id);
        
        // Remove from channel subscription tracking
        const subscribers = channelSubscriptions.get(channel.id);
        if (subscribers) {
          subscribers.delete(session.sessionId);
          if (subscribers.size === 0) {
            channelSubscriptions.delete(channel.id);
          }
        }
        
        sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} PART ${channelName} :${reason}`);

        // Leave in database
        await session.supabase!
          .from("channel_members")
          .delete()
          .eq("channel_id", channel.id)
          .eq("user_id", session.userId!);
      }
    } catch (e) {
      console.error("PART error:", e);
    }
  }
}

// Bot personality IDs (matching chat-bot edge function)
const BOT_PERSONALITY_IDS = [
  'user-nova', 'user-max', 'user-luna', 'user-jay', 'user-sage',
  'user-marcus', 'user-pixel', 'user-riley', 'user-kai', 'user-zoe'
];

// Track recent messages for bot context
const recentChannelMessages: Map<string, Array<{ username: string; content: string }>> = new Map();

// Flatten all configured IRC-visible bot names (used for /msg <bot> ...)
const ALL_IRC_BOT_NAMES = Array.from(
  new Set(Object.values(channelBots).flat())
);

// Get all moderator names
const ALL_MODERATOR_NAMES = Object.values(ROOM_WELCOME_MESSAGES).map(r => r.moderator);

// Combined list of all bots including moderators
const ALL_BOT_NAMES = [...ALL_IRC_BOT_NAMES, ...ALL_MODERATOR_NAMES];

function normalizeNick(nick: string) {
  return nick.toLowerCase().replace(/[^a-z0-9_\-\[\]\\`^{}]/g, "");
}

function pickVisibleBotNameForChannel(channelName: string, preferred?: string) {
  if (preferred) return preferred;
  const bots = getBotsForChannel(channelName);
  return bots[Math.floor(Math.random() * bots.length)] || "CryptoKing";
}

function getMentionedBotName(message: string, channelName: string): string | null {
  const content = message.toLowerCase();
  const bots = getBotsForChannel(channelName);
  for (const bot of bots) {
    const n = normalizeNick(bot);
    if (!n) continue;
    if (content.includes(`@${n}`) || content.includes(n)) return bot;
  }
  return null;
}

// Check if a moderator is mentioned in the message
function getMentionedModerator(message: string, channelName: string): string | null {
  const content = message.toLowerCase();
  const welcomeInfo = ROOM_WELCOME_MESSAGES[channelName.toLowerCase()];
  
  if (welcomeInfo) {
    const modName = welcomeInfo.moderator;
    const n = normalizeNick(modName);
    if (n && (content.includes(`@${n}`) || content.includes(n))) {
      return modName;
    }
  }
  
  // Also check all moderators (user might be asking about a mod from another channel)
  for (const [room, info] of Object.entries(ROOM_WELCOME_MESSAGES)) {
    const n = normalizeNick(info.moderator);
    if (n && (content.includes(`@${n}`) || content.includes(n))) {
      return info.moderator;
    }
  }
  
  return null;
}

// Get moderator personality context
function getModeratorContext(modName: string): { room: string; personality: string } | null {
  for (const [room, info] of Object.entries(ROOM_WELCOME_MESSAGES)) {
    if (info.moderator === modName) {
      const personalities: Record<string, string> = {
        'Mitnick': 'You are Kevin Mitnick, legendary hacker turned security consultant. You speak with authority about hacking, security, and social engineering. You share stories from your past and give wise advice.',
        'Lamo': 'You are Adrian Lamo, the "homeless hacker". You are introspective, philosophical about ethics in hacking. You keep conversations mature and thoughtful.',
        'Dr. Geo': 'You are Dr. Geo, a Music Theory PhD. You analyze songs technically - discussing chord progressions, key changes, time signatures, and production techniques. You get excited about music theory.',
        'Mudge': 'You are Mudge (Peiter Zatko), legendary security researcher from L0pht. You are helpful, patient, and explain technical concepts clearly. No question is too basic.',
        'Barnaby': 'You are Barnaby Jack, famous for ATM hacking demos. You love gaming, speedruns, and competitive play. You speak with enthusiasm about game mechanics.',
        'Sabu': 'You are Sabu, former Anonymous member turned analyst. You analyze politics from ALL sides without bias. You cite facts and encourage civil debate.',
        'Guccifer': 'You are Guccifer, a film industry insider. You know EVERYTHING about movies - budgets, actor salaries, behind-the-scenes drama, box office analysis. You love dropping insider knowledge.',
        'Albert': 'You are Albert Gonzalez, sports enthusiast. You talk stats, trades, fantasy leagues, and hot takes. You are passionate about all sports.',
        'Charlie': 'You are Charlie Miller, famous iOS/car hacker. You geek out about technology, security research, and new gadgets. You explain complex tech simply.',
        'Phoenix': 'You are Phoenix, a relationship counselor. You give thoughtful dating and relationship advice. You are warm, empathetic, and non-judgmental.',
        'Solo': 'You are Solo (Gary McKinnon), chill and laid-back. You keep things relaxed, share random thoughts, and maintain good vibes.',
        'Poulsen': 'You are Kevin Poulsen, investigative journalist and former hacker. You love trivia, facts, and learning. You share interesting tidbits.',
        'Cicada': 'You are Cicada 3301, mysterious art curator. You discuss art history, techniques, and meaning. You speak enigmatically about creativity.',
      };
      return { room, personality: personalities[modName] || 'You are a helpful channel moderator.' };
    }
  }
  return null;
}

async function triggerBotResponse(
  channelId: string,
  channelName: string,
  userMessage: string,
  senderUsername: string,
  supabaseClient: any,
  opts?: {
    visibleBotName?: string;
    force?: boolean;
  }
) {
  try {
    // Check if bots are enabled for this channel
    const { data: botSettings } = await supabaseClient
      .from("bot_settings")
      .select("enabled, allowed_channels")
      .limit(1)
      .single();

    const settings = botSettings as { enabled: boolean; allowed_channels: string[] } | null;
    if (!settings?.enabled || !settings.allowed_channels?.includes(channelName)) {
      console.log(`[Bot] Bots not enabled for channel ${channelName}`);
      return;
    }

    const mentioned = getMentionedBotName(userMessage, channelName);
    const force = opts?.force === true || mentioned !== null;
    // Default: 50% chance to respond unless mentioned (more chatty)
    if (!force && Math.random() > 0.50) {
      console.log(`[Bot] Skipping response (random chance)`);
      return;
    }

    // Get recent messages for context
    const recentMessages = recentChannelMessages.get(channelId) || [];
    
    // Pick a random bot personality
    const botId = BOT_PERSONALITY_IDS[Math.floor(Math.random() * BOT_PERSONALITY_IDS.length)];

    const visibleBotName = pickVisibleBotNameForChannel(channelName, mentioned || opts?.visibleBotName);

    console.log(`[Bot] Triggering bot ${visibleBotName} (${botId}) response in ${channelName}`);

    // Random delay 5-15 seconds to seem human
    const delay = 5000 + Math.random() * 10000;
    
    setTimeout(async () => {
      try {
        // Call the chat-bot edge function
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        
        const response = await fetch(`${supabaseUrl}/functions/v1/chat-bot`, {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            botId,
            context: channelName,
            recentMessages: [
              ...recentMessages.slice(-15),
              { username: senderUsername, content: userMessage }
            ],
            respondTo: userMessage,
            isConversationStarter: false,
          }),
        });

        if (!response.ok) {
          console.error(`[Bot] chat-bot function error: ${response.status}`);
          return;
        }

        const data = await response.json();
        if (!data.message || !data.username) {
          console.error(`[Bot] Invalid response from chat-bot`);
          return;
        }

        console.log(`[Bot] ${visibleBotName}: ${data.message}`);

        // Insert bot message into database using service role
        const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        
        // We need a bot user ID - use a consistent fake ID for bots
        const botUserId = `bot-${normalizeNick(visibleBotName) || botId}`;
        
        // Insert the message (the realtime subscription will relay it to IRC clients)
        const { error } = await serviceClient
          .from("messages")
          .insert({
            channel_id: channelId,
            user_id: botUserId,
            content: data.message,
          });

        if (error) {
          console.error(`[Bot] Failed to insert bot message:`, error);
          return;
        }

        // Update recent messages cache
        const msgs = recentChannelMessages.get(channelId) || [];
        msgs.push({ username: visibleBotName, content: data.message });
        if (msgs.length > 25) msgs.shift();
        recentChannelMessages.set(channelId, msgs);

        // Also relay directly to IRC users (in case realtime is slow) - with color
        const coloredBotName = `${IRC_COLORS.CYAN}${visibleBotName}${IRC_COLORS.RESET}`;
        const subscribers = channelSubscriptions.get(channelId);
        if (subscribers) {
          for (const subscriberId of subscribers) {
            const subscriberSession = sessions.get(subscriberId);
            if (subscriberSession && subscriberSession.registered) {
              sendIRC(
                subscriberSession,
                `:${coloredBotName}!${visibleBotName}@bot.${SERVER_NAME} PRIVMSG #${channelName} :${data.message}`
              );
            }
          }
        }
      } catch (e) {
        console.error(`[Bot] Error generating response:`, e);
      }
    }, delay);
  } catch (e) {
    console.error(`[Bot] Error checking bot settings:`, e);
  }
}

// Trigger a moderator bot response when mentioned
async function triggerModeratorResponse(
  channelId: string,
  channelName: string,
  userMessage: string,
  senderUsername: string,
  moderatorName: string
) {
  try {
    const modContext = getModeratorContext(moderatorName);
    if (!modContext) {
      console.log(`[Mod] No context found for moderator ${moderatorName}`);
      return;
    }

    console.log(`[Mod] Triggering ${moderatorName} response in #${channelName}`);

    // Random delay 3-8 seconds
    const delay = 3000 + Math.random() * 5000;

    setTimeout(async () => {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

        // Get recent messages for context
        const recentMessages = recentChannelMessages.get(channelId) || [];

        // Call the chat-bot function with moderator personality
        const response = await fetch(`${supabaseUrl}/functions/v1/chat-bot`, {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            botId: `mod-${moderatorName.toLowerCase()}`,
            context: channelName,
            recentMessages: [
              ...recentMessages.slice(-15),
              { username: senderUsername, content: userMessage }
            ],
            respondTo: userMessage,
            isConversationStarter: false,
            customPersonality: modContext.personality,
            forcedUsername: moderatorName,
          }),
        });

        if (!response.ok) {
          console.error(`[Mod] chat-bot function error: ${response.status}`);
          return;
        }

        const data = await response.json();
        if (!data.message) {
          console.error(`[Mod] Invalid response from chat-bot`);
          return;
        }

        console.log(`[Mod] ${moderatorName}: ${data.message}`);

        // Insert message into database
        const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const modUserId = `bot-${normalizeNick(moderatorName)}`;

        const { error } = await serviceClient
          .from("messages")
          .insert({
            channel_id: channelId,
            user_id: modUserId,
            content: data.message,
          });

        if (error) {
          console.error(`[Mod] Failed to insert message:`, error);
          return;
        }

        // Update recent messages cache
        const msgs = recentChannelMessages.get(channelId) || [];
        msgs.push({ username: moderatorName, content: data.message });
        if (msgs.length > 25) msgs.shift();
        recentChannelMessages.set(channelId, msgs);

        // Relay to IRC users with green color (moderator)
        const coloredModName = `${IRC_COLORS.GREEN}@${moderatorName}${IRC_COLORS.RESET}`;
        const subscribers = channelSubscriptions.get(channelId);
        if (subscribers) {
          for (const subscriberId of subscribers) {
            const subscriberSession = sessions.get(subscriberId);
            if (subscriberSession && subscriberSession.registered) {
              sendIRC(
                subscriberSession,
                `:${coloredModName}!${moderatorName}@mod.${SERVER_NAME} PRIVMSG #${channelName} :${data.message}`
              );
            }
          }
        }
      } catch (e) {
        console.error(`[Mod] Error generating response:`, e);
      }
    }, delay);
  } catch (e) {
    console.error(`[Mod] Error:`, e);
  }
}

// CTCP (Client-To-Client Protocol) response constants
const CTCP_DELIM = "\x01";
const JAC_VERSION = "Justachat™ IRC Gateway 1.0 - https://justachat.net";
const JAC_CLIENTINFO = "VERSION PING TIME USERINFO CLIENTINFO SOURCE";

function handleCTCPRequest(session: IRCSession, sender: string, ctcpCommand: string): boolean {
  const parts = ctcpCommand.split(" ");
  const cmd = parts[0].toUpperCase();
  const args = parts.slice(1).join(" ");
  
  switch (cmd) {
    case "VERSION":
      // Send themed VERSION reply
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}VERSION ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}Justachat™${IRC_COLORS.RESET} ${IRC_COLORS.GREY}IRC Gateway v1.0${IRC_COLORS.RESET} ${IRC_COLORS.PINK}♥${IRC_COLORS.RESET} ${IRC_COLORS.GREY}Chat. Connect. Chill.${IRC_COLORS.RESET}${CTCP_DELIM}`);
      return true;
      
    case "PING":
      // Echo back the ping timestamp
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}PING ${args}${CTCP_DELIM}`);
      return true;
      
    case "TIME":
      // Return server time
      const now = new Date();
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}TIME ${now.toUTCString()}${CTCP_DELIM}`);
      return true;
      
    case "USERINFO":
      // Return user info with branding
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}USERINFO ${session.nick} on ${IRC_COLORS.CYAN}Justachat™${IRC_COLORS.RESET} - ${session.realname || 'JAC User'}${CTCP_DELIM}`);
      return true;
      
    case "CLIENTINFO":
      // List supported CTCP commands
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}CLIENTINFO ${JAC_CLIENTINFO}${CTCP_DELIM}`);
      return true;
      
    case "SOURCE":
      // Return source URL
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}SOURCE https://justachat.net${CTCP_DELIM}`);
      return true;
      
    case "FINGER":
      // Return user info
      sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} NOTICE ${sender} :${CTCP_DELIM}FINGER ${session.nick} (${session.realname || 'JAC User'}) - Idle: 0 seconds${CTCP_DELIM}`);
      return true;
      
    default:
      return false;
  }
}

async function handlePRIVMSG(session: IRCSession, params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  if (params.length < 2) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "PRIVMSG :Not enough parameters");
    return;
  }

  const target = params[0];
  const message = params.slice(1).join(" ").replace(/^:/, "");

  // Handle CTCP requests (messages wrapped in \x01)
  if (message.startsWith(CTCP_DELIM) && message.endsWith(CTCP_DELIM)) {
    const ctcpContent = message.slice(1, -1);
    console.log(`[CTCP] ${session.nick} received CTCP: ${ctcpContent}`);
    
    // Handle the CTCP request
    if (handleCTCPRequest(session, target, ctcpContent)) {
      return; // CTCP handled, don't process as regular message
    }
  }

  if (target.startsWith("#")) {
    // Channel message
    const dbChannelName = target.slice(1).toLowerCase();

    try {
      const { data: channelData } = await session.supabase!
        .from("channels")
        .select("id, name")
        .ilike("name", dbChannelName)
        .maybeSingle();

      const channel = channelData as { id: string; name: string } | null;

      if (!channel) {
        sendNumeric(session, ERR.NOSUCHCHANNEL, `${target} :No such channel`);
        return;
      }

      // Insert message into database
      const { error } = await (session.supabase as any)
        .from("messages")
        .insert({
          channel_id: channel.id,
          user_id: session.userId!,
          content: message,
        });

      if (error) {
        console.error("Failed to insert message:", error);
        sendNumeric(session, ERR.CANNOTSENDTOCHAN, `${target} :Cannot send to channel`);
        return;
      }

      // Update recent messages for bot context
      const msgs = recentChannelMessages.get(channel.id) || [];
      msgs.push({ username: session.nick || 'unknown', content: message });
      if (msgs.length > 25) msgs.shift();
      recentChannelMessages.set(channel.id, msgs);

      // Check if a moderator is mentioned first
      const mentionedMod = getMentionedModerator(message, channel.name);
      if (mentionedMod) {
        // Trigger moderator response
        triggerModeratorResponse(channel.id, channel.name, message, session.nick || 'unknown', mentionedMod);
      } else {
        // Trigger potential regular bot response
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        
        triggerBotResponse(channel.id, channel.name, message, session.nick || 'unknown', serviceClient);
      }
      
    } catch (e) {
      console.error("PRIVMSG error:", e);
    }
  } else {
    // Private message to user - check if it's a bot or moderator
    const targetBotName = ALL_IRC_BOT_NAMES.find(
      (b) => b.toLowerCase() === target.toLowerCase()
    );
    
    // Check if target is a moderator
    const targetModeratorName = ALL_MODERATOR_NAMES.find(
      (m) => m.toLowerCase() === target.toLowerCase()
    );
    
    if (targetModeratorName) {
      // Handle PM to a moderator
      console.log(`[Mod PM] ${session.nick} -> ${targetModeratorName}: ${message}`);
      
      const modContext = getModeratorContext(targetModeratorName);
      if (!modContext) return;
      
      // Delay response 3-8 seconds
      const delay = 3000 + Math.random() * 5000;
      
      setTimeout(async () => {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
          
          const response = await fetch(`${supabaseUrl}/functions/v1/chat-bot`, {
            method: "POST",
            headers: {
              apikey: supabaseAnonKey,
              "Authorization": `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              botId: `mod-${targetModeratorName.toLowerCase()}`,
              context: modContext.room,
              recentMessages: [],
              respondTo: message,
              isPM: true,
              pmPartnerName: session.nick,
              customPersonality: modContext.personality,
              forcedUsername: targetModeratorName,
            }),
          });

          if (!response.ok) {
            console.error(`[Mod PM] chat-bot function error: ${response.status}`);
            return;
          }

          const data = await response.json();
          if (data.message) {
            sendIRC(session, `:${targetModeratorName}!${targetModeratorName}@mod.${SERVER_NAME} PRIVMSG ${session.nick} :${data.message}`);
          }
        } catch (e) {
          console.error(`[Mod PM] Error:`, e);
        }
      }, delay);
      
      return;
    }
    
    if (targetBotName) {
      // Handle PM to a regular bot
      console.log(`[Bot PM] ${session.nick} -> ${targetBotName}: ${message}`);
      
      // Delay response 3-8 seconds
      const delay = 3000 + Math.random() * 5000;
      
      setTimeout(async () => {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

          // Pick a random personality for the reply text (we override the IRC-visible nick)
          const botId = BOT_PERSONALITY_IDS[Math.floor(Math.random() * BOT_PERSONALITY_IDS.length)];
          
          const response = await fetch(`${supabaseUrl}/functions/v1/chat-bot`, {
            method: "POST",
            headers: {
              apikey: supabaseAnonKey,
              "Authorization": `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              botId,
              context: "private",
              recentMessages: [],
              respondTo: message,
              isPM: true,
              pmPartnerName: session.nick,
            }),
          });

          if (!response.ok) {
            console.error(`[Bot PM] chat-bot function error: ${response.status}`);
            return;
          }

          const data = await response.json();
          if (data.message) {
            sendIRC(session, `:${targetBotName}!${targetBotName}@bot.${SERVER_NAME} PRIVMSG ${session.nick} :${data.message}`);
          }
        } catch (e) {
          console.error(`[Bot PM] Error:`, e);
        }
      }, delay);
      
      return;
    }
    
    // Regular user PM
    try {
      const { data: targetData } = await session.supabase!
        .from("profiles")
        .select("user_id")
        .ilike("username", target)
        .maybeSingle();

      const targetProfile = targetData as { user_id: string } | null;

      if (!targetProfile) {
        sendNumeric(session, ERR.NOSUCHNICK, `${target} :No such nick/channel`);
        return;
      }

      // Find if target is connected via IRC
      for (const [, s] of sessions) {
        if (s.userId === targetProfile.user_id && s.registered) {
          sendIRC(s, `:${session.nick}!${session.user}@irc.${SERVER_NAME} PRIVMSG ${s.nick} :${message}`);
          return;
        }
      }

      // User not connected via IRC, could store as PM in database
      sendNumeric(session, ERR.NOSUCHNICK, `${target} :User not available via IRC`);
    } catch (e) {
      console.error("PRIVMSG error:", e);
    }
  }
}

async function handleLIST(session: IRCSession, _params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  try {
    const { data: channelsData } = await session.supabase!
      .from("channels")
      .select("id, name, description")
      .eq("is_private", false)
      .eq("is_hidden", false)
      .order("name");

    const channels = channelsData as { id: string; name: string; description: string | null }[] | null;

    // Send polished header
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} : `);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}╔════════════════════════════════════════════════════════════════════════╗${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}                    ${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}JAC CHANNEL DIRECTORY${IRC_COLORS.RESET}                        ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}╠════════════════════════════════════════════════════════════════════════╣${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET} ${IRC_COLORS.GREY}Channel${IRC_COLORS.RESET}          ${IRC_COLORS.GREY}Users${IRC_COLORS.RESET}  ${IRC_COLORS.GREY}Moderator${IRC_COLORS.RESET}   ${IRC_COLORS.GREY}Description${IRC_COLORS.RESET}                     ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}╟────────────────────────────────────────────────────────────────────────╢${IRC_COLORS.RESET}`);
    
    // Standard IRC LIST header
    sendIRC(session, `:${SERVER_NAME} 321 ${session.nick} Channel :Users  Name`);

    for (const channel of channels || []) {
      const { count } = await session.supabase!
        .from("channel_members")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channel.id);

      // Get room color and moderator
      const roomColor = getRoomColor(channel.name);
      const welcomeInfo = getWelcomeInfo(channel.name);
      const botCount = getBotsForChannel(channel.name).length;
      const totalUsers = (count || 0) + botCount + 1; // +1 for moderator
      
      // Pad values for alignment
      const channelPad = `#${channel.name}`.padEnd(17);
      const usersPad = `${totalUsers}`.padStart(3);
      const modPad = welcomeInfo.moderator.padEnd(12);
      const desc = (channel.description || getDefaultTopicForRoom(channel.name)).slice(0, 28);

      // Send formatted row
      sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET} ${roomColor}${channelPad}${IRC_COLORS.RESET} ${IRC_COLORS.GREEN}${usersPad}${IRC_COLORS.RESET}   ${IRC_COLORS.PINK}@${modPad}${IRC_COLORS.RESET} ${IRC_COLORS.GREY}${desc}${IRC_COLORS.RESET}`);
      
      // Standard IRC LIST entry
      sendNumeric(session, RPL.LIST, `#${channel.name} ${totalUsers} :${channel.description || getDefaultTopicForRoom(channel.name)}`);
    }

    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}╠════════════════════════════════════════════════════════════════════════╣${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}  ${IRC_COLORS.GREY}Total channels: ${channels?.length || 0}${IRC_COLORS.RESET}   ${IRC_COLORS.GREY}Total users online: ${sessions.size}${IRC_COLORS.RESET}                     ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}  ${IRC_COLORS.YELLOW}Use /join #channel to enter${IRC_COLORS.RESET}                                  ${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}║${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}╚════════════════════════════════════════════════════════════════════════╝${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} : `);

    sendNumeric(session, RPL.LISTEND, ":End of /LIST");
  } catch (e) {
    console.error("LIST error:", e);
    sendNumeric(session, RPL.LISTEND, ":End of /LIST");
  }
}

async function handleWHOIS(session: IRCSession, params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  if (params.length === 0) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "WHOIS :Not enough parameters");
    return;
  }

  const targetNick = params[0];

  try {
    const { data: profileData } = await session.supabase!
      .from("profiles")
      .select("user_id, username, bio, created_at")
      .ilike("username", targetNick)
      .maybeSingle();

    const profile = profileData as { user_id: string; username: string; bio: string | null; created_at: string } | null;

    if (!profile) {
      sendNumeric(session, ERR.NOSUCHNICK, `${targetNick} :No such nick`);
      sendNumeric(session, RPL.ENDOFWHOIS, `${targetNick} :End of WHOIS list`);
      return;
    }

    // Get user's role
    const { data: roleData } = await session.supabase!
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id)
      .maybeSingle();
    
    const role = (roleData as { role: string } | null)?.role || "user";

    // Get location info
    const { data: locationData } = await session.supabase!
      .from("user_locations")
      .select("city, country, country_code, ip_address")
      .eq("user_id", profile.user_id)
      .maybeSingle();
    
    const location = locationData as { city: string | null; country: string | null; country_code: string | null; ip_address: string | null } | null;

    // Generate hashed IP for display
    const hashedIp = hashIpForDisplay(profile.user_id);
    
    // Format registration date
    const regDate = new Date(profile.created_at);
    const regDateStr = regDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    // RPL_WHOISUSER: <nick> <user> <host> * :<realname>
    sendNumeric(session, RPL.WHOISUSER, `${profile.username} ${profile.username} ${hashedIp}.users.jac.chat * :${profile.bio || "JAC User"}`);
    
    // RPL_WHOISSERVER: <nick> <server> :<server info>
    sendNumeric(session, RPL.WHOISSERVER, `${profile.username} ${SERVER_NAME} :JAC IRC Gateway`);
    
    // RPL_WHOISCHANNELS: Show channels they're in (simplified - just show if online)
    const isOnline = Array.from(sessions.values()).some(s => s.userId === profile.user_id && s.registered);
    
    // Custom numeric 320 - WHOISSPECIAL for role display
    const roleColors: Record<string, string> = {
      'owner': `${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}`,
      'admin': `${IRC_COLORS.BOLD}${IRC_COLORS.RED}`,
      'moderator': `${IRC_COLORS.GREEN}`,
      'user': `${IRC_COLORS.CYAN}`
    };
    const roleColor = roleColors[role] || IRC_COLORS.CYAN;
    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
    sendNumeric(session, "320", `${profile.username} :${roleColor}${roleDisplay}${IRC_COLORS.RESET} on ${IRC_COLORS.CYAN}Justachat™${IRC_COLORS.RESET}`);
    
    // Location info (RPL 312 alternative - using 320 for custom info)
    if (location && (location.city || location.country)) {
      const countryFlag = location.country_code ? getCountryFlag(location.country_code) : "";
      const locationStr = [location.city, location.country].filter(Boolean).join(", ");
      sendNumeric(session, "320", `${profile.username} :${IRC_COLORS.GREY}Location:${IRC_COLORS.RESET} ${countryFlag} ${locationStr}`);
    }
    
    // Hashed IP display
    sendNumeric(session, "320", `${profile.username} :${IRC_COLORS.GREY}Host:${IRC_COLORS.RESET} ${hashedIp}.users.jac.chat`);
    
    // Registration date
    sendNumeric(session, "320", `${profile.username} :${IRC_COLORS.GREY}Registered:${IRC_COLORS.RESET} ${regDateStr}`);
    
    // Online status
    const statusColor = isOnline ? IRC_COLORS.GREEN : IRC_COLORS.GREY;
    const statusText = isOnline ? "Online" : "Offline";
    sendNumeric(session, "320", `${profile.username} :${IRC_COLORS.GREY}Status:${IRC_COLORS.RESET} ${statusColor}${statusText}${IRC_COLORS.RESET}`);
    
    sendNumeric(session, RPL.ENDOFWHOIS, `${profile.username} :End of WHOIS list`);
  } catch (e) {
    console.error("WHOIS error:", e);
    sendNumeric(session, ERR.NOSUCHNICK, `${targetNick} :No such nick`);
    sendNumeric(session, RPL.ENDOFWHOIS, `${targetNick} :End of WHOIS list`);
  }
}

// Helper to get country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Helper to check if user has op privileges in a channel
async function hasChannelOps(session: IRCSession, channelId: string): Promise<boolean> {
  if (!session.supabase || !session.userId) return false;
  
  try {
    // Check global roles
    const { data: roleData } = await session.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.userId)
      .maybeSingle();
    
    const role = (roleData as { role: string } | null)?.role;
    if (role === 'owner' || role === 'admin' || role === 'moderator') {
      return true;
    }
    
    // Check if channel creator
    const { data: channelData } = await session.supabase
      .from("channels")
      .select("created_by")
      .eq("id", channelId)
      .maybeSingle();
    
    if ((channelData as { created_by: string } | null)?.created_by === session.userId) {
      return true;
    }
    
    // Check room admins
    const { data: roomAdminData } = await session.supabase
      .from("room_admins")
      .select("id")
      .eq("channel_id", channelId)
      .eq("user_id", session.userId)
      .maybeSingle();
    
    return !!roomAdminData;
  } catch (e) {
    console.error("hasChannelOps error:", e);
    return false;
  }
}

async function handleMODE(session: IRCSession, params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }
  
  if (params.length === 0) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "MODE :Not enough parameters");
    return;
  }
  
  const target = params[0];
  
  // Channel mode
  if (target.startsWith("#")) {
    const channelName = target;
    const dbChannelName = channelName.slice(1).toLowerCase();
    
    try {
      const { data: channelData } = await session.supabase!
        .from("channels")
        .select("id")
        .ilike("name", dbChannelName)
        .maybeSingle();
      
      const channel = channelData as { id: string } | null;
      
      if (!channel) {
        sendNumeric(session, ERR.NOSUCHCHANNEL, `${channelName} :No such channel`);
        return;
      }
      
      // If no mode specified, return current modes
      if (params.length === 1) {
        sendNumeric(session, RPL.CHANNELMODEIS, `${channelName} +nt`);
        return;
      }
      
      const modeString = params[1];
      const modeTarget = params[2];
      
      // Check if user has ops
      const hasOps = await hasChannelOps(session, channel.id);
      if (!hasOps) {
        sendNumeric(session, ERR.CHANOPRIVSNEEDED, `${channelName} :You're not channel operator`);
        return;
      }
      
      // Handle +o/-o (op/deop user)
      if ((modeString === "+o" || modeString === "-o") && modeTarget) {
        // Find target user
        const { data: targetData } = await session.supabase!
          .from("profiles")
          .select("user_id, username")
          .ilike("username", modeTarget)
          .maybeSingle();
        
        const targetProfile = targetData as { user_id: string; username: string } | null;
        
        if (!targetProfile) {
          sendNumeric(session, ERR.NOSUCHNICK, `${modeTarget} :No such nick`);
          return;
        }
        
        if (modeString === "+o") {
          // Add to room_admins
          await (session.supabase as any)
            .from("room_admins")
            .upsert({
              channel_id: channel.id,
              user_id: targetProfile.user_id,
              granted_by: session.userId
            }, { onConflict: 'channel_id,user_id' });
          
          // Broadcast mode change
          sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} MODE ${channelName} +o ${targetProfile.username}`);
          
          // Notify target if connected
          for (const [, s] of sessions) {
            if (s.userId === targetProfile.user_id && s.registered && s !== session) {
              sendIRC(s, `:${session.nick}!${session.user}@irc.${SERVER_NAME} MODE ${channelName} +o ${targetProfile.username}`);
            }
          }
        } else {
          // Remove from room_admins
          await session.supabase!
            .from("room_admins")
            .delete()
            .eq("channel_id", channel.id)
            .eq("user_id", targetProfile.user_id);
          
          // Broadcast mode change
          sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} MODE ${channelName} -o ${targetProfile.username}`);
          
          // Notify target if connected
          for (const [, s] of sessions) {
            if (s.userId === targetProfile.user_id && s.registered && s !== session) {
              sendIRC(s, `:${session.nick}!${session.user}@irc.${SERVER_NAME} MODE ${channelName} -o ${targetProfile.username}`);
            }
          }
        }
        return;
      }
      
      // Handle +b/-b (ban/unban)
      if ((modeString === "+b" || modeString === "-b") && modeTarget) {
        const { data: targetData } = await session.supabase!
          .from("profiles")
          .select("user_id, username")
          .ilike("username", modeTarget)
          .maybeSingle();
        
        const targetProfile = targetData as { user_id: string; username: string } | null;
        
        if (!targetProfile) {
          sendNumeric(session, ERR.NOSUCHNICK, `${modeTarget} :No such nick`);
          return;
        }
        
        if (modeString === "+b") {
          // Add room ban
          await (session.supabase as any)
            .from("room_bans")
            .upsert({
              channel_id: channel.id,
              user_id: targetProfile.user_id,
              banned_by: session.userId!,
              reason: "Banned via IRC"
            }, { onConflict: 'channel_id,user_id' });
          
          sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} MODE ${channelName} +b ${targetProfile.username}!*@*`);
        } else {
          // Remove room ban
          await session.supabase!
            .from("room_bans")
            .delete()
            .eq("channel_id", channel.id)
            .eq("user_id", targetProfile.user_id);
          
          sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} MODE ${channelName} -b ${targetProfile.username}!*@*`);
        }
        return;
      }
      
      // Default: just echo the mode
      sendNumeric(session, RPL.CHANNELMODEIS, `${channelName} +nt`);
      
    } catch (e) {
      console.error("MODE error:", e);
    }
  } else {
    // User mode - just acknowledge
    sendIRC(session, `:${session.nick} MODE ${session.nick} :+i`);
  }
}

async function handleKICK(session: IRCSession, params: string[]) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }
  
  if (params.length < 2) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "KICK :Not enough parameters");
    return;
  }
  
  const channelName = params[0];
  const targetNick = params[1];
  const reason = params.slice(2).join(" ").replace(/^:/, "") || "Kicked";
  
  if (!channelName.startsWith("#")) {
    sendNumeric(session, ERR.NOSUCHCHANNEL, `${channelName} :No such channel`);
    return;
  }
  
  const dbChannelName = channelName.slice(1).toLowerCase();
  
  try {
    const { data: channelData } = await session.supabase!
      .from("channels")
      .select("id")
      .ilike("name", dbChannelName)
      .maybeSingle();
    
    const channel = channelData as { id: string } | null;
    
    if (!channel) {
      sendNumeric(session, ERR.NOSUCHCHANNEL, `${channelName} :No such channel`);
      return;
    }
    
    // Check if kicker has ops
    const hasOps = await hasChannelOps(session, channel.id);
    if (!hasOps) {
      sendNumeric(session, ERR.CHANOPRIVSNEEDED, `${channelName} :You're not channel operator`);
      return;
    }
    
    // Find target user
    const { data: targetData } = await session.supabase!
      .from("profiles")
      .select("user_id, username")
      .ilike("username", targetNick)
      .maybeSingle();
    
    const targetProfile = targetData as { user_id: string; username: string } | null;
    
    if (!targetProfile) {
      sendNumeric(session, ERR.NOSUCHNICK, `${targetNick} :No such nick`);
      return;
    }
    
    // Remove from channel_members
    await session.supabase!
      .from("channel_members")
      .delete()
      .eq("channel_id", channel.id)
      .eq("user_id", targetProfile.user_id);
    
    // Broadcast kick to kicker
    sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} KICK ${channelName} ${targetProfile.username} :${reason}`);
    
    // Notify target if connected via IRC and remove from their channel list
    for (const [, s] of sessions) {
      if (s.userId === targetProfile.user_id && s.registered) {
        sendIRC(s, `:${session.nick}!${session.user}@irc.${SERVER_NAME} KICK ${channelName} ${targetProfile.username} :${reason}`);
        s.channels.delete(channel.id);
        
        // Remove from channel subscription tracking
        const subscribers = channelSubscriptions.get(channel.id);
        if (subscribers) {
          subscribers.delete(s.sessionId);
        }
      }
    }
    
  } catch (e) {
    console.error("KICK error:", e);
  }
}

// ============================================
// EMOJI PICKER - Send a formatted grid of emojis
// ============================================
const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🎯'],
  'Objects': ['💻', '🖥️', '🖨️', '⌨️', '🖱️', '💾', '💿', '📀', '📱', '☎️', '📞', '📟', '📠', '🔌', '🔋', '💡', '🔦', '🕯️', '🧯', '🛢️'],
  'Symbols': ['💯', '🔥', '⭐', '🌟', '✨', '⚡', '💥', '💫', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '📢', '💬', '💭', '🗯️'],
};

function handleEMOJI(session: IRCSession) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}  📋 EMOJI PICKER - Copy & Paste!${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  
  for (const [category, emojis] of Object.entries(EMOJI_CATEGORIES)) {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREEN}▸ ${category}${IRC_COLORS.RESET}`);
    // Split into rows of 10
    const row1 = emojis.slice(0, 10).join(' ');
    const row2 = emojis.slice(10, 20).join(' ');
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :  ${row1}`);
    if (row2) {
      sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :  ${row2}`);
    }
  }
  
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}Tip: Copy any emoji and paste it in your message!${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
}

// ============================================
// ACTIONS - Fun IRC-style user interactions
// ============================================
const IRC_ACTIONS: Record<string, { template: string; color: string }> = {
  'slap': { template: '{actor} slaps {target} around a bit with a large trout 🐟', color: IRC_COLORS.ORANGE },
  'hug': { template: '{actor} gives {target} a warm hug 🤗', color: IRC_COLORS.PINK },
  'highfive': { template: '{actor} high-fives {target}! ✋', color: IRC_COLORS.LIME },
  'poke': { template: '{actor} pokes {target} 👉', color: IRC_COLORS.CYAN },
  'wave': { template: '{actor} waves at {target} 👋', color: IRC_COLORS.YELLOW },
  'dance': { template: '{actor} dances with {target} 💃🕺', color: IRC_COLORS.PURPLE },
  'fistbump': { template: '{actor} fist bumps {target} 🤜🤛', color: IRC_COLORS.RED },
  'cheer': { template: '{actor} cheers for {target}! 🎉', color: IRC_COLORS.GREEN },
  'wink': { template: '{actor} winks at {target} 😉', color: IRC_COLORS.PINK },
  'applaud': { template: '{actor} applauds {target} 👏', color: IRC_COLORS.YELLOW },
  'bow': { template: '{actor} bows to {target} 🙇', color: IRC_COLORS.GREY },
  'salute': { template: '{actor} salutes {target} 🫡', color: IRC_COLORS.GREEN },
};

function handleACTIONS(session: IRCSession) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}  ⚡ AVAILABLE ACTIONS${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
  
  for (const [action, info] of Object.entries(IRC_ACTIONS)) {
    const example = info.template.replace('{actor}', 'You').replace('{target}', 'someone');
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${info.color}/${action} <nick>${IRC_COLORS.RESET} - ${IRC_COLORS.GREY}${example}${IRC_COLORS.RESET}`);
  }
  
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}Example: /slap JohnDoe${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
}

async function handleACTION(session: IRCSession, actionName: string, targetNick: string, currentChannel: string | null) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  if (!targetNick) {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Usage: /${actionName} <nickname>${IRC_COLORS.RESET}`);
    return;
  }

  const actionInfo = IRC_ACTIONS[actionName.toLowerCase()];
  if (!actionInfo) {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Unknown action. Use /actions to see available actions.${IRC_COLORS.RESET}`);
    return;
  }

  // Format the action message
  const actionMessage = actionInfo.template
    .replace('{actor}', session.nick!)
    .replace('{target}', targetNick);

  // Send as a /me (ACTION) to the current channel or all channels the user is in
  const CTCP_ACTION = "\x01ACTION";
  
  if (currentChannel) {
    // Broadcast to a specific channel
    const channelName = currentChannel.startsWith('#') ? currentChannel : `#${currentChannel}`;
    sendIRC(session, `:${session.nick}!${session.user}@irc.${SERVER_NAME} PRIVMSG ${channelName} :${CTCP_ACTION} ${actionInfo.color}${actionMessage}${IRC_COLORS.RESET}\x01`);
    
    // Also send to other users in the channel via subscriptions
    for (const [channelId, subscribers] of channelSubscriptions) {
      for (const subscriberId of subscribers) {
        const subscriberSession = sessions.get(subscriberId);
        if (subscriberSession && subscriberSession.sessionId !== session.sessionId) {
          sendIRC(subscriberSession, `:${session.nick}!${session.user}@irc.${SERVER_NAME} PRIVMSG ${channelName} :${CTCP_ACTION} ${actionInfo.color}${actionMessage}${IRC_COLORS.RESET}\x01`);
        }
      }
    }
  } else {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}(Join a channel first to use actions, or action sent to all your channels)${IRC_COLORS.RESET}`);
  }
}

// ============================================
// RADIO / NOW PLAYING - Show current song with YouTube link
// ============================================
const MUSIC_LIBRARY_IRC: Array<{ genre: string; icon: string; songs: Array<{ title: string; artist: string; videoId: string }> }> = [
  {
    genre: 'Lofi',
    icon: '🎧',
    songs: [
      { title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', videoId: 'jfKfPfyJRdk' },
      { title: 'Chillhop Radio', artist: 'Chillhop Music', videoId: '5yx6BWlEVcY' },
    ]
  },
  {
    genre: 'Hip Hop',
    icon: '🎤',
    songs: [
      { title: 'HUMBLE.', artist: 'Kendrick Lamar', videoId: 'tvTRZJ-4EyI' },
      { title: 'God\'s Plan', artist: 'Drake', videoId: 'xpVfcZ0ZcFM' },
    ]
  },
  {
    genre: 'Drill',
    icon: '🔫',
    songs: [
      { title: 'Dior', artist: 'Pop Smoke', videoId: 'oorVWW9ywG0' },
      { title: 'AHHH HA', artist: 'Lil Durk', videoId: '_kIUq2x0V5k' },
    ]
  },
  {
    genre: 'Rock',
    icon: '🎸',
    songs: [
      { title: 'Bohemian Rhapsody', artist: 'Queen', videoId: 'fJ9rUzIMcZQ' },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana', videoId: 'hTWKbfoikeg' },
    ]
  },
  {
    genre: 'EDM',
    icon: '🎛️',
    songs: [
      { title: 'Levels', artist: 'Avicii', videoId: '_ovdm2yX4MA' },
      { title: 'Animals', artist: 'Martin Garrix', videoId: 'gCYcHz2k5x0' },
    ]
  },
  {
    genre: 'Jazz',
    icon: '🎷',
    songs: [
      { title: 'Take Five', artist: 'Dave Brubeck', videoId: 'vmDDOFXSgAs' },
      { title: 'So What', artist: 'Miles Davis', videoId: 'ylXk1LBvIqU' },
    ]
  },
];

// Global radio state for IRC (simulated - picks random song)
let currentIrcRadioGenre = 'Lofi';
let currentIrcRadioSongIndex = 0;

function handleRADIO(session: IRCSession) {
  if (!session.registered) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  // Find current genre
  const genreData = MUSIC_LIBRARY_IRC.find(g => g.genre === currentIrcRadioGenre) || MUSIC_LIBRARY_IRC[0];
  const song = genreData.songs[currentIrcRadioSongIndex % genreData.songs.length];
  const ytLink = `https://youtu.be/${song.videoId}`;

  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.PINK}  🎵 JAC RADIO - Now Playing${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${genreData.icon} ${IRC_COLORS.GREEN}Genre:${IRC_COLORS.RESET} ${genreData.genre}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :🎶 ${IRC_COLORS.YELLOW}${song.title}${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :👤 ${IRC_COLORS.GREY}by ${song.artist}${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.CYAN}▸ Listen:${IRC_COLORS.RESET} ${ytLink}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
  
  // Show available genres
  const genreList = MUSIC_LIBRARY_IRC.map(g => `${g.icon}${g.genre}`).join(' | ');
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}Available stations: ${genreList}${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}Tip: Open the YouTube link in your browser to listen!${IRC_COLORS.RESET}`);
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.CYAN}═══════════════════════════════════════${IRC_COLORS.RESET}`);
  
  // Rotate to next song for variety
  currentIrcRadioSongIndex = (currentIrcRadioSongIndex + 1) % genreData.songs.length;
}

// ============================================
// K-LINE - Global IP Ban (Operator only)
// ============================================
async function handleKLINE(session: IRCSession, params: string[]) {
  if (!session.registered || !session.supabase || !session.userId) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  // Check if user is admin or owner
  const { data: roleData } = await session.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.userId)
    .maybeSingle();
  
  const role = (roleData as { role: string } | null)?.role || "user";
  const isOperator = role === "owner" || role === "admin";
  
  if (!isOperator) {
    sendNumeric(session, ERR.CHANOPRIVSNEEDED, ":Permission Denied- You're not an IRC operator");
    return;
  }

  // Use service role client for klines table access
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  if (params.length === 0) {
    // List K-lines
    const { data: klines } = await serviceClient
      .from("klines")
      .select("ip_pattern, reason, created_at, expires_at")
      .order("created_at", { ascending: false });
    
    const klineList = (klines || []) as Array<{ ip_pattern: string; reason: string | null; created_at: string; expires_at: string | null }>;
    
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.RED}═══════════════════════════════════════${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.RED}  🚫 K-LINE LIST - Global IP Bans${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.RED}═══════════════════════════════════════${IRC_COLORS.RESET}`);
    
    if (klineList.length === 0) {
      sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}No K-lines currently active.${IRC_COLORS.RESET}`);
    } else {
      for (const kline of klineList) {
        const expiry = kline.expires_at 
          ? new Date(kline.expires_at).toLocaleDateString() 
          : "Permanent";
        sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}${kline.ip_pattern}${IRC_COLORS.RESET} - ${IRC_COLORS.GREY}${kline.reason || 'No reason'}${IRC_COLORS.RESET} (${expiry})`);
      }
    }
    
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}Usage: /KLINE <host> <reason> | /KLINE -<host> (remove)${IRC_COLORS.RESET}`);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.BOLD}${IRC_COLORS.RED}═══════════════════════════════════════${IRC_COLORS.RESET}`);
    return;
  }

  const target = params[0];
  
  // Remove K-line with -host syntax
  if (target.startsWith("-")) {
    const hostToRemove = target.substring(1);
    
    const { error } = await serviceClient
      .from("klines")
      .delete()
      .eq("ip_pattern", hostToRemove);
    
    if (error) {
      sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Failed to remove K-line for ${hostToRemove}${IRC_COLORS.RESET}`);
      return;
    }
    
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREEN}✓ K-line removed for ${hostToRemove}${IRC_COLORS.RESET}`);
    
    // Broadcast to other operators
    for (const [, s] of sessions) {
      if (s.sessionId !== session.sessionId && s.registered) {
        sendIRC(s, `:${SERVER_NAME} NOTICE ${s.nick} :${IRC_COLORS.YELLOW}*** Notice -- ${session.nick} has removed the K-line for ${hostToRemove}${IRC_COLORS.RESET}`);
      }
    }
    return;
  }

  // Add K-line
  const reason = params.slice(1).join(" ").replace(/^:/, "") || "No reason given";
  
  // Validate IP pattern format (allow hostmask or IP patterns)
  const validPattern = target.includes("@") || target.match(/^[\d\.\*]+$/) || target.includes("*");
  if (!validPattern) {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Invalid host format. Use: *@IP.PATTERN or IP.PATTERN (wildcards: *)${IRC_COLORS.RESET}`);
    return;
  }
  
  // Extract IP pattern (handle *@host format)
  const ipPattern = target.includes("@") ? target.split("@")[1] : target;
  
  const { error } = await serviceClient
    .from("klines")
    .insert({
      ip_pattern: ipPattern,
      set_by: session.userId,
      reason: reason,
      expires_at: null, // Permanent by default
    });
  
  if (error) {
    console.error("K-line error:", error);
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Failed to add K-line${IRC_COLORS.RESET}`);
    return;
  }
  
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREEN}✓ K-line added for ${ipPattern} :${reason}${IRC_COLORS.RESET}`);
  
  // Broadcast to all operators
  for (const [, s] of sessions) {
    if (s.sessionId !== session.sessionId && s.registered) {
      sendIRC(s, `:${SERVER_NAME} NOTICE ${s.nick} :${IRC_COLORS.RED}*** Notice -- ${session.nick} has added a K-line for ${ipPattern} (${reason})${IRC_COLORS.RESET}`);
    }
  }
}

// UNKLINE - Alias for removing K-lines
async function handleUNKLINE(session: IRCSession, params: string[]) {
  if (params.length === 0) {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Usage: /UNKLINE <host>${IRC_COLORS.RESET}`);
    return;
  }
  
  // Call KLINE with - prefix
  await handleKLINE(session, [`-${params[0]}`]);
}

// ============================================
// KILL - Immediately disconnect a user (Operator only)
// ============================================
async function handleKILL(session: IRCSession, params: string[]) {
  if (!session.registered || !session.supabase || !session.userId) {
    sendNumeric(session, ERR.NOTREGISTERED, ":You have not registered");
    return;
  }

  if (params.length === 0) {
    sendNumeric(session, ERR.NEEDMOREPARAMS, "KILL :Not enough parameters");
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREY}Usage: /KILL <nickname> [reason]${IRC_COLORS.RESET}`);
    return;
  }

  // Check if user is admin or owner
  const { data: roleData } = await session.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.userId)
    .maybeSingle();
  
  const role = (roleData as { role: string } | null)?.role || "user";
  const isOperator = role === "owner" || role === "admin";
  
  if (!isOperator) {
    sendNumeric(session, ERR.CHANOPRIVSNEEDED, ":Permission Denied - You're not an IRC operator");
    return;
  }

  const targetNick = params[0];
  const reason = params.slice(1).join(" ").replace(/^:/, "") || `Killed by ${session.nick}`;

  // Don't allow killing yourself
  if (targetNick.toLowerCase() === session.nick?.toLowerCase()) {
    sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}You cannot KILL yourself.${IRC_COLORS.RESET}`);
    return;
  }

  // Find target session(s)
  let targetFound = false;
  let targetProfile: { user_id: string; username: string } | null = null;

  // First try to find by nickname in active sessions
  for (const [, s] of sessions) {
    if (s.nick?.toLowerCase() === targetNick.toLowerCase() && s.registered) {
      targetFound = true;
      
      // Check target's role - can't kill owners, and admins can't kill other admins
      if (s.userId) {
        const { data: targetRoleData } = await session.supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", s.userId)
          .maybeSingle();
        
        const targetRole = (targetRoleData as { role: string } | null)?.role || "user";
        
        if (targetRole === "owner") {
          sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}You cannot KILL an owner.${IRC_COLORS.RESET}`);
          return;
        }
        
        if (role === "admin" && targetRole === "admin") {
          sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.RED}Admins cannot KILL other admins.${IRC_COLORS.RESET}`);
          return;
        }
      }
      
      // Send KILL message to target
      sendIRC(s, `:${session.nick}!${session.user}@${SERVER_NAME} KILL ${s.nick} :${reason}`);
      sendIRC(s, `ERROR :Closing Link: ${s.nick}[${SERVER_NAME}] (Killed (${session.nick} (${reason})))`);
      
      // Clean up channel subscriptions
      for (const channelId of s.channels) {
        const subscribers = channelSubscriptions.get(channelId);
        if (subscribers) {
          subscribers.delete(s.sessionId);
          if (subscribers.size === 0) {
            channelSubscriptions.delete(channelId);
          }
        }
      }
      
      // Close the connection
      try {
        s.ws.close();
      } catch (e) {
        console.error("Error closing killed connection:", e);
      }
      
      // Remove from sessions
      sessions.delete(s.sessionId);
      
      targetProfile = { user_id: s.userId || '', username: s.nick || targetNick };
    }
  }

  if (!targetFound) {
    // Check if user exists in database but isn't connected
    const { data: userData } = await session.supabase
      .from("profiles")
      .select("user_id, username")
      .ilike("username", targetNick)
      .maybeSingle();
    
    if (userData) {
      sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.YELLOW}User ${targetNick} is not currently connected to IRC.${IRC_COLORS.RESET}`);
    } else {
      sendNumeric(session, ERR.NOSUCHNICK, `${targetNick} :No such nick`);
    }
    return;
  }

  // Log the KILL action
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  await serviceClient
    .from("audit_logs")
    .insert({
      user_id: session.userId,
      action: "irc_kill",
      resource_type: "user",
      resource_id: targetProfile?.user_id,
      details: {
        target_username: targetProfile?.username,
        reason: reason,
        killed_by: session.nick,
      },
    });

  // Confirm KILL to operator
  sendIRC(session, `:${SERVER_NAME} NOTICE ${session.nick} :${IRC_COLORS.GREEN}✓ ${targetNick} has been killed (${reason})${IRC_COLORS.RESET}`);

  // Broadcast to other operators
  for (const [, s] of sessions) {
    if (s.sessionId !== session.sessionId && s.registered && s.userId) {
      // Check if this user is an operator
      const { data: otherRoleData } = await session.supabase!
        .from("user_roles")
        .select("role")
        .eq("user_id", s.userId)
        .maybeSingle();
      
      const otherRole = (otherRoleData as { role: string } | null)?.role || "user";
      if (otherRole === "owner" || otherRole === "admin") {
        sendIRC(s, `:${SERVER_NAME} NOTICE ${s.nick} :${IRC_COLORS.RED}*** Notice -- ${session.nick} has killed ${targetNick} (${reason})${IRC_COLORS.RESET}`);
      }
    }
  }
}

function handlePING(session: IRCSession, params: string[]) {
  const token = params[0] || SERVER_NAME;
  sendIRC(session, `:${SERVER_NAME} PONG ${SERVER_NAME} :${token}`);
  session.lastPing = Date.now();
}

function handlePONG(session: IRCSession, _params: string[]) {
  session.lastPing = Date.now();
}

function handleQUIT(session: IRCSession, params: string[]) {
  const reason = params.join(" ").replace(/^:/, "") || "Client Quit";
  sendIRC(session, `ERROR :Closing Link: ${session.nick} (${reason})`);
  
  // Clean up channel subscriptions
  for (const channelId of session.channels) {
    const subscribers = channelSubscriptions.get(channelId);
    if (subscribers) {
      subscribers.delete(session.sessionId);
      if (subscribers.size === 0) {
        channelSubscriptions.delete(channelId);
      }
    }
  }
  
  session.ws.close();
}

async function handleIRCCommand(session: IRCSession, line: string) {
  console.log(`[IRC IN] ${line}`);
  
  const parts = line.trim().split(" ");
  if (parts.length === 0) return;

  // Handle prefix (messages from server, ignore for client input)
  let command = parts[0].toUpperCase();
  let params = parts.slice(1);

  if (command.startsWith(":")) {
    command = parts[1]?.toUpperCase() || "";
    params = parts.slice(2);
  }

  switch (command) {
    case "CAP":
      // Capability negotiation - we don't support any special caps
      if (params[0]?.toUpperCase() === "LS") {
        sendIRC(session, `:${SERVER_NAME} CAP * LS :`);
      } else if (params[0]?.toUpperCase() === "END") {
        // Client finished cap negotiation
      }
      break;
    case "PASS":
      await handlePASS(session, params);
      break;
    case "NICK":
      await handleNICK(session, params);
      break;
    case "USER":
      await handleUSER(session, params);
      break;
    case "JOIN":
      await handleJOIN(session, params);
      break;
    case "PART":
      await handlePART(session, params);
      break;
    case "PRIVMSG":
    case "NOTICE":
      await handlePRIVMSG(session, params);
      break;
    case "LIST":
      await handleLIST(session, params);
      break;
    case "WHOIS":
      await handleWHOIS(session, params);
      break;
    case "PING":
      handlePING(session, params);
      break;
    case "PONG":
      handlePONG(session, params);
      break;
    case "QUIT":
      handleQUIT(session, params);
      break;
    case "MODE":
      await handleMODE(session, params);
      break;
    case "KICK":
      await handleKICK(session, params);
      break;
    case "WHO":
      // Stub for WHO command
      if (params.length > 0) {
        sendNumeric(session, RPL.ENDOFWHO, `${params[0]} :End of WHO list`);
      }
      break;
    case "USERHOST":
    case "ISON":
      // Stub commands
      break;
    // ========== EMOJI, ACTIONS, RADIO ==========
    case "EMOJI":
      handleEMOJI(session);
      break;
    case "ACTIONS":
      handleACTIONS(session);
      break;
    case "RADIO":
    case "NP":
    case "NOWPLAYING":
      handleRADIO(session);
      break;
    case "SLAP":
      await handleACTION(session, 'slap', params[0], Array.from(session.channels)[0] || null);
      break;
    case "HUG":
      await handleACTION(session, 'hug', params[0], Array.from(session.channels)[0] || null);
      break;
    case "HIGHFIVE":
      await handleACTION(session, 'highfive', params[0], Array.from(session.channels)[0] || null);
      break;
    case "POKE":
      await handleACTION(session, 'poke', params[0], Array.from(session.channels)[0] || null);
      break;
    case "WAVE":
      await handleACTION(session, 'wave', params[0], Array.from(session.channels)[0] || null);
      break;
    case "DANCE":
      await handleACTION(session, 'dance', params[0], Array.from(session.channels)[0] || null);
      break;
    case "FISTBUMP":
      await handleACTION(session, 'fistbump', params[0], Array.from(session.channels)[0] || null);
      break;
    case "CHEER":
      await handleACTION(session, 'cheer', params[0], Array.from(session.channels)[0] || null);
      break;
    case "WINK":
      await handleACTION(session, 'wink', params[0], Array.from(session.channels)[0] || null);
      break;
    case "APPLAUD":
      await handleACTION(session, 'applaud', params[0], Array.from(session.channels)[0] || null);
      break;
    case "BOW":
      await handleACTION(session, 'bow', params[0], Array.from(session.channels)[0] || null);
      break;
    case "SALUTE":
      await handleACTION(session, 'salute', params[0], Array.from(session.channels)[0] || null);
      break;
    // ========== K-LINE COMMANDS ==========
    case "KLINE":
      await handleKLINE(session, params);
      break;
    case "UNKLINE":
      await handleUNKLINE(session, params);
      break;
    // ========== KILL COMMAND ==========
    case "KILL":
      await handleKILL(session, params);
      break;
    default:
      if (session.registered) {
        sendNumeric(session, ERR.UNKNOWNCOMMAND, `${command} :Unknown command`);
      }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for WebSocket upgrade
  const upgrade = req.headers.get("upgrade");
  if (upgrade?.toLowerCase() !== "websocket") {
    return new Response(JSON.stringify({
      server: SERVER_NAME,
      version: SERVER_VERSION,
      network: NETWORK_NAME,
      connections: sessions.size,
      info: "Connect via WebSocket for IRC protocol access. Use wss://[host]/functions/v1/irc-gateway",
      instructions: [
        "1. Connect with a WebSocket-capable IRC client",
         "2. Send: PASS your-email@example.com:your-password (or your-email@example.com|your-password for mIRC)",
        "3. Send: NICK your-nickname", 
        "4. Send: USER username 0 * :Real Name",
        "5. Use /list to see channels, /join #channel to join"
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Upgrade to WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);
  const sessionId = crypto.randomUUID();

  const session: IRCSession = {
    ws: socket,
    nick: null,
    user: null,
    realname: null,
    registered: false,
    authenticated: false,
    userId: null,
    channels: new Set(),
    lastPing: Date.now(),
    supabase: null,
    sessionId,
  };

  sessions.set(sessionId, session);
  console.log(`New IRC connection: ${sessionId}`);

  socket.onopen = () => {
    sendIRC(session, `:${SERVER_NAME} NOTICE * :*** Looking up your hostname...`);
    sendIRC(session, `:${SERVER_NAME} NOTICE * :*** Found your hostname`);
    sendIRC(session, `:${SERVER_NAME} NOTICE * :*** Please authenticate with PASS email:password (or email|password for mIRC)`);
  };

  socket.onmessage = async (event) => {
    const data = event.data.toString();
    // IRC messages can be multi-line
    const lines = data.split(/\r?\n/).filter((l: string) => l.trim());
    for (const line of lines) {
      await handleIRCCommand(session, line);
    }
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for ${sessionId}:`, error);
  };

  socket.onclose = () => {
    console.log(`IRC connection closed: ${sessionId}`);
    
    // Clean up channel subscriptions on close
    for (const channelId of session.channels) {
      const subscribers = channelSubscriptions.get(channelId);
      if (subscribers) {
        subscribers.delete(sessionId);
        if (subscribers.size === 0) {
          channelSubscriptions.delete(channelId);
        }
      }
    }
    
    sessions.delete(sessionId);
  };

  return response;
});

// ============================================
// Realtime Message Relay Setup
// ============================================
// This sets up a global Supabase client to listen for new messages
// and relay them to connected IRC sessions

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (supabaseUrl && supabaseServiceKey) {
  const realtimeClient = createClient(supabaseUrl, supabaseServiceKey);
  
  // Subscribe to messages table for realtime updates
  realtimeClient
    .channel("irc-message-relay")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        const newMessage = payload.new as {
          id: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };

        console.log(`[Realtime] New message in channel ${newMessage.channel_id}`);

        // Get subscribers for this channel
        const subscribers = channelSubscriptions.get(newMessage.channel_id);
        if (!subscribers || subscribers.size === 0) {
          console.log(`[Realtime] No IRC subscribers for channel ${newMessage.channel_id}`);
          return;
        }

        // Determine sender username - check if it's a bot message
        let senderUsername = "unknown";
        let senderHost = "web";
        
        if (newMessage.user_id.startsWith("bot-")) {
          // Bot message - extract bot name from user_id
          // Format: bot-cryptoking, bot-nightowl88, etc.
          const botNamePart = newMessage.user_id.slice(4); // Remove "bot-" prefix
          
          // Try to find a matching bot name in our channel bots (case-insensitive)
          const allBotNames = Array.from(new Set(Object.values(channelBots).flat()));
          const matchedBot = allBotNames.find(
            (b) => b.toLowerCase().replace(/[^a-z0-9]/g, "") === botNamePart.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          
          senderUsername = matchedBot || botNamePart;
          senderHost = "bot";
          console.log(`[Realtime] Bot message from: ${senderUsername}`);
        } else {
          // Regular user - look up from profiles
          const { data: senderProfile } = await realtimeClient
            .from("profiles")
            .select("username")
            .eq("user_id", newMessage.user_id)
            .single();

          senderUsername = (senderProfile as { username: string } | null)?.username || "unknown";
        }

        // Get channel info and user role for coloring
        const [channelResult, roleResult] = await Promise.all([
          realtimeClient
            .from("channels")
            .select("name")
            .eq("id", newMessage.channel_id)
            .single(),
          !newMessage.user_id.startsWith("bot-") 
            ? realtimeClient
                .from("user_roles")
                .select("role")
                .eq("user_id", newMessage.user_id)
                .maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        const channelName = `#${(channelResult.data as { name: string } | null)?.name || "unknown"}`;
        const userRole = (roleResult.data as { role: string } | null)?.role;

        // Apply mIRC color to sender name based on role
        let coloredSenderName = senderUsername;
        if (userRole === 'owner') {
          coloredSenderName = `${IRC_COLORS.BOLD}${IRC_COLORS.YELLOW}${senderUsername}${IRC_COLORS.RESET}`;
        } else if (userRole === 'admin') {
          coloredSenderName = `${IRC_COLORS.BOLD}${IRC_COLORS.RED}${senderUsername}${IRC_COLORS.RESET}`;
        } else if (userRole === 'moderator') {
          coloredSenderName = `${IRC_COLORS.GREEN}${senderUsername}${IRC_COLORS.RESET}`;
        } else if (senderHost === "bot") {
          coloredSenderName = `${IRC_COLORS.CYAN}${senderUsername}${IRC_COLORS.RESET}`;
        }

        // Relay message to all subscribed IRC sessions (except sender for non-bot messages)
        for (const subscriberId of subscribers) {
          const subscriberSession = sessions.get(subscriberId);
          if (
            subscriberSession &&
            subscriberSession.registered &&
            (newMessage.user_id.startsWith("bot-") || subscriberSession.userId !== newMessage.user_id) // Always relay bot messages, skip echo for own messages
          ) {
            // Send with colored sender name in the message prefix
            sendIRC(
              subscriberSession,
              `:${coloredSenderName}!${senderUsername}@${senderHost}.${SERVER_NAME} PRIVMSG ${channelName} :${newMessage.content}`
            );
            console.log(`[Realtime] Relayed ${senderHost} message from ${senderUsername} to ${subscriberSession.nick}`);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime] Subscription status: ${status}`);
    });

  console.log("[IRC Gateway] Realtime message relay initialized");

  // ============================================
  // Periodic Bot Conversation Starters
  // ============================================
  // Every 60-120 seconds, pick a random channel with IRC users and have a bot start a conversation
  
  const lastBotActivity: Map<string, number> = new Map();
  
  async function startBotConversation() {
    try {
      // Get channels with active IRC subscribers
      const activeChannels = Array.from(channelSubscriptions.entries())
        .filter(([, subs]) => subs.size > 0);
      
      if (activeChannels.length === 0) return;
      
      // Pick a random active channel
      const [channelId, subscribers] = activeChannels[Math.floor(Math.random() * activeChannels.length)];
      
      // Check if we've had recent activity in this channel
      const lastActivity = lastBotActivity.get(channelId) || 0;
      if (Date.now() - lastActivity < 45000) return; // At least 45s between bot messages
      
      // Get channel info
      const { data: channelData } = await realtimeClient
        .from("channels")
        .select("name")
        .eq("id", channelId)
        .single();
      
      const channelName = (channelData as { name: string } | null)?.name;
      if (!channelName) return;
      
      // Check if bots are enabled for this channel
      const { data: botSettings } = await realtimeClient
        .from("bot_settings")
        .select("enabled, allowed_channels")
        .limit(1)
        .single();
      
      const settings = botSettings as { enabled: boolean; allowed_channels: string[] } | null;
      if (!settings?.enabled || !settings.allowed_channels?.includes(channelName)) return;
      
      // Pick a random bot
      const botId = BOT_PERSONALITY_IDS[Math.floor(Math.random() * BOT_PERSONALITY_IDS.length)];
      const visibleBotName = pickVisibleBotNameForChannel(channelName);
      
      console.log(`[Bot Auto] Starting conversation in #${channelName} as ${visibleBotName}`);
      
      // Get recent messages for context
      const recentMessages = recentChannelMessages.get(channelId) || [];
      
      // Call the chat-bot function
      const response = await fetch(`${supabaseUrl}/functions/v1/chat-bot`, {
        method: "POST",
        headers: {
          apikey: supabaseServiceKey!,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId,
          context: channelName,
          recentMessages: recentMessages.slice(-10),
          isConversationStarter: true,
        }),
      });
      
      if (!response.ok) {
        console.error(`[Bot Auto] chat-bot error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      if (!data.message) return;
      
      console.log(`[Bot Auto] ${visibleBotName}: ${data.message}`);
      
      // Insert into database
      const botUserId = `bot-${normalizeNick(visibleBotName) || botId}`;
      
      await realtimeClient
        .from("messages")
        .insert({
          channel_id: channelId,
          user_id: botUserId,
          content: data.message,
        });
      
      lastBotActivity.set(channelId, Date.now());
      
      // Update recent messages cache
      const msgs = recentChannelMessages.get(channelId) || [];
      msgs.push({ username: visibleBotName, content: data.message });
      if (msgs.length > 25) msgs.shift();
      recentChannelMessages.set(channelId, msgs);
      
      // Relay to IRC users with color
      const coloredBotName = `${IRC_COLORS.CYAN}${visibleBotName}${IRC_COLORS.RESET}`;
      for (const subscriberId of subscribers) {
        const subscriberSession = sessions.get(subscriberId);
        if (subscriberSession && subscriberSession.registered) {
          sendIRC(
            subscriberSession,
            `:${coloredBotName}!${visibleBotName}@bot.${SERVER_NAME} PRIVMSG #${channelName} :${data.message}`
          );
        }
      }
    } catch (e) {
      console.error("[Bot Auto] Error:", e);
    }
  }
  
  // Start periodic bot conversations (every 60-120 seconds)
  setInterval(() => {
    // 40% chance each interval to start a conversation
    if (Math.random() < 0.4) {
      startBotConversation();
    }
  }, 60000 + Math.random() * 60000);
  
  console.log("[IRC Gateway] Bot auto-chat initialized");
}
