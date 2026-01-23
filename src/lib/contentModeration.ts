// Content moderation utilities for filtering URLs and profanity

// Common profanity words list (basic version - can be expanded)
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock', 'pussy', 
  'bastard', 'cunt', 'whore', 'slut', 'fag', 'nigger', 'nigga', 'retard',
  'asshole', 'bullshit', 'motherfucker', 'fucker', 'dickhead', 'prick',
  'twat', 'wanker', 'bollocks', 'arse', 'bugger', 'bloody'
];

// URL pattern regex
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"{}|\\^`\[\]]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`\[\]]*)?/gi;

// Check if channel is 18+ / adults-only
export const isAdultChannel = (channelName: string): boolean => {
  const adultChannels = ['adults-21-plus', 'adult', 'adults', 'nsfw'];
  return adultChannels.includes(channelName.toLowerCase());
};

// Check if message contains profanity
export const containsProfanity = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return PROFANITY_LIST.some(word => {
    // Match whole words only
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerMessage);
  });
};

// Check if message contains URLs
export const containsUrl = (message: string): boolean => {
  return URL_PATTERN.test(message);
};

// Filter profanity from message (replace with asterisks)
export const filterProfanity = (message: string): string => {
  let filtered = message;
  PROFANITY_LIST.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  return filtered;
};

// Filter URLs from message (replace with blocked notice)
export const filterUrls = (message: string): string => {
  return message.replace(URL_PATTERN, '[link blocked]');
};

// Main content moderation function
export interface ModerationResult {
  allowed: boolean;
  filteredMessage: string;
  warnings: string[];
}

export const moderateContent = (
  message: string, 
  channelName: string,
  isRegistered18Plus: boolean = false
): ModerationResult => {
  const warnings: string[] = [];
  let filteredMessage = message;
  
  // Skip moderation for adult channels or 18+ registered users
  if (isAdultChannel(channelName) || isRegistered18Plus) {
    return { allowed: true, filteredMessage: message, warnings: [] };
  }
  
  // Check and filter URLs
  if (containsUrl(message)) {
    filteredMessage = filterUrls(filteredMessage);
    warnings.push('URLs are not allowed for non-18+ users');
  }
  
  // Check and filter profanity
  if (containsProfanity(message)) {
    filteredMessage = filterProfanity(filteredMessage);
    warnings.push('Profanity has been filtered');
  }
  
  return {
    allowed: true, // Message is allowed but filtered
    filteredMessage,
    warnings
  };
};

// Check if content should be blocked entirely (severe violations)
export const shouldBlockMessage = (message: string): boolean => {
  // Block messages that are ONLY profanity or URLs
  const cleaned = message.replace(URL_PATTERN, '').trim();
  const words = cleaned.split(/\s+/);
  const profanityCount = words.filter(word => 
    PROFANITY_LIST.some(p => word.toLowerCase() === p)
  ).length;
  
  // Block if 80%+ of the message is profanity
  if (words.length > 0 && profanityCount / words.length >= 0.8) {
    return true;
  }
  
  return false;
};
