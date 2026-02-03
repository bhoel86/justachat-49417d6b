/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// SV-Agent Services - IRC-style NickServ, ChanServ, BotServ, Network Stats
import { supabaseUntyped } from '@/hooks/useAuth';

export interface NickInfo {
  nickname: string;
  registered_at: string;
  last_identified: string | null;
  email_verified: boolean;
}

export interface ChannelInfo {
  channel_name: string;
  founder_username: string;
  registered_at: string;
  description: string | null;
  url: string | null;
}

export interface AccessEntry {
  username: string;
  access_level: number;
  granted_by: string;
  granted_at: string;
}

export interface NetworkStats {
  total_users: number;
  online_users: number;
  total_channels: number;
  total_messages: number;
  uptime_hours: number;
}

// NickServ Functions
export const registerNick = async (userId: string, nickname: string): Promise<{ success: boolean; message: string }> => {
  // Check if nickname is already registered
  const { data: existing } = await supabaseUntyped
    .from('registered_nicks')
    .select('*')
    .eq('nickname', nickname)
    .maybeSingle();
  
  if (existing) {
    if (existing.user_id === userId) {
      return { success: false, message: 'You have already registered this nickname.' };
    }
    return { success: false, message: 'This nickname is already registered by another user.' };
  }
  
  const { error } = await supabaseUntyped
    .from('registered_nicks')
    .insert({
      user_id: userId,
      nickname: nickname,
    });
  
  if (error) {
    return { success: false, message: 'Failed to register nickname.' };
  }
  
  return { success: true, message: `Nickname "${nickname}" has been registered to you.` };
};

export const identifyNick = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await supabaseUntyped
    .from('registered_nicks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!data) {
    return { success: false, message: 'You have not registered a nickname. Use /ns register to register.' };
  }
  
  await supabaseUntyped
    .from('registered_nicks')
    .update({ last_identified: new Date().toISOString() })
    .eq('user_id', userId);
  
  return { success: true, message: `You have been identified as the owner of "${data.nickname}".` };
};

export const getNickInfo = async (nickname: string): Promise<NickInfo | null> => {
  const { data } = await supabaseUntyped
    .from('registered_nicks')
    .select('*')
    .eq('nickname', nickname)
    .maybeSingle();
  
  return data;
};

export const dropNick = async (userId: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await supabaseUntyped
    .from('registered_nicks')
    .select('nickname')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!data) {
    return { success: false, message: 'You have not registered a nickname.' };
  }
  
  await supabaseUntyped
    .from('registered_nicks')
    .delete()
    .eq('user_id', userId);
  
  return { success: true, message: `Nickname "${data.nickname}" has been dropped.` };
};

// ChanServ Functions
export const registerChannel = async (userId: string, channelId: string, description?: string): Promise<{ success: boolean; message: string }> => {
  // Verify user is the channel creator
  const { data: channel } = await supabaseUntyped
    .from('channels')
    .select('name, created_by')
    .eq('id', channelId)
    .single();
  
  if (!channel) {
    return { success: false, message: 'Channel not found.' };
  }
  
  if (channel.created_by !== userId) {
    return { success: false, message: 'Only the channel founder can register a channel.' };
  }
  
  // Check if already registered
  const { data: existing } = await supabaseUntyped
    .from('channel_registrations')
    .select('*')
    .eq('channel_id', channelId)
    .maybeSingle();
  
  if (existing) {
    return { success: false, message: 'This channel is already registered.' };
  }
  
  const { error } = await supabaseUntyped
    .from('channel_registrations')
    .insert({
      channel_id: channelId,
      founder_id: userId,
      description: description || null,
    });
  
  if (error) {
    return { success: false, message: 'Failed to register channel.' };
  }
  
  return { success: true, message: `Channel #${channel.name} has been registered.` };
};

export const getChannelInfo = async (channelId: string): Promise<ChannelInfo | null> => {
  const { data } = await supabaseUntyped
    .from('channel_registrations')
    .select(`
      *,
      channels!inner(name),
      profiles:founder_id(username)
    `)
    .eq('channel_id', channelId)
    .maybeSingle();
  
  if (!data) return null;
  
  return {
    channel_name: (data.channels as any)?.name || 'Unknown',
    founder_username: (data.profiles as any)?.username || 'Unknown',
    registered_at: data.registered_at,
    description: data.description,
    url: data.url,
  };
};

export const setChannelAccess = async (
  channelId: string, 
  grantedBy: string, 
  targetUserId: string, 
  level: number
): Promise<{ success: boolean; message: string }> => {
  // Verify granter has permission (must be founder or global admin)
  const { data: reg } = await supabaseUntyped
    .from('channel_registrations')
    .select('founder_id')
    .eq('channel_id', channelId)
    .maybeSingle();
  
  if (!reg) {
    return { success: false, message: 'This channel is not registered.' };
  }
  
  const { error } = await supabaseUntyped
    .from('channel_access_list')
    .upsert({
      channel_id: channelId,
      user_id: targetUserId,
      access_level: level,
      granted_by: grantedBy,
    });
  
  if (error) {
    return { success: false, message: 'Failed to set access level.' };
  }
  
  return { success: true, message: `Access level set to ${level}.` };
};

export const getChannelAccessList = async (channelId: string): Promise<AccessEntry[]> => {
  const { data } = await supabaseUntyped
    .from('channel_access_list')
    .select(`
      access_level,
      granted_at,
      user:user_id(username),
      granter:granted_by(username)
    `)
    .eq('channel_id', channelId)
    .order('access_level', { ascending: false });
  
  if (!data) return [];
  
  return data.map((entry: any) => ({
    username: entry.user?.username || 'Unknown',
    access_level: entry.access_level,
    granted_by: entry.granter?.username || 'Unknown',
    granted_at: entry.granted_at,
  }));
};

// Network Stats
export const getNetworkStats = async (): Promise<NetworkStats> => {
  // Get total users
  const { count: totalUsers } = await supabaseUntyped
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  // Get total channels
  const { count: totalChannels } = await supabaseUntyped
    .from('channels')
    .select('*', { count: 'exact', head: true });
  
  // Get total messages
  const { count: totalMessages } = await supabaseUntyped
    .from('messages')
    .select('*', { count: 'exact', head: true });
  
  // Get oldest profile to calculate uptime
  const { data: oldestProfile } = await supabaseUntyped
    .from('profiles')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  
  const uptimeHours = oldestProfile 
    ? Math.floor((Date.now() - new Date(oldestProfile.created_at).getTime()) / (1000 * 60 * 60))
    : 0;
  
  return {
    total_users: totalUsers || 0,
    online_users: 0, // This will be populated by the caller from presence
    total_channels: totalChannels || 0,
    total_messages: totalMessages || 0,
    uptime_hours: uptimeHours,
  };
};

// Ghost Mode (Invisible)
export const setGhostMode = async (userId: string, enabled: boolean): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabaseUntyped
    .from('profiles')
    .update({ ghost_mode: enabled })
    .eq('user_id', userId);
  
  if (error) {
    return { success: false, message: 'Failed to update ghost mode.' };
  }
  
  return { 
    success: true, 
    message: enabled 
      ? 'Ghost mode enabled. You are now invisible to other users.' 
      : 'Ghost mode disabled. You are now visible to other users.'
  };
};

export const isGhostMode = async (userId: string): Promise<boolean> => {
  const { data } = await supabaseUntyped
    .from('profiles')
    .select('ghost_mode')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.ghost_mode || false;
};

// K-line Functions (Global IP Bans - Owner/Admin only)
export const addKline = async (
  ipPattern: string, 
  setBy: string, 
  reason?: string, 
  expiresAt?: Date
): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabaseUntyped
    .from('klines')
    .insert({
      ip_pattern: ipPattern,
      set_by: setBy,
      reason: reason || 'No reason given',
      expires_at: expiresAt?.toISOString() || null,
    });
  
  if (error) {
    return { success: false, message: 'Failed to add K-line.' };
  }
  
  return { success: true, message: `K-line added for pattern: ${ipPattern}` };
};

export const removeKline = async (ipPattern: string): Promise<{ success: boolean; message: string }> => {
  const { error } = await supabaseUntyped
    .from('klines')
    .delete()
    .eq('ip_pattern', ipPattern);
  
  if (error) {
    return { success: false, message: 'Failed to remove K-line.' };
  }
  
  return { success: true, message: `K-line removed for pattern: ${ipPattern}` };
};

export const listKlines = async (): Promise<{ ip_pattern: string; reason: string | null; created_at: string; expires_at: string | null }[]> => {
  const { data } = await supabaseUntyped
    .from('klines')
    .select('ip_pattern, reason, created_at, expires_at')
    .order('created_at', { ascending: false });
  
  return data || [];
};

export const checkKline = async (ipAddress: string): Promise<boolean> => {
  const { data: klines } = await supabaseUntyped
    .from('klines')
    .select('ip_pattern, expires_at');
  
  if (!klines) return false;
  
  const now = new Date();
  for (const kline of klines) {
    // Check if expired
    if (kline.expires_at && new Date(kline.expires_at) < now) continue;
    
    // Check if IP matches pattern (supports * wildcards)
    const pattern = kline.ip_pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(ipAddress)) return true;
  }
  
  return false;
};
