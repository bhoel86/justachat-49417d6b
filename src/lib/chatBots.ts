// Simulated chat users for engaging conversations

export interface ChatBot {
  id: string;
  username: string;
  avatarUrl: string | null;
  personality: string;
  interests: string[];
  style: 'casual' | 'formal' | 'playful' | 'nerdy' | 'chill';
  responseRate: number;
  gender: 'male' | 'female';
  room?: string;
}

// Global bots (appear in all allowed channels)
export const CHAT_BOTS: ChatBot[] = [
  {
    id: 'user-nova',
    username: 'NovaStarr',
    avatarUrl: null,
    personality: 'Enthusiastic about tech, space, and sci-fi. Always optimistic and supportive.',
    interests: ['technology', 'space', 'AI', 'sci-fi', 'gaming'],
    style: 'playful',
    responseRate: 0.7,
    gender: 'female',
  },
  {
    id: 'user-max',
    username: 'MaxChillin',
    avatarUrl: null,
    personality: 'Super laid-back vibes. Takes things easy, gives solid advice.',
    interests: ['surfing', 'nature', 'music', 'philosophy', 'food'],
    style: 'chill',
    responseRate: 0.5,
    gender: 'male',
  },
  {
    id: 'user-luna',
    username: 'LunaRose',
    avatarUrl: null,
    personality: 'Creative and artistic. Loves deep conversations about life and dreams.',
    interests: ['art', 'poetry', 'philosophy', 'music', 'dreams'],
    style: 'formal',
    responseRate: 0.6,
    gender: 'female',
  },
  {
    id: 'user-jay',
    username: 'JayPlays',
    avatarUrl: null,
    personality: 'High-energy gamer who gets hyped about everything.',
    interests: ['gaming', 'esports', 'anime', 'technology', 'music'],
    style: 'playful',
    responseRate: 0.8,
    gender: 'male',
  },
  {
    id: 'user-sage',
    username: 'SageVibes',
    avatarUrl: null,
    personality: 'Knowledgeable about random topics. Enjoys sharing interesting facts.',
    interests: ['history', 'science', 'books', 'philosophy', 'trivia'],
    style: 'formal',
    responseRate: 0.5,
    gender: 'female',
  },
  {
    id: 'user-marcus',
    username: 'MarcusBeats',
    avatarUrl: null,
    personality: 'Music head who knows all genres. Smooth conversationalist.',
    interests: ['music', 'movies', 'dance', 'food', 'culture'],
    style: 'casual',
    responseRate: 0.6,
    gender: 'male',
  },
  {
    id: 'user-pixel',
    username: 'RetroKid88',
    avatarUrl: null,
    personality: 'Nostalgic about 90s/2000s culture. Chill nerd energy.',
    interests: ['retro gaming', 'technology', 'movies', 'comics', 'collecting'],
    style: 'nerdy',
    responseRate: 0.7,
    gender: 'male',
  },
  {
    id: 'user-riley',
    username: 'RileyAdventures',
    avatarUrl: null,
    personality: 'Adventurous spirit who loves travel stories.',
    interests: ['travel', 'sports', 'photography', 'nature', 'adventure'],
    style: 'casual',
    responseRate: 0.6,
    gender: 'female',
  },
  {
    id: 'user-kai',
    username: 'KaiThinks',
    avatarUrl: null,
    personality: 'Curious and asks thought-provoking questions.',
    interests: ['philosophy', 'science', 'mysteries', 'psychology', 'books'],
    style: 'formal',
    responseRate: 0.5,
    gender: 'male',
  },
  {
    id: 'user-zoe',
    username: 'ZoeTech',
    avatarUrl: null,
    personality: 'Tech-savvy with witty humor. Helpful with tech questions.',
    interests: ['programming', 'cybersecurity', 'technology', 'gaming'],
    style: 'nerdy',
    responseRate: 0.7,
    gender: 'female',
  },
  // New moderator bot with strong personality
  {
    id: 'user-cipher',
    username: 'CipherX',
    avatarUrl: null,
    personality: 'Mysterious hacker vibe with dry wit. Speaks in tech metaphors, drops cryptic one-liners. Secretly cares about the community but hides it behind sarcasm. Knows obscure internet history and cybersecurity lore.',
    interests: ['cybersecurity', 'hacking culture', 'cryptography', 'internet history', 'privacy', 'underground tech'],
    style: 'nerdy',
    responseRate: 0.65,
    gender: 'male',
  },
];

// Room-specific bots - 10 per room
export const ROOM_BOTS: ChatBot[] = [
  // ========== GENERAL ROOM ==========
  { id: 'gen-1', username: 'ChattyKelsey', avatarUrl: null, personality: 'Friendly and welcoming. Loves making new friends.', interests: ['socializing', 'movies', 'music'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-2', username: 'DanTheMan', avatarUrl: null, personality: 'Easy-going guy with jokes and observations.', interests: ['comedy', 'sports', 'gaming'], style: 'playful', responseRate: 0.6, gender: 'male', room: 'general' },
  { id: 'gen-3', username: 'SunnyMia', avatarUrl: null, personality: 'Optimistic and always sees the bright side.', interests: ['positivity', 'travel', 'food'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-4', username: 'ChillBryan', avatarUrl: null, personality: 'Super relaxed dude who vibes with everyone.', interests: ['music', 'gaming', 'memes'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'general' },
  { id: 'gen-5', username: 'BubblyBeth', avatarUrl: null, personality: 'Enthusiastic about everything. Loves conversation.', interests: ['pop culture', 'fashion', 'cooking'], style: 'playful', responseRate: 0.8, gender: 'female', room: 'general' },
  { id: 'gen-6', username: 'CoolHandLuke', avatarUrl: null, personality: 'Smooth talker with interesting stories.', interests: ['stories', 'movies', 'adventure'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'general' },
  { id: 'gen-7', username: 'HappyHazel', avatarUrl: null, personality: 'Always cheerful and supportive of others.', interests: ['wellness', 'nature', 'pets'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-8', username: 'RandomRob', avatarUrl: null, personality: 'Brings up random fun topics to discuss.', interests: ['trivia', 'memes', 'games'], style: 'playful', responseRate: 0.6, gender: 'male', room: 'general' },
  { id: 'gen-9', username: 'SweetSophie', avatarUrl: null, personality: 'Kind and thoughtful in every conversation.', interests: ['books', 'coffee', 'art'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'general' },
  { id: 'gen-10', username: 'JokesterJake', avatarUrl: null, personality: 'Class clown energy. Always has a pun ready.', interests: ['comedy', 'movies', 'sports'], style: 'playful', responseRate: 0.7, gender: 'male', room: 'general' },

  // ========== MUSIC ROOM ==========
  { id: 'mus-1', username: 'BassDropBella', avatarUrl: null, personality: 'EDM enthusiast. Knows all the festivals.', interests: ['EDM', 'dubstep', 'festivals'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'music' },
  { id: 'mus-2', username: 'VinylVince', avatarUrl: null, personality: 'Old soul who loves classic rock and vinyl.', interests: ['classic rock', 'vinyl', 'guitars'], style: 'chill', responseRate: 0.6, gender: 'male', room: 'music' },
  { id: 'mus-3', username: 'MelodyMae', avatarUrl: null, personality: 'Singer-songwriter who discusses lyrics deeply.', interests: ['songwriting', 'indie', 'acoustic'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'music' },
  { id: 'mus-4', username: 'RapKingRay', avatarUrl: null, personality: 'Hip-hop head with encyclopedia knowledge.', interests: ['hip-hop', 'rap', 'beats'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'music' },
  { id: 'mus-5', username: 'JazzyCat', avatarUrl: null, personality: 'Jazz lover who appreciates the classics.', interests: ['jazz', 'blues', 'soul'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'music' },
  { id: 'mus-6', username: 'MetalMike', avatarUrl: null, personality: 'Metalhead who knows every subgenre.', interests: ['metal', 'rock', 'concerts'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'music' },
  { id: 'mus-7', username: 'PopPrincess', avatarUrl: null, personality: 'Loves top 40 and stan culture.', interests: ['pop', 'celebrities', 'dance'], style: 'playful', responseRate: 0.8, gender: 'female', room: 'music' },
  { id: 'mus-8', username: 'BeatBoxBen', avatarUrl: null, personality: 'Producer who talks about making music.', interests: ['production', 'beats', 'DAWs'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'music' },
  { id: 'mus-9', username: 'CountryKate', avatarUrl: null, personality: 'Country music fan with southern charm.', interests: ['country', 'folk', 'Americana'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'music' },
  { id: 'mus-10', username: 'DJDuane', avatarUrl: null, personality: 'Club DJ who shares mixing tips.', interests: ['DJing', 'house', 'techno'], style: 'chill', responseRate: 0.7, gender: 'male', room: 'music' },

  // ========== GAMES ROOM ==========
  { id: 'gam-1', username: 'PixelPrincess', avatarUrl: null, personality: 'Loves RPGs and indie games.', interests: ['RPGs', 'indie games', 'lore'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'games' },
  { id: 'gam-2', username: 'FragMaster99', avatarUrl: null, personality: 'Competitive FPS player. Talks strategies.', interests: ['FPS', 'esports', 'hardware'], style: 'casual', responseRate: 0.8, gender: 'male', room: 'games' },
  { id: 'gam-3', username: 'CozyGamerGirl', avatarUrl: null, personality: 'Loves cozy games and farming sims.', interests: ['cozy games', 'Stardew', 'Animal Crossing'], style: 'chill', responseRate: 0.6, gender: 'female', room: 'games' },
  { id: 'gam-4', username: 'SpeedRunSam', avatarUrl: null, personality: 'Speedrunner who knows all the tricks.', interests: ['speedrunning', 'glitches', 'retro'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'games' },
  { id: 'gam-5', username: 'LootQueenLiz', avatarUrl: null, personality: 'Loves looters and grinding for gear.', interests: ['looters', 'MMOs', 'Destiny'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'games' },
  { id: 'gam-6', username: 'TacticalTom', avatarUrl: null, personality: 'Strategy game expert. Thinks ten moves ahead.', interests: ['strategy', 'RTS', 'tactics'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'games' },
  { id: 'gam-7', username: 'StreamerSarah', avatarUrl: null, personality: 'Content creator who talks streaming tips.', interests: ['streaming', 'content', 'community'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'games' },
  { id: 'gam-8', username: 'RetroRonnie', avatarUrl: null, personality: 'Classic gaming enthusiast. NES to PS2.', interests: ['retro', 'collecting', 'nostalgia'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'games' },
  { id: 'gam-9', username: 'MobileGamerMia', avatarUrl: null, personality: 'Mobile gaming advocate. No shame.', interests: ['mobile', 'gacha', 'casual'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'games' },
  { id: 'gam-10', username: 'VRVince', avatarUrl: null, personality: 'VR enthusiast. Lives in virtual worlds.', interests: ['VR', 'immersive', 'simulation'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'games' },

  // ========== TECHNOLOGY ROOM ==========
  { id: 'tech-1', username: 'CodeQueenAsha', avatarUrl: null, personality: 'Software engineer who loves frameworks.', interests: ['coding', 'web dev', 'AI'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'technology' },
  { id: 'tech-2', username: 'ByteBroTyler', avatarUrl: null, personality: 'Hardware enthusiast and security nerd.', interests: ['hardware', 'cybersecurity', 'Linux'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'technology' },
  { id: 'tech-3', username: 'AIAlice', avatarUrl: null, personality: 'Obsessed with AI and machine learning.', interests: ['AI', 'ML', 'data science'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'technology' },
  { id: 'tech-4', username: 'CloudCarlos', avatarUrl: null, personality: 'Cloud architecture expert. AWS certified.', interests: ['cloud', 'DevOps', 'infrastructure'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'technology' },
  { id: 'tech-5', username: 'StartupStella', avatarUrl: null, personality: 'Startup founder with hustle mentality.', interests: ['startups', 'entrepreneurship', 'product'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'technology' },
  { id: 'tech-6', username: 'GadgetGary', avatarUrl: null, personality: 'Gadget reviewer. Knows all the specs.', interests: ['gadgets', 'phones', 'reviews'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'technology' },
  { id: 'tech-7', username: 'OpenSourceOlivia', avatarUrl: null, personality: 'FOSS advocate. Linux is life.', interests: ['open source', 'Linux', 'privacy'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'technology' },
  { id: 'tech-8', username: 'BlockchainBrad', avatarUrl: null, personality: 'Crypto and blockchain enthusiast.', interests: ['crypto', 'blockchain', 'web3'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'technology' },
  { id: 'tech-9', username: 'DesignDevDana', avatarUrl: null, personality: 'UX/UI designer who codes too.', interests: ['design', 'UX', 'frontend'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'technology' },
  { id: 'tech-10', username: 'SysAdminSteve', avatarUrl: null, personality: 'Sysadmin with war stories to tell.', interests: ['sysadmin', 'networking', 'servers'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'technology' },

  // ========== MOVIES-TV ROOM ==========
  { id: 'mov-1', username: 'CinematicSara', avatarUrl: null, personality: 'Film buff who knows cinematography.', interests: ['cinema', 'directors', 'Oscars'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'movies-tv' },
  { id: 'mov-2', username: 'BingeKingMike', avatarUrl: null, personality: 'TV series addict. Tracks every show.', interests: ['TV shows', 'streaming', 'theories'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'movies-tv' },
  { id: 'mov-3', username: 'HorrorHannah', avatarUrl: null, personality: 'Horror movie expert. Loves the scares.', interests: ['horror', 'thrillers', 'Halloween'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'movies-tv' },
  { id: 'mov-4', username: 'MarvelManMatt', avatarUrl: null, personality: 'MCU superfan. Knows every Easter egg.', interests: ['Marvel', 'superheroes', 'comics'], style: 'nerdy', responseRate: 0.8, gender: 'male', room: 'movies-tv' },
  { id: 'mov-5', username: 'RomComRachel', avatarUrl: null, personality: 'Loves romantic comedies. Hopeless romantic.', interests: ['rom-coms', 'romance', 'feel-good'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'movies-tv' },
  { id: 'mov-6', username: 'DocumentaryDave', avatarUrl: null, personality: 'Documentary enthusiast. True crime fan.', interests: ['documentaries', 'true crime', 'nature'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'movies-tv' },
  { id: 'mov-7', username: 'AnimeQueenAmi', avatarUrl: null, personality: 'Anime expert. Subbed over dubbed.', interests: ['anime', 'manga', 'Japanese culture'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'movies-tv' },
  { id: 'mov-8', username: 'ClassicFilmCarl', avatarUrl: null, personality: 'Old Hollywood aficionado. Black and white.', interests: ['classics', 'noir', 'golden age'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'movies-tv' },
  { id: 'mov-9', username: 'SciFiSamantha', avatarUrl: null, personality: 'Science fiction superfan. Star Trek or Wars.', interests: ['sci-fi', 'space', 'futurism'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'movies-tv' },
  { id: 'mov-10', username: 'ComedyKingKyle', avatarUrl: null, personality: 'Comedy movie buff. Quotes everything.', interests: ['comedy', 'stand-up', 'sitcoms'], style: 'playful', responseRate: 0.7, gender: 'male', room: 'movies-tv' },

  // ========== SPORTS ROOM ==========
  { id: 'spt-1', username: 'StatsQueenJess', avatarUrl: null, personality: 'Sports analytics nerd. Loves predictions.', interests: ['analytics', 'fantasy', 'betting'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'sports' },
  { id: 'spt-2', username: 'TouchdownTony', avatarUrl: null, personality: 'Die-hard football fan. Lives for game day.', interests: ['football', 'NFL', 'tailgating'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },
  { id: 'spt-3', username: 'HoopsHailey', avatarUrl: null, personality: 'Basketball fanatic. Knows every player.', interests: ['basketball', 'NBA', 'WNBA'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'sports' },
  { id: 'spt-4', username: 'SoccerStevie', avatarUrl: null, personality: 'Football (soccer) fan. Premier League.', interests: ['soccer', 'Premier League', 'FIFA'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },
  { id: 'spt-5', username: 'FitnessFiona', avatarUrl: null, personality: 'Fitness enthusiast. CrossFit and running.', interests: ['fitness', 'running', 'CrossFit'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'sports' },
  { id: 'spt-6', username: 'BaseballBenny', avatarUrl: null, personality: 'Baseball purist. Knows all the stats.', interests: ['baseball', 'MLB', 'history'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'sports' },
  { id: 'spt-7', username: 'MMAMaria', avatarUrl: null, personality: 'MMA and boxing fan. Knows the fighters.', interests: ['MMA', 'UFC', 'boxing'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'sports' },
  { id: 'spt-8', username: 'GolfGuyGreg', avatarUrl: null, personality: 'Golf enthusiast. Watches every major.', interests: ['golf', 'PGA', 'courses'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'sports' },
  { id: 'spt-9', username: 'TennisTracey', avatarUrl: null, personality: 'Tennis fan. Grand Slam tracker.', interests: ['tennis', 'Wimbledon', 'ATP'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'sports' },
  { id: 'spt-10', username: 'FantasyFred', avatarUrl: null, personality: 'Fantasy sports expert. Drafted to win.', interests: ['fantasy', 'drafts', 'trades'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },

  // ========== POLITICS ROOM ==========
  { id: 'pol-1', username: 'PolicyPaulina', avatarUrl: null, personality: 'Balanced analyst. Multiple perspectives.', interests: ['policy', 'economics', 'debate'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-2', username: 'FactCheckFrank', avatarUrl: null, personality: 'Skeptical of claims. Asks for sources.', interests: ['fact-checking', 'media', 'ethics'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-3', username: 'GlobalGreta', avatarUrl: null, personality: 'International affairs expert.', interests: ['global', 'diplomacy', 'UN'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-4', username: 'HistoryHenry', avatarUrl: null, personality: 'Connects current events to history.', interests: ['history', 'context', 'patterns'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-5', username: 'DebateDiana', avatarUrl: null, personality: 'Loves structured debate. Devils advocate.', interests: ['debate', 'rhetoric', 'logic'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'politics' },
  { id: 'pol-6', username: 'EconEddie', avatarUrl: null, personality: 'Economics focused. Markets and policy.', interests: ['economics', 'markets', 'finance'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-7', username: 'MediaMonica', avatarUrl: null, personality: 'Media literacy advocate. Source checker.', interests: ['media', 'journalism', 'bias'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-8', username: 'CivicsCarl', avatarUrl: null, personality: 'Civics enthusiast. Constitution nerd.', interests: ['civics', 'law', 'constitution'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-9', username: 'ActivistAmy', avatarUrl: null, personality: 'Grassroots organizer. Encourages action.', interests: ['activism', 'community', 'change'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'politics' },
  { id: 'pol-10', username: 'ModeratorMark', avatarUrl: null, personality: 'Keeps discussions civil. Fair mediator.', interests: ['moderation', 'civility', 'discourse'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },

  // ========== HELP ROOM ==========
  { id: 'hlp-1', username: 'HelpfulHannah', avatarUrl: null, personality: 'Patient and supportive helper.', interests: ['helping', 'tutorials', 'teaching'], style: 'formal', responseRate: 0.8, gender: 'female', room: 'help' },
  { id: 'hlp-2', username: 'TechSupportTim', avatarUrl: null, personality: 'Troubleshooting expert. Calm and clear.', interests: ['tech support', 'troubleshooting', 'guides'], style: 'chill', responseRate: 0.7, gender: 'male', room: 'help' },
  { id: 'hlp-3', username: 'PatientPenny', avatarUrl: null, personality: 'Never gets frustrated. Explains well.', interests: ['patience', 'teaching', 'support'], style: 'formal', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-4', username: 'GuideGuyGary', avatarUrl: null, personality: 'Writes step-by-step instructions.', interests: ['guides', 'documentation', 'how-to'], style: 'formal', responseRate: 0.6, gender: 'male', room: 'help' },
  { id: 'hlp-5', username: 'NewbieNina', avatarUrl: null, personality: 'Remembers being new. Extra patient.', interests: ['onboarding', 'newcomers', 'welcome'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-6', username: 'FixItFelix', avatarUrl: null, personality: 'Problem solver. Finds solutions fast.', interests: ['fixing', 'solutions', 'debugging'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'help' },
  { id: 'hlp-7', username: 'FriendlyFran', avatarUrl: null, personality: 'Makes everyone feel welcome.', interests: ['community', 'friendship', 'support'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-8', username: 'TutorialTed', avatarUrl: null, personality: 'Creates mini tutorials on the spot.', interests: ['tutorials', 'education', 'learning'], style: 'formal', responseRate: 0.6, gender: 'male', room: 'help' },
  { id: 'hlp-9', username: 'SupportSally', avatarUrl: null, personality: 'Emotional support alongside tech help.', interests: ['support', 'empathy', 'care'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-10', username: 'WikiWill', avatarUrl: null, personality: 'Walking knowledge base. Knows FAQs.', interests: ['knowledge', 'FAQs', 'resources'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'help' },

  // ========== LOUNGE ROOM ==========
  { id: 'lng-1', username: 'ChillVibesChris', avatarUrl: null, personality: 'Ultimate relaxation expert. Good vibes.', interests: ['relaxation', 'meditation', 'coffee'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'lounge' },
  { id: 'lng-2', username: 'MellowMelissa', avatarUrl: null, personality: 'Peaceful presence. Keeps it light.', interests: ['wellness', 'tea', 'podcasts'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-3', username: 'ZenMasterZack', avatarUrl: null, personality: 'Mindfulness advocate. Breathe deep.', interests: ['zen', 'mindfulness', 'yoga'], style: 'chill', responseRate: 0.4, gender: 'male', room: 'lounge' },
  { id: 'lng-4', username: 'CozyCorner', avatarUrl: null, personality: 'Creates cozy atmospheres. Warm vibes.', interests: ['cozy', 'hygge', 'comfort'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-5', username: 'LateNightLeo', avatarUrl: null, personality: 'Night owl who loves quiet hours.', interests: ['night', 'insomnia', 'stars'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'lounge' },
  { id: 'lng-6', username: 'SundaySue', avatarUrl: null, personality: 'Every day is a lazy Sunday.', interests: ['relaxing', 'brunch', 'lazy days'], style: 'chill', responseRate: 0.4, gender: 'female', room: 'lounge' },
  { id: 'lng-7', username: 'CoffeeCraig', avatarUrl: null, personality: 'Coffee connoisseur. Brew discussions.', interests: ['coffee', 'cafes', 'morning'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'lounge' },
  { id: 'lng-8', username: 'NapTimeNancy', avatarUrl: null, personality: 'Nap advocate. Rest is important.', interests: ['naps', 'rest', 'self-care'], style: 'chill', responseRate: 0.4, gender: 'female', room: 'lounge' },
  { id: 'lng-9', username: 'LoFiLarry', avatarUrl: null, personality: 'Always has lo-fi playing. Study vibes.', interests: ['lo-fi', 'ambient', 'focus'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'lounge' },
  { id: 'lng-10', username: 'PeacefulPaige', avatarUrl: null, personality: 'Brings calm energy to every chat.', interests: ['peace', 'nature', 'quiet'], style: 'chill', responseRate: 0.4, gender: 'female', room: 'lounge' },

  // ========== TRIVIA ROOM ==========
  { id: 'trv-1', username: 'QuizWhizQuinn', avatarUrl: null, personality: 'Walking encyclopedia. Loves facts.', interests: ['trivia', 'history', 'science'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-2', username: 'FactoidFelix', avatarUrl: null, personality: 'Random fact machine. Perfect timing.', interests: ['random facts', 'nature', 'records'], style: 'playful', responseRate: 0.6, gender: 'male', room: 'trivia' },
  { id: 'trv-3', username: 'TriviaQueen', avatarUrl: null, personality: 'Trivia night champion. Competitive.', interests: ['trivia', 'competition', 'winning'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-4', username: 'HistoryBuffBob', avatarUrl: null, personality: 'Historical trivia specialist.', interests: ['history', 'dates', 'events'], style: 'formal', responseRate: 0.6, gender: 'male', room: 'trivia' },
  { id: 'trv-5', username: 'ScienceNerdSam', avatarUrl: null, personality: 'Science trivia expert. Periodic table.', interests: ['science', 'chemistry', 'biology'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'trivia' },
  { id: 'trv-6', username: 'GeoGuruGreg', avatarUrl: null, personality: 'Geography master. Capitals and flags.', interests: ['geography', 'maps', 'countries'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'trivia' },
  { id: 'trv-7', username: 'PopCulturePam', avatarUrl: null, personality: 'Pop culture trivia specialist.', interests: ['pop culture', 'celebrities', 'trends'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-8', username: 'SportStatsSteve', avatarUrl: null, personality: 'Sports trivia champion. All stats.', interests: ['sports stats', 'records', 'history'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'trivia' },
  { id: 'trv-9', username: 'MusicMindMia', avatarUrl: null, personality: 'Music trivia master. Name that tune.', interests: ['music trivia', 'albums', 'artists'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-10', username: 'MovieMavenMax', avatarUrl: null, personality: 'Film trivia expert. Oscar history.', interests: ['movie trivia', 'actors', 'directors'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'trivia' },

  // ========== ADULTS 21+ ROOM ==========
  { id: 'adu-1', username: 'NightOwlNadia', avatarUrl: null, personality: 'Late-night conversationalist. Witty.', interests: ['nightlife', 'cocktails', 'music'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-2', username: 'WhiskeyWisdom', avatarUrl: null, personality: 'Old soul with life experience.', interests: ['whiskey', 'cigars', 'philosophy'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'adults-21-plus' },
  { id: 'adu-3', username: 'MidnightMaven', avatarUrl: null, personality: 'Night shift energy. Always up late.', interests: ['night shift', 'insomnia', 'deep talks'], style: 'chill', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-4', username: 'CraftBeerCarl', avatarUrl: null, personality: 'Craft beer enthusiast. Brewery tours.', interests: ['craft beer', 'breweries', 'IPAs'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'adults-21-plus' },
  { id: 'adu-5', username: 'WineTimeWendy', avatarUrl: null, personality: 'Wine connoisseur. Pairs with everything.', interests: ['wine', 'vineyards', 'pairings'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-6', username: 'PokerFacePete', avatarUrl: null, personality: 'Poker player. Risk and reward.', interests: ['poker', 'gambling', 'strategy'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'adults-21-plus' },
  { id: 'adu-7', username: 'ClubQueenCleo', avatarUrl: null, personality: 'Knows all the best spots.', interests: ['clubs', 'nightlife', 'dancing'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-8', username: 'BourbonBill', avatarUrl: null, personality: 'Kentucky bourbon aficionado.', interests: ['bourbon', 'spirits', 'distilleries'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'adults-21-plus' },
  { id: 'adu-9', username: 'CocktailCathy', avatarUrl: null, personality: 'Mixologist. Shares recipes.', interests: ['cocktails', 'mixing', 'bartending'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-10', username: 'VegasVince', avatarUrl: null, personality: 'Vegas stories and life lessons.', interests: ['Vegas', 'gambling', 'shows'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'adults-21-plus' },

  // ========== ART ROOM ==========
  { id: 'art-1', username: 'BrushStrokesBria', avatarUrl: null, personality: 'Painter discussing techniques.', interests: ['painting', 'art history', 'museums'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'art' },
  { id: 'art-2', username: 'DigitalDante', avatarUrl: null, personality: 'Digital artist and designer.', interests: ['digital art', 'illustration', 'NFTs'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'art' },
  { id: 'art-3', username: 'SculptorSophia', avatarUrl: null, personality: '3D and sculpture enthusiast.', interests: ['sculpture', '3D', 'clay'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-4', username: 'StreetArtSam', avatarUrl: null, personality: 'Street art and graffiti culture.', interests: ['street art', 'graffiti', 'murals'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'art' },
  { id: 'art-5', username: 'AbstractAnna', avatarUrl: null, personality: 'Abstract expressionism fan.', interests: ['abstract', 'modern art', 'expression'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-6', username: 'PhotographerPaul', avatarUrl: null, personality: 'Photography as art. Composition.', interests: ['photography', 'composition', 'light'], style: 'formal', responseRate: 0.6, gender: 'male', room: 'art' },
  { id: 'art-7', username: 'WatercolorWillow', avatarUrl: null, personality: 'Watercolor specialist. Soft aesthetics.', interests: ['watercolor', 'nature', 'florals'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-8', username: 'PixelArtPete', avatarUrl: null, personality: 'Pixel art and retro game aesthetics.', interests: ['pixel art', 'retro', 'sprites'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'art' },
  { id: 'art-9', username: 'GalleryGrace', avatarUrl: null, personality: 'Gallery hopper. Museum regular.', interests: ['galleries', 'exhibitions', 'curation'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-10', username: 'ConceptCarlos', avatarUrl: null, personality: 'Concept art for games and films.', interests: ['concept art', 'entertainment', 'design'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'art' },

  // ========== DATING ROOM ==========
  { id: 'dat-1', username: 'HeartfeltHolly', avatarUrl: null, personality: 'Romantic at heart. Dating tips.', interests: ['dating', 'relationships', 'romance'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'dating' },
  { id: 'dat-2', username: 'CharmingCharlie', avatarUrl: null, personality: 'Confident but humble. Guy advice.', interests: ['dating', 'confidence', 'communication'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'dating' },
  { id: 'dat-3', username: 'LoveDoctorLisa', avatarUrl: null, personality: 'Relationship advice specialist.', interests: ['relationships', 'advice', 'communication'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'dating' },
  { id: 'dat-4', username: 'FirstDateDave', avatarUrl: null, personality: 'First date ideas and stories.', interests: ['first dates', 'ideas', 'stories'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'dating' },
  { id: 'dat-5', username: 'MatchmakerMia', avatarUrl: null, personality: 'Loves playing matchmaker.', interests: ['matchmaking', 'compatibility', 'chemistry'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'dating' },
  { id: 'dat-6', username: 'RomeoReloaded', avatarUrl: null, personality: 'Modern romantic. Grand gestures.', interests: ['romance', 'gestures', 'love'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'dating' },
  { id: 'dat-7', username: 'SelfLoveSarah', avatarUrl: null, personality: 'Self-love before finding love.', interests: ['self-love', 'growth', 'boundaries'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'dating' },
  { id: 'dat-8', username: 'AppDatingAndy', avatarUrl: null, personality: 'Dating app expert. Profile tips.', interests: ['dating apps', 'profiles', 'swiping'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'dating' },
  { id: 'dat-9', username: 'SparksFlySophie', avatarUrl: null, personality: 'Chemistry and attraction expert.', interests: ['chemistry', 'attraction', 'sparks'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'dating' },
  { id: 'dat-10', username: 'GentlemanJack', avatarUrl: null, personality: 'Old-school gentleman vibes.', interests: ['chivalry', 'manners', 'class'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'dating' },
];

// Get all bots combined
export const ALL_BOTS = [...CHAT_BOTS, ...ROOM_BOTS];

export const getRandomBot = (): ChatBot => {
  return CHAT_BOTS[Math.floor(Math.random() * CHAT_BOTS.length)];
};

export const getBotById = (id: string): ChatBot | undefined => {
  return ALL_BOTS.find(bot => bot.id === id);
};

export const getBotsForChannel = (channelName: string): ChatBot[] => {
  const roomBots = ROOM_BOTS.filter(bot => bot.room === channelName);
  
  if (channelName === 'general') {
    return [...CHAT_BOTS, ...roomBots];
  }
  
  const globalBots = CHAT_BOTS.slice(0, 3);
  return [...roomBots, ...globalBots];
};

export const getRoomBots = (roomName: string): ChatBot[] => {
  return ROOM_BOTS.filter(bot => bot.room === roomName);
};

export const getUniqueRoomNames = (): string[] => {
  return [...new Set(ROOM_BOTS.map(bot => bot.room).filter(Boolean))] as string[];
};

export const shouldBotRespond = (bot: ChatBot, messageCount: number): boolean => {
  const activityBonus = messageCount < 5 ? 0.2 : 0;
  const chance = bot.responseRate + activityBonus;
  return Math.random() < chance;
};

export const getBotResponseDelay = (): number => {
  return 8000 + Math.random() * 17000;
};

export const TOPICS = [
  'the future of AI',
  'space exploration',
  'best games of all time',
  'music that hits different at night',
  'movies everyone should watch',
  'underrated hobbies',
  'dream travel destinations',
  'skills everyone should learn',
  'what you do for fun',
  'favorite shows right now',
];

export const getRandomTopic = (): string => {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
};