// Default avatar configurations using DiceBear API for consistent, attractive avatars
// Using "avataaars" style which provides diverse, friendly cartoon avatars

export interface DefaultAvatar {
  id: string;
  name: string;
  url: string;
  category: 'male' | 'female' | 'neutral';
}

// Generate DiceBear avatar URLs with specific seeds for consistency
const generateAvatarUrl = (seed: string, style: string = 'avataaars'): string => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const defaultAvatars: DefaultAvatar[] = [
  // Male avatars (10)
  { id: 'male-1', name: 'Alex', url: generateAvatarUrl('alex-cyber'), category: 'male' },
  { id: 'male-2', name: 'Marcus', url: generateAvatarUrl('marcus-tech'), category: 'male' },
  { id: 'male-3', name: 'Jake', url: generateAvatarUrl('jake-hacker'), category: 'male' },
  { id: 'male-4', name: 'Ryan', url: generateAvatarUrl('ryan-dev'), category: 'male' },
  { id: 'male-5', name: 'Leo', url: generateAvatarUrl('leo-matrix'), category: 'male' },
  { id: 'male-6', name: 'Ethan', url: generateAvatarUrl('ethan-code'), category: 'male' },
  { id: 'male-7', name: 'Noah', url: generateAvatarUrl('noah-byte'), category: 'male' },
  { id: 'male-8', name: 'Lucas', url: generateAvatarUrl('lucas-net'), category: 'male' },
  { id: 'male-9', name: 'Mason', url: generateAvatarUrl('mason-sys'), category: 'male' },
  { id: 'male-10', name: 'Oliver', url: generateAvatarUrl('oliver-root'), category: 'male' },
  
  // Female avatars (10)
  { id: 'female-1', name: 'Luna', url: generateAvatarUrl('luna-cyber'), category: 'female' },
  { id: 'female-2', name: 'Aria', url: generateAvatarUrl('aria-tech'), category: 'female' },
  { id: 'female-3', name: 'Maya', url: generateAvatarUrl('maya-hack'), category: 'female' },
  { id: 'female-4', name: 'Zoe', url: generateAvatarUrl('zoe-dev'), category: 'female' },
  { id: 'female-5', name: 'Ivy', url: generateAvatarUrl('ivy-matrix'), category: 'female' },
  { id: 'female-6', name: 'Nova', url: generateAvatarUrl('nova-code'), category: 'female' },
  { id: 'female-7', name: 'Cleo', url: generateAvatarUrl('cleo-byte'), category: 'female' },
  { id: 'female-8', name: 'Ruby', url: generateAvatarUrl('ruby-net'), category: 'female' },
  { id: 'female-9', name: 'Sage', url: generateAvatarUrl('sage-sys'), category: 'female' },
  { id: 'female-10', name: 'Echo', url: generateAvatarUrl('echo-root'), category: 'female' },
];

export const getRandomDefaultAvatar = (): DefaultAvatar => {
  return defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
};

export const getDefaultAvatarById = (id: string): DefaultAvatar | undefined => {
  return defaultAvatars.find(avatar => avatar.id === id);
};

export const getMaleAvatars = (): DefaultAvatar[] => {
  return defaultAvatars.filter(avatar => avatar.category === 'male');
};

export const getFemaleAvatars = (): DefaultAvatar[] => {
  return defaultAvatars.filter(avatar => avatar.category === 'female');
};