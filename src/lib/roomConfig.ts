// Famous hackers as AI moderator personas
export interface ModeratorInfo {
  name: string;
  displayName: string;
  avatar: string;
}

export const MODERATORS: Record<string, ModeratorInfo> = {
  'general': { name: 'Mitnick', displayName: 'Kevin Mitnick', avatar: '👤' },
  'adults-21-plus': { name: 'Lamo', displayName: 'Adrian Lamo', avatar: '🎭' },
  'music': { name: 'geohot', displayName: 'George Hotz', avatar: '🎵' },
  'help': { name: 'Mudge', displayName: 'Mudge', avatar: '🛠️' },
  'games': { name: 'Barnaby', displayName: 'Barnaby Jack', avatar: '🎮' },
  'politics': { name: 'Sabu', displayName: 'Sabu', avatar: '✊' },
  'movies-tv': { name: 'Guccifer', displayName: 'Guccifer', avatar: '🎬' },
  'sports': { name: 'Albert', displayName: 'Albert Gonzalez', avatar: '⚽' },
  'technology': { name: 'Charlie', displayName: 'Charlie Miller', avatar: '💻' },
  'dating': { name: 'Phoenix', displayName: 'Phoenix', avatar: '💕' },
  'lounge': { name: 'Solo', displayName: 'Solo', avatar: '☕' },
  'trivia': { name: 'Poulsen', displayName: 'Kevin Poulsen', avatar: '🧠' },
};

// Room welcome messages
export const WELCOME_MESSAGES: Record<string, string> = {
  'general': "Welcome to General! I'm Mitnick, your friendly neighborhood moderator. Feel free to chat about anything. Remember: information wants to be free, but respect wants to be earned. 🔓",
  'adults-21-plus': "Welcome to Adults 21+. I'm Lamo. This is a space for mature conversations. Keep it classy, keep it real. The best discussions happen when we're honest with ourselves. 🌙",
  'music': "Yo! Welcome to Music! I'm geohot. Whether you're into beats, bars, or classical compositions - this is your zone. Drop your favorite tracks or just vibe. Let's make some noise! 🎧",
  'help': "Hey there, welcome to Help! I'm Mudge. No question is too basic here. We all started somewhere, and we're here to learn together. What can I help you figure out today? 💡",
  'games': "Player joined! I'm Barnaby, your gaming mod. Whether you're here for esports, casual gaming, or retro classics - you're among friends. GG and have fun! 🕹️",
  'politics': "Welcome to Politics. I'm Sabu. This is a space for informed debate. Respect different viewpoints, cite your sources, and remember - we're all trying to understand a complex world. 🗳️",
  'movies-tv': "Welcome, cinephile! I'm Guccifer. From blockbusters to indie gems - let's discuss it all. No spoilers without warnings though, that's the only rule. 🍿",
  'sports': "What's good! I'm Albert, welcome to Sports. Whether you're team stats or team heart, casual fan or die-hard supporter - pull up a seat. Let's talk game. 🏆",
  'technology': "Welcome to Technology. I'm Charlie. From vulnerabilities to emerging tech, hardware hacks to software dev - this is where we geek out. What's on your mind? 🔧",
  'dating': "Hey there! Welcome to Dating. I'm Phoenix. This is a space to discuss relationships and maybe find some connections. Be respectful, be genuine, be yourself. 💫",
  'lounge': "Welcome to the Lounge! I'm Solo. This is the chill zone - no pressure, no agenda. Just good vibes and interesting conversations. Grab a virtual drink and relax. 🛋️",
  'trivia': "Welcome, knowledge seeker! I'm Poulsen. This is Trivia - where random facts reign supreme and curiosity is rewarded. Think you know stuff? Let's find out! 🎯",
};

// Tips of the day per room
export const TIPS_OF_THE_DAY: Record<string, string[]> = {
  'general': [
    "💡 Tip: The best hackers are actually the best learners.",
    "💡 Tip: Social engineering is 90% patience and 10% confidence.",
    "💡 Tip: Coffee isn't a beverage, it's a debugging tool.",
  ],
  'adults-21-plus': [
    "💡 Tip: Life's too short for cheap whiskey and weak passwords.",
    "💡 Tip: The best conversations happen after midnight.",
    "💡 Tip: Age brings wisdom, but also better stories to tell.",
  ],
  'music': [
    "💡 Tip: The best beats come from unexpected samples.",
    "💡 Tip: Your ears are your most valuable tool - protect them.",
    "💡 Tip: The perfect drop is like the perfect exploit - timing is everything.",
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
    "💡 Tip: Information wants to be free, but context wants to be understood.",
    "💡 Tip: Every revolution starts with a conversation.",
    "💡 Tip: Disagree respectfully - you might learn something.",
  ],
  'movies-tv': [
    "💡 Tip: Spoilers are the real cyber crime.",
    "💡 Tip: The book is usually better, but the memes come from the movie.",
    "💡 Tip: Binge-watching is just speedrunning entertainment.",
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
    "💡 Tip: Authenticity is the ultimate attraction.",
    "💡 Tip: Listen more than you speak - mystery is magnetic.",
    "💡 Tip: Being interesting starts with being interested.",
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
