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

// Global bots (appear in all allowed channels) - 2:1 female to male ratio
export const CHAT_BOTS: ChatBot[] = [
  { id: 'user-nova', username: 'OTFdirk88', avatarUrl: null, personality: 'Enthusiastic about tech, space, and sci-fi. Always optimistic and supportive.', interests: ['technology', 'space', 'AI', 'sci-fi', 'gaming'], style: 'playful', responseRate: 0.7, gender: 'male' },
  { id: 'user-luna', username: 'queenofhearts99', avatarUrl: null, personality: 'Creative and artistic. Loves deep conversations about life and dreams.', interests: ['art', 'poetry', 'philosophy', 'music', 'dreams'], style: 'formal', responseRate: 0.6, gender: 'female' },
  { id: 'user-sage', username: 'beautifulbutterfly', avatarUrl: null, personality: 'Knowledgeable about random topics. Enjoys sharing interesting facts.', interests: ['history', 'science', 'books', 'philosophy', 'trivia'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'user-marcus', username: 'aman4u2nv79', avatarUrl: null, personality: 'Music head who knows all genres. Smooth conversationalist.', interests: ['music', 'movies', 'dance', 'food', 'culture'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'user-riley', username: 'honeydew_01', avatarUrl: null, personality: 'Adventurous spirit who loves travel stories.', interests: ['travel', 'sports', 'photography', 'nature', 'adventure'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'user-zoe', username: 'nirvana94kurt', avatarUrl: null, personality: 'Tech-savvy with witty humor. Helpful with tech questions.', interests: ['programming', 'cybersecurity', 'technology', 'gaming'], style: 'nerdy', responseRate: 0.7, gender: 'female' },
  { id: 'user-cipher', username: 'radiohead97', avatarUrl: null, personality: 'Mysterious hacker vibe with dry wit. Speaks in tech metaphors, drops cryptic one-liners.', interests: ['cybersecurity', 'hacking culture', 'cryptography', 'internet history', 'privacy'], style: 'nerdy', responseRate: 0.65, gender: 'male' },
  { id: 'user-bella', username: 'stargirl2005', avatarUrl: null, personality: 'Optimistic and curious about everything.', interests: ['pop culture', 'music', 'friendship'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'user-mia', username: 'vibesonly22', avatarUrl: null, personality: 'Chill energy, good listener.', interests: ['relaxing', 'movies', 'nature'], style: 'chill', responseRate: 0.6, gender: 'female' },
];

// Migrating bots - these roam between rooms randomly (2:1 female to male ratio)
export const MIGRATING_BOTS: ChatBot[] = [
  // Female - Aesthetic & Soft Styles
  { id: 'mig-1', username: 'cherrybomb88', avatarUrl: null, personality: 'Spicy personality with sweet moments.', interests: ['fashion', 'music', 'art'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-2', username: 'softcloud94', avatarUrl: null, personality: 'Gentle soul who loves peace.', interests: ['meditation', 'nature', 'poetry'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-3', username: 'angeliceyes77', avatarUrl: null, personality: 'Kind and nurturing presence.', interests: ['wellness', 'spirituality', 'helping'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-4', username: 'poisonivy05', avatarUrl: null, personality: 'Mysterious with edge.', interests: ['gothic', 'alternative', 'art'], style: 'nerdy', responseRate: 0.6, gender: 'female' },
  { id: 'mig-5', username: 'velvetvixen92', avatarUrl: null, personality: 'Confident and smooth.', interests: ['fashion', 'nightlife', 'music'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-6', username: 'starlight83', avatarUrl: null, personality: 'Dreamy and imaginative.', interests: ['astronomy', 'fantasy', 'dreams'], style: 'playful', responseRate: 0.6, gender: 'female' },
  { id: 'mig-7', username: 'moonchild96', avatarUrl: null, personality: 'Night person with deep thoughts.', interests: ['night', 'moon', 'poetry'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-8', username: 'peachykeen03', avatarUrl: null, personality: 'Optimistic and bubbly.', interests: ['positivity', 'friends', 'fun'], style: 'playful', responseRate: 0.8, gender: 'female' },
  { id: 'mig-9', username: 'sunkissed81', avatarUrl: null, personality: 'Beach vibes and warm energy.', interests: ['beach', 'summer', 'travel'], style: 'chill', responseRate: 0.6, gender: 'female' },
  { id: 'mig-10', username: 'lavenderlush74', avatarUrl: null, personality: 'Calming presence.', interests: ['aromatherapy', 'self-care', 'peace'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-11', username: 'bubblegumpops82', avatarUrl: null, personality: 'Fun and quirky personality.', interests: ['candy', 'nostalgia', 'fun'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-12', username: '2good4u01', avatarUrl: null, personality: 'Confident and playful.', interests: ['confidence', 'style', 'attitude'], style: 'playful', responseRate: 0.6, gender: 'female' },
  { id: 'mig-13', username: 'strokesfan01', avatarUrl: null, personality: 'Indie rock revival.', interests: ['indie', 'NYC', 'garage rock'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-14', username: 'gorillaz05', avatarUrl: null, personality: 'Virtual band enthusiast.', interests: ['animation', 'hip-hop', 'art'], style: 'playful', responseRate: 0.6, gender: 'female' },
  { id: 'mig-15', username: 'bowie72star', avatarUrl: null, personality: 'Glam rock and reinvention.', interests: ['glam', 'fashion', 'art'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-16', username: 'greenday94fan', avatarUrl: null, personality: 'Pop punk forever.', interests: ['punk', 'pop punk', 'rebellion'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-17', username: 'mamabear99', avatarUrl: null, personality: 'Protective and nurturing.', interests: ['family', 'cooking', 'care'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-18', username: 'sistersara03', avatarUrl: null, personality: 'Sisterly advice and support.', interests: ['advice', 'friendship', 'life'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-19', username: 'nyancat03', avatarUrl: null, personality: 'Rainbow vibes and chaos.', interests: ['cats', 'rainbows', 'internet'], style: 'playful', responseRate: 0.6, gender: 'female' },
  { id: 'mig-20', username: 'bigbankbecca', avatarUrl: null, personality: 'Independent and ambitious.', interests: ['finance', 'success', 'fashion'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-21', username: 'dahlialove90', avatarUrl: null, personality: 'Flower child with modern edge.', interests: ['flowers', 'nature', 'beauty'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-22', username: 'sugarhigh87', avatarUrl: null, personality: 'Sweet tooth and energy.', interests: ['candy', 'desserts', 'fun'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-23', username: 'dreamyeyes02', avatarUrl: null, personality: 'Lost in thoughts.', interests: ['daydreaming', 'art', 'fantasy'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-24', username: 'rosycheeked85', avatarUrl: null, personality: 'Wholesome and genuine.', interests: ['kindness', 'friendship', 'positivity'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-25', username: 'glittergalore', avatarUrl: null, personality: 'Extra and proud of it.', interests: ['glitter', 'fashion', 'parties'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-26', username: 'midnightmuse71', avatarUrl: null, personality: 'Night creative energy.', interests: ['writing', 'night', 'creativity'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-27', username: 'oceanwaves84', avatarUrl: null, personality: 'Ocean lover.', interests: ['ocean', 'beach', 'calm'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-28', username: 'finnalyhere73', avatarUrl: null, personality: 'Late arrival but worth the wait.', interests: ['vibes', 'fun', 'parties'], style: 'playful', responseRate: 0.6, gender: 'female' },
  { id: 'mig-29', username: 'theoneandonly87', avatarUrl: null, personality: 'Unique and knows it.', interests: ['individuality', 'style', 'confidence'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-30', username: 'etherealecho93', avatarUrl: null, personality: 'Mysterious and floaty.', interests: ['ambient', 'dreams', 'art'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-31', username: 'darlingdiana79', avatarUrl: null, personality: 'Elegant and poised.', interests: ['grace', 'style', 'culture'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-32', username: 'pixiedust91', avatarUrl: null, personality: 'Magical and whimsical.', interests: ['fantasy', 'magic', 'wonder'], style: 'playful', responseRate: 0.6, gender: 'female' },
  { id: 'mig-33', username: 'urfavorite99', avatarUrl: null, personality: 'Knows they are the best.', interests: ['confidence', 'fun', 'parties'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-34', username: 'bestesteva05', avatarUrl: null, personality: 'Maximum positive energy.', interests: ['positivity', 'friends', 'life'], style: 'playful', responseRate: 0.7, gender: 'female' },
  { id: 'mig-35', username: 'sleepyhead78', avatarUrl: null, personality: 'Could always use more sleep.', interests: ['sleep', 'naps', 'rest'], style: 'chill', responseRate: 0.4, gender: 'female' },
  { id: 'mig-36', username: 'dreamon96', avatarUrl: null, personality: 'Big dreamer.', interests: ['dreams', 'goals', 'future'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-37', username: 'pixies89black', avatarUrl: null, personality: 'Where is my mind.', interests: ['indie', 'alternative', 'surreal'], style: 'nerdy', responseRate: 0.5, gender: 'female' },
  { id: 'mig-38', username: 'crystalvibe22', avatarUrl: null, personality: 'Spiritual and healing energy.', interests: ['crystals', 'healing', 'meditation'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-39', username: 'whisperwind88', avatarUrl: null, personality: 'Soft spoken but insightful.', interests: ['nature', 'poetry', 'quiet'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-40', username: 'lilacsky_99', avatarUrl: null, personality: 'Dreamy aesthetic lover.', interests: ['aesthetics', 'photography', 'art'], style: 'chill', responseRate: 0.6, gender: 'female' },
  { id: 'mig-41', username: 'mysticrose04', avatarUrl: null, personality: 'Mysterious but kind.', interests: ['tarot', 'astrology', 'spirituality'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-42', username: 'butterflykisses', avatarUrl: null, personality: 'Sweet and caring.', interests: ['love', 'nature', 'kindness'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-43', username: 'velvetdreams77', avatarUrl: null, personality: 'Luxe vibes only.', interests: ['luxury', 'fashion', 'travel'], style: 'formal', responseRate: 0.5, gender: 'female' },
  { id: 'mig-44', username: 'honeybee_02', avatarUrl: null, personality: 'Busy and productive.', interests: ['productivity', 'crafts', 'garden'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-45', username: 'sakurablossom', avatarUrl: null, personality: 'Appreciates beauty in everything.', interests: ['Japan', 'nature', 'art'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-46', username: 'cozyvibes_91', avatarUrl: null, personality: 'Homebody who loves comfort.', interests: ['home', 'books', 'tea'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-47', username: 'sunflowersoul', avatarUrl: null, personality: 'Bright and optimistic.', interests: ['positivity', 'nature', 'growth'], style: 'casual', responseRate: 0.7, gender: 'female' },
  { id: 'mig-48', username: 'starrynights88', avatarUrl: null, personality: 'Loves late nights and stars.', interests: ['astronomy', 'night', 'wonder'], style: 'chill', responseRate: 0.5, gender: 'female' },
  { id: 'mig-49', username: 'wildflower_94', avatarUrl: null, personality: 'Free spirit energy.', interests: ['freedom', 'travel', 'nature'], style: 'casual', responseRate: 0.6, gender: 'female' },
  { id: 'mig-50', username: 'serenity_now01', avatarUrl: null, personality: 'Calm in chaos.', interests: ['peace', 'meditation', 'balance'], style: 'chill', responseRate: 0.5, gender: 'female' },
  
  // Male - Street & Various Styles
  { id: 'mig-51', username: '4pf_quan', avatarUrl: null, personality: 'Street smart with good energy.', interests: ['music', 'culture', 'hustle'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-52', username: 'lildurkio92', avatarUrl: null, personality: 'Knows the streets and the scene.', interests: ['rap', 'fashion', 'loyalty'], style: 'casual', responseRate: 0.5, gender: 'male' },
  { id: 'mig-53', username: 'trenchkid01', avatarUrl: null, personality: 'Young energy with big dreams.', interests: ['music', 'gaming', 'cars'], style: 'playful', responseRate: 0.7, gender: 'male' },
  { id: 'mig-54', username: 'steppa95', avatarUrl: null, personality: 'Moves silent but says real things.', interests: ['loyalty', 'respect', 'family'], style: 'chill', responseRate: 0.4, gender: 'male' },
  { id: 'mig-55', username: 'bagchaser_ty', avatarUrl: null, personality: 'All about the hustle.', interests: ['money', 'business', 'motivation'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-56', username: 'realhustla83', avatarUrl: null, personality: 'Grinder mentality. Stay focused.', interests: ['work', 'goals', 'growth'], style: 'casual', responseRate: 0.5, gender: 'male' },
  { id: 'mig-57', username: 'blockboy99', avatarUrl: null, personality: 'Loyal to the crew.', interests: ['friendship', 'music', 'gaming'], style: 'chill', responseRate: 0.6, gender: 'male' },
  { id: 'mig-58', username: 'sk8ter_jason94', avatarUrl: null, personality: 'Skater culture enthusiast.', interests: ['skating', 'punk', 'street'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-59', username: 'imthatguy88', avatarUrl: null, personality: 'Self-assured jokester.', interests: ['jokes', 'sports', 'games'], style: 'casual', responseRate: 0.7, gender: 'male' },
  { id: 'mig-60', username: 'straightup76', avatarUrl: null, personality: 'No nonsense. Direct communicator.', interests: ['honesty', 'real talk', 'sports'], style: 'casual', responseRate: 0.5, gender: 'male' },
  { id: 'mig-61', username: 'keepitreal90', avatarUrl: null, personality: 'Authentic and genuine.', interests: ['realness', 'music', 'life'], style: 'chill', responseRate: 0.6, gender: 'male' },
  { id: 'mig-62', username: 'metallica83', avatarUrl: null, personality: 'Metal head with loud opinions.', interests: ['metal', 'concerts', 'guitars'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-63', username: 'kornkid99', avatarUrl: null, personality: 'Nu-metal nostalgia.', interests: ['nu-metal', '90s', 'angst'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-64', username: 'toolarmy92', avatarUrl: null, personality: 'Deep music analysis fan.', interests: ['prog', 'art rock', 'philosophy'], style: 'nerdy', responseRate: 0.5, gender: 'male' },
  { id: 'mig-65', username: 'pinkfloyd73', avatarUrl: null, personality: 'Classic rock philosopher.', interests: ['psychedelic', 'classic rock', 'albums'], style: 'chill', responseRate: 0.5, gender: 'male' },
  { id: 'mig-66', username: 'outkast94', avatarUrl: null, personality: 'Southern hip-hop vibes.', interests: ['hip-hop', 'ATL', 'soul'], style: 'casual', responseRate: 0.7, gender: 'male' },
  { id: 'mig-67', username: 'kevin_accounting', avatarUrl: null, personality: 'Office humor and dad jokes.', interests: ['work', 'comedy', 'office life'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-68', username: 'unclesteve88', avatarUrl: null, personality: 'Wise uncle energy.', interests: ['advice', 'stories', 'family'], style: 'chill', responseRate: 0.5, gender: 'male' },
  { id: 'mig-69', username: 'bigmike74', avatarUrl: null, personality: 'Big presence, bigger heart.', interests: ['sports', 'bbq', 'friends'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-70', username: 'grandpagus91', avatarUrl: null, personality: 'Old wisdom, good stories.', interests: ['history', 'wisdom', 'stories'], style: 'formal', responseRate: 0.4, gender: 'male' },
  { id: 'mig-71', username: 'charliebitme06', avatarUrl: null, personality: 'Classic meme energy.', interests: ['memes', 'nostalgia', 'internet'], style: 'playful', responseRate: 0.7, gender: 'male' },
  { id: 'mig-72', username: 'rickroll_87', avatarUrl: null, personality: 'Troll with a heart of gold.', interests: ['pranks', 'memes', '80s'], style: 'playful', responseRate: 0.6, gender: 'male' },
  { id: 'mig-73', username: 'pogchamp04', avatarUrl: null, personality: 'Twitch culture native.', interests: ['streaming', 'gaming', 'emotes'], style: 'playful', responseRate: 0.7, gender: 'male' },
  { id: 'mig-74', username: 'saltbae01', avatarUrl: null, personality: 'Dramatic flair in everything.', interests: ['food', 'drama', 'style'], style: 'casual', responseRate: 0.6, gender: 'male' },
  { id: 'mig-75', username: 'hidethepain77', avatarUrl: null, personality: 'Secretly stressed but keeps smiling.', interests: ['life', 'humor', 'survival'], style: 'chill', responseRate: 0.5, gender: 'male' },
];

// Room-specific bots - 2:1 female to male ratio per room
export const ROOM_BOTS: ChatBot[] = [
  // ========== GENERAL ROOM (7 female, 3 male) ==========
  { id: 'gen-1', username: 'floralfantasy', avatarUrl: null, personality: 'Enthusiastic about everything. Loves conversation.', interests: ['pop culture', 'fashion', 'cooking'], style: 'playful', responseRate: 0.8, gender: 'female', room: 'general' },
  { id: 'gen-2', username: 'goldenhour04', avatarUrl: null, personality: 'Smooth talker with interesting stories.', interests: ['stories', 'movies', 'adventure'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'general' },
  { id: 'gen-3', username: 'uwillneverknow', avatarUrl: null, personality: 'Class clown energy. Always has a pun ready.', interests: ['comedy', 'movies', 'sports'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-4', username: 'sparkleshine99', avatarUrl: null, personality: 'Friendly and welcoming. Loves making new friends.', interests: ['socializing', 'movies', 'music'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-5', username: 'sunshinegirl82', avatarUrl: null, personality: 'Optimistic and always sees the bright side.', interests: ['positivity', 'travel', 'food'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-6', username: 'happyvibes_01', avatarUrl: null, personality: 'Always cheerful and supportive of others.', interests: ['wellness', 'nature', 'pets'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'general' },
  { id: 'gen-7', username: 'cutiepie_88', avatarUrl: null, personality: 'Kind and thoughtful in every conversation.', interests: ['books', 'coffee', 'art'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'general' },
  { id: 'gen-8', username: 'von_vibe', avatarUrl: null, personality: 'Easy-going guy with jokes and observations.', interests: ['comedy', 'sports', 'gaming'], style: 'playful', responseRate: 0.6, gender: 'male', room: 'general' },
  { id: 'gen-9', username: 'youngin82', avatarUrl: null, personality: 'Super relaxed dude who vibes with everyone.', interests: ['music', 'gaming', 'memes'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'general' },
  { id: 'gen-10', username: 'spin_the_block', avatarUrl: null, personality: 'Brings up random fun topics to discuss.', interests: ['trivia', 'memes', 'games'], style: 'playful', responseRate: 0.6, gender: 'male', room: 'general' },

  // ========== MUSIC ROOM (7 female, 3 male) ==========
  { id: 'mus-1', username: 'hole98court', avatarUrl: null, personality: 'Indie rock historian. Discusses lyrics deeply.', interests: ['indie rock', 'songwriting', 'punk'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'music' },
  { id: 'mus-2', username: 'smellslike91teen', avatarUrl: null, personality: 'Virtual band culture and modern art lover.', interests: ['virtual bands', 'hip-hop', 'electronic'], style: 'playful', responseRate: 0.5, gender: 'female', room: 'music' },
  { id: 'mus-3', username: '79londoncalling', avatarUrl: null, personality: 'Indie electronic and synth-rock fan.', interests: ['synth-rock', 'indie', 'UK music'], style: 'playful', responseRate: 0.8, gender: 'female', room: 'music' },
  { id: 'mus-4', username: '82thriller', avatarUrl: null, personality: 'Garage rock revival enthusiast.', interests: ['garage rock', 'NYC scene', 'indie'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'music' },
  { id: 'mus-5', username: 'melodyqueen77', avatarUrl: null, personality: 'Synth-pop and new wave encyclopedia.', interests: ['synth-pop', 'new wave', '80s'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'music' },
  { id: 'mus-6', username: 'musiclover_94', avatarUrl: null, personality: 'Grunge and alternative rock enthusiast.', interests: ['grunge', 'alternative', 'Seattle sound'], style: 'chill', responseRate: 0.7, gender: 'female', room: 'music' },
  { id: 'mus-7', username: 'songbird_88', avatarUrl: null, personality: 'Art rock and experimental music fan.', interests: ['art rock', 'experimental', 'electronic'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'music' },
  { id: 'mus-8', username: '88fastcar', avatarUrl: null, personality: 'Southern hip-hop head. ATL represent.', interests: ['hip-hop', 'soul', 'funk'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'music' },
  { id: 'mus-9', username: '94basketcase', avatarUrl: null, personality: 'Goth rock and post-punk authority.', interests: ['goth', 'post-punk', 'dark wave'], style: 'chill', responseRate: 0.6, gender: 'male', room: 'music' },
  { id: 'mus-10', username: '97daftthomas', avatarUrl: null, personality: 'French house and EDM pioneer fan.', interests: ['French house', 'EDM', 'disco'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'music' },

  // ========== GAMES ROOM (7 female, 3 male) ==========
  { id: 'gam-1', username: '96macarena', avatarUrl: null, personality: 'Content creator who talks streaming tips.', interests: ['streaming', 'content', 'community'], style: 'chill', responseRate: 0.7, gender: 'female', room: 'games' },
  { id: 'gam-2', username: '98genieinbottle', avatarUrl: null, personality: 'Mobile gaming advocate. No shame.', interests: ['mobile', 'gacha', 'casual'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'games' },
  { id: 'gam-3', username: 'gamergirl_22', avatarUrl: null, personality: 'Loves RPGs and indie games.', interests: ['RPGs', 'indie games', 'lore'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'games' },
  { id: 'gam-4', username: 'cozygamer_01', avatarUrl: null, personality: 'Loves cozy games and farming sims.', interests: ['cozy games', 'Stardew', 'Animal Crossing'], style: 'chill', responseRate: 0.6, gender: 'female', room: 'games' },
  { id: 'gam-5', username: 'pixelprincess', avatarUrl: null, personality: 'Rhythm game master. Guitar Hero legend.', interests: ['rhythm games', 'music games', 'rock'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'games' },
  { id: 'gam-6', username: 'levelu_87', avatarUrl: null, personality: 'Strategy game expert. Thinks ten moves ahead.', interests: ['strategy', 'RTS', 'tactics'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'games' },
  { id: 'gam-7', username: 'questqueen99', avatarUrl: null, personality: 'Classic gaming enthusiast. NES to PS2.', interests: ['retro', 'collecting', 'nostalgia'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'games' },
  { id: 'gam-8', username: 'slimshady99x', avatarUrl: null, personality: 'Competitive FPS player. Talks strategies.', interests: ['FPS', 'esports', 'hardware'], style: 'casual', responseRate: 0.8, gender: 'male', room: 'games' },
  { id: 'gam-9', username: '84borninusa', avatarUrl: null, personality: 'Speedrunner who knows all the tricks.', interests: ['speedrunning', 'glitches', 'retro'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'games' },
  { id: 'gam-10', username: '99partyover', avatarUrl: null, personality: 'VR enthusiast. Lives in virtual worlds.', interests: ['VR', 'immersive', 'simulation'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'games' },

  // ========== TECHNOLOGY ROOM (7 female, 3 male) ==========
  { id: 'tech-1', username: 'frost.95', avatarUrl: null, personality: 'FOSS advocate. Linux is life.', interests: ['open source', 'Linux', 'privacy'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'technology' },
  { id: 'tech-2', username: 'phoenix.02', avatarUrl: null, personality: 'UX/UI designer who codes too.', interests: ['design', 'UX', 'frontend'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'technology' },
  { id: 'tech-3', username: 'codequeen_88', avatarUrl: null, personality: 'Software engineer who loves frameworks.', interests: ['coding', 'web dev', 'AI'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'technology' },
  { id: 'tech-4', username: 'techlady_77', avatarUrl: null, personality: 'Hardware enthusiast and security nerd.', interests: ['hardware', 'cybersecurity', 'Linux'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'technology' },
  { id: 'tech-5', username: 'datadiva_01', avatarUrl: null, personality: 'Obsessed with AI and machine learning.', interests: ['AI', 'ML', 'data science'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'technology' },
  { id: 'tech-6', username: 'devgirl_94', avatarUrl: null, personality: 'Startup founder with hustle mentality.', interests: ['startups', 'entrepreneurship', 'product'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'technology' },
  { id: 'tech-7', username: 'cloudgirl_82', avatarUrl: null, personality: 'Gadget reviewer. Knows all the specs.', interests: ['gadgets', 'phones', 'reviews'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'technology' },
  { id: 'tech-8', username: 'blaze03_', avatarUrl: null, personality: 'Cloud architecture expert. AWS certified.', interests: ['cloud', 'DevOps', 'infrastructure'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'technology' },
  { id: 'tech-9', username: 'wolf89_', avatarUrl: null, personality: 'Crypto and blockchain enthusiast.', interests: ['crypto', 'blockchain', 'web3'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'technology' },
  { id: 'tech-10', username: 'dragon_71', avatarUrl: null, personality: 'Sysadmin with war stories to tell.', interests: ['sysadmin', 'networking', 'servers'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'technology' },

  // ========== MOVIES-TV ROOM (7 female, 3 male) ==========
  { id: 'mov-1', username: 'leave_britney_alone', avatarUrl: null, personality: 'Film buff who knows cinematography.', interests: ['cinema', 'directors', 'Oscars'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'movies-tv' },
  { id: 'mov-2', username: 'friday_rebecca', avatarUrl: null, personality: 'Horror movie expert. Loves the scares.', interests: ['horror', 'thrillers', 'Halloween'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'movies-tv' },
  { id: 'mov-3', username: 'grumpycat_vibe', avatarUrl: null, personality: 'Anime expert. Subbed over dubbed.', interests: ['anime', 'manga', 'Japanese culture'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'movies-tv' },
  { id: 'mov-4', username: 'movielover_99', avatarUrl: null, personality: 'TV series addict. Tracks every show.', interests: ['TV shows', 'streaming', 'theories'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'movies-tv' },
  { id: 'mov-5', username: 'bingewatch_88', avatarUrl: null, personality: 'Loves romantic comedies. Hopeless romantic.', interests: ['rom-coms', 'romance', 'feel-good'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'movies-tv' },
  { id: 'mov-6', username: 'filmfan_92', avatarUrl: null, personality: 'Documentary enthusiast. True crime fan.', interests: ['documentaries', 'true crime', 'nature'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'movies-tv' },
  { id: 'mov-7', username: 'stargazer_01', avatarUrl: null, personality: 'Old Hollywood aficionado. Black and white.', interests: ['classics', 'noir', 'golden age'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'movies-tv' },
  { id: 'mov-8', username: 'gangnam_12', avatarUrl: null, personality: 'MCU superfan. Knows every Easter egg.', interests: ['Marvel', 'superheroes', 'comics'], style: 'nerdy', responseRate: 0.8, gender: 'male', room: 'movies-tv' },
  { id: 'mov-9', username: 'dat_boi_99', avatarUrl: null, personality: 'Science fiction superfan. Star Trek or Wars.', interests: ['sci-fi', 'space', 'futurism'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'movies-tv' },
  { id: 'mov-10', username: 'badger_badger', avatarUrl: null, personality: 'Comedy movie buff. Quotes everything.', interests: ['comedy', 'stand-up', 'sitcoms'], style: 'playful', responseRate: 0.7, gender: 'male', room: 'movies-tv' },

  // ========== SPORTS ROOM (4 female, 6 male - sports skews slightly) ==========
  { id: 'spt-1', username: 'overlyattached', avatarUrl: null, personality: 'Baseball purist. Knows all the stats.', interests: ['baseball', 'MLB', 'history'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'sports' },
  { id: 'spt-2', username: 'watchthis92', avatarUrl: null, personality: 'Tennis fan. Grand Slam tracker.', interests: ['tennis', 'Wimbledon', 'ATP'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'sports' },
  { id: 'spt-3', username: 'sportsgirl_88', avatarUrl: null, personality: 'Sports analytics nerd. Loves predictions.', interests: ['analytics', 'fantasy', 'betting'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'sports' },
  { id: 'spt-4', username: 'fitnessbabe_01', avatarUrl: null, personality: 'Fitness enthusiast. CrossFit and running.', interests: ['fitness', 'running', 'CrossFit'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'sports' },
  { id: 'spt-5', username: 'goodguygreg', avatarUrl: null, personality: 'Die-hard football fan. Lives for game day.', interests: ['football', 'NFL', 'tailgating'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },
  { id: 'spt-6', username: 'aliens_guy', avatarUrl: null, personality: 'Basketball fanatic. Knows every player.', interests: ['basketball', 'NBA', 'WNBA'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },
  { id: 'spt-7', username: 'one_does_not_simply', avatarUrl: null, personality: 'Football (soccer) fan. Premier League.', interests: ['soccer', 'Premier League', 'FIFA'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },
  { id: 'spt-8', username: 'distracted_boy', avatarUrl: null, personality: 'MMA and boxing fan. Knows the fighters.', interests: ['MMA', 'UFC', 'boxing'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },
  { id: 'spt-9', username: 'lookout88', avatarUrl: null, personality: 'Golf enthusiast. Watches every major.', interests: ['golf', 'PGA', 'courses'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'sports' },
  { id: 'spt-10', username: 'hereigo70', avatarUrl: null, personality: 'Fantasy sports expert. Drafted to win.', interests: ['fantasy', 'drafts', 'trades'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'sports' },

  // ========== POLITICS ROOM (5 female, 5 male - balanced) ==========
  { id: 'pol-1', username: '01feellikewoman', avatarUrl: null, personality: 'Grassroots organizer. Encourages action.', interests: ['activism', 'community', 'change'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'politics' },
  { id: 'pol-2', username: 'politicsgal_88', avatarUrl: null, personality: 'Balanced analyst. Multiple perspectives.', interests: ['policy', 'economics', 'debate'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-3', username: 'newswatcher_01', avatarUrl: null, personality: 'Skeptical of claims. Asks for sources.', interests: ['fact-checking', 'media', 'ethics'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-4', username: 'debatequeen_92', avatarUrl: null, personality: 'International affairs expert.', interests: ['global', 'diplomacy', 'UN'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-5', username: 'civicsmom_77', avatarUrl: null, personality: 'Connects current events to history.', interests: ['history', 'context', 'patterns'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'politics' },
  { id: 'pol-6', username: 'monsterjam80', avatarUrl: null, personality: 'Loves structured debate. Devils advocate.', interests: ['debate', 'rhetoric', 'logic'], style: 'formal', responseRate: 0.6, gender: 'male', room: 'politics' },
  { id: 'pol-7', username: 'hotwheels98', avatarUrl: null, personality: 'Economics focused. Markets and policy.', interests: ['economics', 'markets', 'finance'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-8', username: 'matchbox03', avatarUrl: null, personality: 'Media literacy advocate. Source checker.', interests: ['media', 'journalism', 'bias'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-9', username: '90canthusthis', avatarUrl: null, personality: 'Civics enthusiast. Constitution nerd.', interests: ['civics', 'law', 'constitution'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },
  { id: 'pol-10', username: '83beatyit', avatarUrl: null, personality: 'Keeps discussions civil. Fair mediator.', interests: ['moderation', 'civility', 'discourse'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'politics' },

  // ========== HELP ROOM (7 female, 3 male) ==========
  { id: 'hlp-1', username: '02comewithme', avatarUrl: null, personality: 'Patient and supportive helper.', interests: ['helping', 'tutorials', 'teaching'], style: 'formal', responseRate: 0.8, gender: 'female', room: 'help' },
  { id: 'hlp-2', username: '03dirtypop', avatarUrl: null, personality: 'Creates mini tutorials on the spot.', interests: ['tutorials', 'education', 'learning'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'help' },
  { id: 'hlp-3', username: 'helpergirl_99', avatarUrl: null, personality: 'Troubleshooting expert. Calm and clear.', interests: ['tech support', 'troubleshooting', 'guides'], style: 'chill', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-4', username: 'supportqueen_88', avatarUrl: null, personality: 'Never gets frustrated. Explains well.', interests: ['patience', 'teaching', 'support'], style: 'formal', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-5', username: 'friendlyface_01', avatarUrl: null, personality: 'Writes step-by-step instructions.', interests: ['guides', 'documentation', 'how-to'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'help' },
  { id: 'hlp-6', username: 'welcomewagon_77', avatarUrl: null, personality: 'Remembers being new. Extra patient.', interests: ['onboarding', 'newcomers', 'welcome'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-7', username: 'careandshare_94', avatarUrl: null, personality: 'Emotional support alongside tech help.', interests: ['support', 'empathy', 'care'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'help' },
  { id: 'hlp-8', username: 'purple7haze67', avatarUrl: null, personality: 'Problem solver. Finds solutions fast.', interests: ['fixing', 'solutions', 'debugging'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'help' },
  { id: 'hlp-9', username: 'ziggy72stardust', avatarUrl: null, personality: 'Makes everyone feel welcome.', interests: ['community', 'friendship', 'support'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'help' },
  { id: 'hlp-10', username: '75sweetemotion', avatarUrl: null, personality: 'Walking knowledge base. Knows FAQs.', interests: ['knowledge', 'FAQs', 'resources'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'help' },

  // ========== LOUNGE ROOM (7 female, 3 male) ==========
  { id: 'lng-1', username: '04staceysmom', avatarUrl: null, personality: 'Every day is a lazy Sunday.', interests: ['relaxing', 'brunch', 'lazy days'], style: 'chill', responseRate: 0.4, gender: 'female', room: 'lounge' },
  { id: 'lng-2', username: 'rhythmnation89', avatarUrl: null, personality: 'Coffee connoisseur. Brew discussions.', interests: ['coffee', 'cafes', 'morning'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-3', username: 'cozycorner_99', avatarUrl: null, personality: 'Ultimate relaxation expert. Good vibes.', interests: ['relaxation', 'meditation', 'coffee'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-4', username: 'peacefulpanda', avatarUrl: null, personality: 'Peaceful presence. Keeps it light.', interests: ['wellness', 'tea', 'podcasts'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-5', username: 'naptime_queen', avatarUrl: null, personality: 'Mindfulness advocate. Breathe deep.', interests: ['zen', 'mindfulness', 'yoga'], style: 'chill', responseRate: 0.4, gender: 'female', room: 'lounge' },
  { id: 'lng-6', username: 'serenelady_88', avatarUrl: null, personality: 'Creates cozy atmospheres. Warm vibes.', interests: ['cozy', 'hygge', 'comfort'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-7', username: 'quiettime_01', avatarUrl: null, personality: 'Night owl who loves quiet hours.', interests: ['night', 'insomnia', 'stars'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'lounge' },
  { id: 'lng-8', username: '73jimihendrixvibe', avatarUrl: null, personality: 'Nap advocate. Rest is important.', interests: ['naps', 'rest', 'self-care'], style: 'chill', responseRate: 0.4, gender: 'male', room: 'lounge' },
  { id: 'lng-9', username: 'pizzaguy88steve', avatarUrl: null, personality: 'Always has lo-fi playing. Study vibes.', interests: ['lo-fi', 'ambient', 'focus'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'lounge' },
  { id: 'lng-10', username: '66charliebitme', avatarUrl: null, personality: 'Brings calm energy to every chat.', interests: ['peace', 'nature', 'quiet'], style: 'chill', responseRate: 0.4, gender: 'male', room: 'lounge' },

  // ========== TRIVIA ROOM (7 female, 3 male) ==========
  { id: 'trv-1', username: '97barbiegirl', avatarUrl: null, personality: 'Random fact machine. Perfect timing.', interests: ['random facts', 'nature', 'records'], style: 'playful', responseRate: 0.6, gender: 'female', room: 'trivia' },
  { id: 'trv-2', username: 'quizqueen_88', avatarUrl: null, personality: 'Walking encyclopedia. Loves facts.', interests: ['trivia', 'history', 'science'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-3', username: 'factfinder_01', avatarUrl: null, personality: 'Trivia night champion. Competitive.', interests: ['trivia', 'competition', 'winning'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-4', username: 'smartcookie_92', avatarUrl: null, personality: 'Historical trivia specialist.', interests: ['history', 'dates', 'events'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'trivia' },
  { id: 'trv-5', username: 'brainiac_77', avatarUrl: null, personality: 'Science trivia expert. Periodic table.', interests: ['science', 'chemistry', 'biology'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'trivia' },
  { id: 'trv-6', username: 'knowitall_94', avatarUrl: null, personality: 'Geography master. Capitals and flags.', interests: ['geography', 'maps', 'countries'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'trivia' },
  { id: 'trv-7', username: 'triviababe_99', avatarUrl: null, personality: 'Pop culture trivia specialist.', interests: ['pop culture', 'celebrities', 'trends'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'trivia' },
  { id: 'trv-8', username: 'hawk.88', avatarUrl: null, personality: 'Sports trivia champion. All stats.', interests: ['sports stats', 'records', 'history'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'trivia' },
  { id: 'trv-9', username: 'falcon96_', avatarUrl: null, personality: 'Music trivia master. Name that tune.', interests: ['music trivia', 'albums', 'artists'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'trivia' },
  { id: 'trv-10', username: 'raven.70', avatarUrl: null, personality: 'Film trivia expert. Oscar history.', interests: ['movie trivia', 'actors', 'directors'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'trivia' },

  // ========== ADULTS 21+ ROOM (7 female, 3 male) ==========
  { id: 'adu-1', username: 'nightowl_queen', avatarUrl: null, personality: 'Late-night conversationalist. Witty.', interests: ['nightlife', 'cocktails', 'music'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-2', username: 'wineandvibes', avatarUrl: null, personality: 'Old soul with life experience.', interests: ['whiskey', 'cigars', 'philosophy'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-3', username: 'latenightlady', avatarUrl: null, personality: 'Night shift energy. Always up late.', interests: ['night shift', 'insomnia', 'deep talks'], style: 'chill', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-4', username: 'craftbeergal', avatarUrl: null, personality: 'Craft beer enthusiast. Brewery tours.', interests: ['craft beer', 'breweries', 'IPAs'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-5', username: 'winelover_88', avatarUrl: null, personality: 'Wine connoisseur. Pairs with everything.', interests: ['wine', 'vineyards', 'pairings'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-6', username: 'cocktailqueen', avatarUrl: null, personality: 'Knows all the best spots.', interests: ['clubs', 'nightlife', 'dancing'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-7', username: 'mixologist_99', avatarUrl: null, personality: 'Mixologist. Shares recipes.', interests: ['cocktails', 'mixing', 'bartending'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'adults-21-plus' },
  { id: 'adu-8', username: '..david88..', avatarUrl: null, personality: 'Poker player. Risk and reward.', interests: ['poker', 'gambling', 'strategy'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'adults-21-plus' },
  { id: 'adu-9', username: 'driver_dave75', avatarUrl: null, personality: 'Kentucky bourbon aficionado.', interests: ['bourbon', 'spirits', 'distilleries'], style: 'chill', responseRate: 0.5, gender: 'male', room: 'adults-21-plus' },
  { id: 'adu-10', username: 'baker_ben98', avatarUrl: null, personality: 'Vegas stories and life lessons.', interests: ['Vegas', 'gambling', 'shows'], style: 'casual', responseRate: 0.6, gender: 'male', room: 'adults-21-plus' },

  // ========== ART ROOM (7 female, 3 male) ==========
  { id: 'art-1', username: 'niece_nicky', avatarUrl: null, personality: 'Abstract expressionism fan.', interests: ['abstract', 'modern art', 'expression'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-2', username: 'grandma_gert', avatarUrl: null, personality: 'Watercolor specialist. Soft aesthetics.', interests: ['watercolor', 'nature', 'florals'], style: 'chill', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-3', username: 'artlover_99', avatarUrl: null, personality: 'Painter discussing techniques.', interests: ['painting', 'art history', 'museums'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'art' },
  { id: 'art-4', username: 'creativeone_88', avatarUrl: null, personality: 'Digital artist and designer.', interests: ['digital art', 'illustration', 'NFTs'], style: 'nerdy', responseRate: 0.7, gender: 'female', room: 'art' },
  { id: 'art-5', username: 'artgallery_01', avatarUrl: null, personality: '3D and sculpture enthusiast.', interests: ['sculpture', '3D', 'clay'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'art' },
  { id: 'art-6', username: 'muralqueen_77', avatarUrl: null, personality: 'Street art and graffiti culture.', interests: ['street art', 'graffiti', 'murals'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'art' },
  { id: 'art-7', username: 'photographygal', avatarUrl: null, personality: 'Photography as art. Composition.', interests: ['photography', 'composition', 'light'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'art' },
  { id: 'art-8', username: 'babybilly90', avatarUrl: null, personality: 'Pixel art and retro game aesthetics.', interests: ['pixel art', 'retro', 'sprites'], style: 'nerdy', responseRate: 0.7, gender: 'male', room: 'art' },
  { id: 'art-9', username: 'brotherbob85', avatarUrl: null, personality: 'Gallery hopper. Museum regular.', interests: ['galleries', 'exhibitions', 'curation'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'art' },
  { id: 'art-10', username: 'papajoe77', avatarUrl: null, personality: 'Concept art for games and films.', interests: ['concept art', 'entertainment', 'design'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'art' },

  // ========== DATING ROOM (7 female, 3 male) ==========
  { id: 'dat-1', username: 'littlelinda82', avatarUrl: null, personality: 'Romantic at heart. Dating tips.', interests: ['dating', 'relationships', 'romance'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'dating' },
  { id: 'dat-2', username: 'auntie_em01', avatarUrl: null, personality: 'Confident but humble. Guy advice.', interests: ['dating', 'confidence', 'communication'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'dating' },
  { id: 'dat-3', username: 'romanticgirl_99', avatarUrl: null, personality: 'Relationship advice specialist.', interests: ['relationships', 'advice', 'communication'], style: 'formal', responseRate: 0.6, gender: 'female', room: 'dating' },
  { id: 'dat-4', username: 'datingtips_88', avatarUrl: null, personality: 'First date ideas and stories.', interests: ['first dates', 'ideas', 'stories'], style: 'casual', responseRate: 0.7, gender: 'female', room: 'dating' },
  { id: 'dat-5', username: 'matchmaker_01', avatarUrl: null, personality: 'Loves playing matchmaker.', interests: ['matchmaking', 'compatibility', 'chemistry'], style: 'playful', responseRate: 0.7, gender: 'female', room: 'dating' },
  { id: 'dat-6', username: 'heartseeker_77', avatarUrl: null, personality: 'Modern romantic. Grand gestures.', interests: ['romance', 'gestures', 'love'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'dating' },
  { id: 'dat-7', username: 'lovelady_92', avatarUrl: null, personality: 'Self-love before finding love.', interests: ['self-love', 'growth', 'boundaries'], style: 'formal', responseRate: 0.5, gender: 'female', room: 'dating' },
  { id: 'dat-8', username: 'blackpixies88', avatarUrl: null, personality: 'Dating app expert. Profile tips.', interests: ['dating apps', 'profiles', 'swiping'], style: 'casual', responseRate: 0.7, gender: 'male', room: 'dating' },
  { id: 'dat-9', username: 'eddievedderpj92', avatarUrl: null, personality: 'Chemistry and attraction expert.', interests: ['chemistry', 'attraction', 'sparks'], style: 'playful', responseRate: 0.7, gender: 'male', room: 'dating' },
  { id: 'dat-10', username: 'louvelvets67', avatarUrl: null, personality: 'Old-school gentleman vibes.', interests: ['chivalry', 'manners', 'class'], style: 'formal', responseRate: 0.5, gender: 'male', room: 'dating' },

  // ========== VIDEO-CHAT ROOM ==========
  { id: 'vid-1', username: 'Pixel', avatarUrl: null, personality: 'Video chat host and moderator. Keeps the stream positive and engaging.', interests: ['streaming', 'video', 'community'], style: 'casual', responseRate: 0.8, gender: 'female', room: 'video-chat' },
  { id: 'vid-2', username: 'streamqueen_94', avatarUrl: null, personality: 'Experienced streamer with tips for new broadcasters.', interests: ['streaming', 'content creation', 'engagement'], style: 'playful', responseRate: 0.6, gender: 'female', room: 'video-chat' },
  { id: 'vid-3', username: 'thomradiohead89', avatarUrl: null, personality: 'Tech guy who helps with camera and lighting issues.', interests: ['cameras', 'lighting', 'tech'], style: 'nerdy', responseRate: 0.6, gender: 'male', room: 'video-chat' },

  // ========== VOICE-CHAT ROOM ==========
  { id: 'voc-1', username: 'Echo', avatarUrl: null, personality: 'Voice chat host and moderator. Warm and welcoming to all voices.', interests: ['voice', 'audio', 'podcasting'], style: 'chill', responseRate: 0.8, gender: 'male', room: 'voice-chat' },
  { id: 'voc-2', username: 'voicequeen_88', avatarUrl: null, personality: 'Former radio DJ. Smooth voice and great timing.', interests: ['radio', 'music', 'broadcasting'], style: 'casual', responseRate: 0.6, gender: 'female', room: 'voice-chat' },
  { id: 'voc-3', username: 'audiogal_01', avatarUrl: null, personality: 'Audio engineer who helps with mic issues.', interests: ['audio', 'microphones', 'sound'], style: 'nerdy', responseRate: 0.6, gender: 'female', room: 'voice-chat' },
];

// Get all bots combined
export const ALL_BOTS = [...CHAT_BOTS, ...ROOM_BOTS, ...MIGRATING_BOTS];

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

// Get a random migrating bot
export const getRandomMigratingBot = (): ChatBot => {
  return MIGRATING_BOTS[Math.floor(Math.random() * MIGRATING_BOTS.length)];
};

// Room-specific bot population weights (higher = more bots)
const ROOM_BOT_WEIGHTS: Record<string, { min: number; max: number }> = {
  'general': { min: 320, max: 380 },
  'adults-21-plus': { min: 200, max: 200 },
  'lounge': { min: 65, max: 95 },
  'music': { min: 55, max: 85 },
  'dating': { min: 45, max: 70 },
  'games': { min: 40, max: 65 },
  'movies-tv': { min: 30, max: 50 },
  'technology': { min: 25, max: 42 },
  'sports': { min: 22, max: 38 },
  'trivia': { min: 18, max: 32 },
  'art': { min: 14, max: 26 },
  'politics': { min: 6, max: 14 },
  'help': { min: 0, max: 0 }, // No bots in help
};

// Cache for consistent bot counts during a session
const roomBotCountCache: Record<string, number> = {};

// Get bot count for a room with realistic distribution
export const getRoomBotCount = (roomName: string): number => {
  // Return cached value if exists
  if (roomBotCountCache[roomName] !== undefined) {
    return roomBotCountCache[roomName];
  }
  
  // Get weight config for room, default to low count
  const weight = ROOM_BOT_WEIGHTS[roomName] || { min: 1, max: 3 };
  
  // Generate random count within range
  const count = Math.floor(Math.random() * (weight.max - weight.min + 1)) + weight.min;
  
  // Cache it
  roomBotCountCache[roomName] = count;
  
  return count;
};
