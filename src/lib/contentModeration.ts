// Content moderation utilities for filtering URLs and profanity

// Common profanity words list (basic version - can be expanded)
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock', 'pussy', 
  'bastard', 'cunt', 'whore', 'slut', 'fag', 'nigger', 'nigga', 'retard',
  'asshole', 'bullshit', 'motherfucker', 'fucker', 'dickhead', 'prick',
  'twat', 'wanker', 'bollocks', 'arse', 'bugger', 'bloody'
];

// Common abbreviations/titles that look like domains but aren't
const FALSE_POSITIVE_PATTERNS = [
  /\bdr\.\s*\w+/gi,      // Dr. Name
  /\bmr\.\s*\w+/gi,      // Mr. Name
  /\bmrs\.\s*\w+/gi,     // Mrs. Name
  /\bms\.\s*\w+/gi,      // Ms. Name
  /\bprof\.\s*\w+/gi,    // Prof. Name
  /\bst\.\s*\w+/gi,      // St. Name (Saint)
  /\bjr\.\s*$/gi,        // Jr.
  /\bsr\.\s*$/gi,        // Sr.
  /\binc\.\s*$/gi,       // Inc.
  /\bltd\.\s*$/gi,       // Ltd.
  /\betc\.\s*$/gi,       // etc.
  /\be\.g\.\s*/gi,       // e.g.
  /\bi\.e\.\s*/gi,       // i.e.
];

// URL pattern regex - more strict to avoid false positives
// Must have protocol OR www. OR be a valid domain with path/query
const URL_PATTERN = /(?:https?:\/\/)[^\s<>"{}|\\^`\[\]]+|(?:www\.)[^\s<>"{}|\\^`\[\]]+|(?<![.\w])[a-zA-Z0-9][-a-zA-Z0-9]*\.(?:com|org|net|edu|gov|io|co|dev|app|xyz|info|biz|me|tv|cc|gg|fm|ly|to|be|uk|de|fr|jp|cn|ru|br|au|in|ca|nl|es|it|pl|se|no|fi|dk|ch|at|nz|za|mx|ar|kr|tw|hk|sg|my|ph|id|th|vn|ae|sa|il|tr|eg|ng|ke|gh|pk|bd|lk|np|mm|kh|la|vn)(?:\/[^\s<>"{}|\\^`\[\]]*)?(?![.\w])/gi;

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

// Check if message contains URLs (excluding false positives like Dr. Name)
export const containsUrl = (message: string): boolean => {
  // First, temporarily replace false positives
  let cleaned = message;
  FALSE_POSITIVE_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, ' SAFE_PLACEHOLDER ');
  });
  
  // Reset lastIndex to avoid regex state issues
  URL_PATTERN.lastIndex = 0;
  return URL_PATTERN.test(cleaned);
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
  // Preserve false positives
  const preservedParts: { placeholder: string; original: string }[] = [];
  let cleaned = message;
  
  FALSE_POSITIVE_PATTERNS.forEach((pattern, idx) => {
    cleaned = cleaned.replace(pattern, (match) => {
      const placeholder = `__SAFE_${idx}_${preservedParts.length}__`;
      preservedParts.push({ placeholder, original: match });
      return placeholder;
    });
  });
  
  // Reset lastIndex and filter actual URLs
  URL_PATTERN.lastIndex = 0;
  cleaned = cleaned.replace(URL_PATTERN, '[link blocked]');
  
  // Restore preserved parts
  preservedParts.forEach(({ placeholder, original }) => {
    cleaned = cleaned.replace(placeholder, original);
  });
  
  return cleaned;
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
  _isRegistered18Plus: boolean = false // Kept for API compatibility but no longer used
): ModerationResult => {
  const warnings: string[] = [];
  let filteredMessage = message;
  
  // Skip moderation for adult channels only
  if (isAdultChannel(channelName)) {
    return { allowed: true, filteredMessage: message, warnings: [] };
  }
  
  // Check and filter URLs
  if (containsUrl(message)) {
    filteredMessage = filterUrls(filteredMessage);
    warnings.push('URLs are filtered in this channel');
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
