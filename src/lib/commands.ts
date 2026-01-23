import { supabaseUntyped } from '@/hooks/useAuth';
import { logModerationAction } from './moderationAudit';

export interface CommandResult {
  success: boolean;
  message: string;
  isSystemMessage?: boolean;
  broadcast?: boolean;
}

export interface CommandContext {
  userId: string;
  username: string;
  role: 'owner' | 'admin' | 'moderator' | 'user';
  isAdmin: boolean;
  isOwner: boolean;
  channelId?: string;
  channelOwnerId?: string;
  isRoomOwner?: boolean;
  isRoomAdmin?: boolean;
}

type CommandHandler = (
  args: string[],
  context: CommandContext
) => Promise<CommandResult>;

const findUserByUsername = async (username: string) => {
  const { data } = await supabaseUntyped
    .from('profiles')
    .select('user_id, username')
    .ilike('username', username)
    .maybeSingle();
  return data;
};

const getUserRole = async (userId: string) => {
  const { data } = await supabaseUntyped
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role || 'user';
};

const canModerate = (context: CommandContext): boolean => {
  return context.isOwner || context.isAdmin || context.role === 'moderator';
};

// Command implementations
const helpCommand: CommandHandler = async (args, context) => {
  const roomOwnerCommands = (context.isRoomOwner || context.isRoomAdmin) ? `
**Room Owner Commands:**
/roomban <username> [reason] - Ban user from this room
/roomunban <username> - Unban user from room
/roommute <username> [duration] - Mute user in room (e.g., 5m, 1h, 1d)
/roomunmute <username> - Unmute user in room
/roomkick <username> - Kick user from room` : '';

  const modCommands = canModerate(context) ? `
**Moderator Commands:**
/op <username> - Promote user to moderator
/deop <username> - Demote user to regular user
/kick <username> [reason] - Kick user from chat
/ban <username> [reason] - Ban user permanently
/unban <username> - Remove ban
/mute <username> [reason] - Mute user
/unmute <username> - Unmute user
/topic <new topic> - Set channel topic` : '';

  const adminCommands = context.isAdmin ? `
**Admin Commands:**
/admin <username> - Promote user to admin
/deadmin <username> - Demote admin to moderator` : '';

  return {
    success: true,
    message: `**JAC Commands:**
/help - Show this help
/me <action> - Send action message (e.g., /me waves)
/nick <newname> - Change your display name
/pm <username> - Start private encrypted chat
/clear - Clear your chat (local only)
/users - List online users
/whois <username> - View user info
/roomadmin <password> - Become a room admin (if password is set)

**Radio Commands:**
/radio - Start/toggle radio player
/play - Play radio
/pause - Pause radio
/skip - Skip to next station
/nowplaying - Show current song

**Trivia Commands (in #trivia):**
/trivia - Start trivia game
/score - View your trivia stats
/leaderboard - View top players
/skipq - Skip current question${roomOwnerCommands}${modCommands}${adminCommands}`,
    isSystemMessage: true,
  };
};

const meCommand: CommandHandler = async (args, context) => {
  if (args.length === 0) {
    return { success: false, message: 'Usage: /me <action>' };
  }
  const action = args.join(' ');
  return {
    success: true,
    message: `* ${context.username} ${action}`,
    broadcast: true,
  };
};

const nickCommand: CommandHandler = async (args, context) => {
  if (args.length === 0) {
    return { success: false, message: 'Usage: /nick <newname>' };
  }
  
  const newNick = args[0].trim();
  if (newNick.length < 2 || newNick.length > 20) {
    return { success: false, message: 'Username must be 2-20 characters.' };
  }

  // Check if username is taken
  const existing = await findUserByUsername(newNick);
  if (existing && existing.user_id !== context.userId) {
    return { success: false, message: 'That username is already taken.' };
  }

  const { error } = await supabaseUntyped
    .from('profiles')
    .update({ username: newNick })
    .eq('user_id', context.userId);

  if (error) {
    return { success: false, message: 'Failed to change username.' };
  }

  return {
    success: true,
    message: `Your username has been changed to ${newNick}`,
    isSystemMessage: true,
  };
};

const opCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /op <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const targetRole = await getUserRole(targetUser.user_id);
  if (targetRole === 'owner' || targetRole === 'admin') {
    return { success: false, message: 'Cannot change role of admin or owner.' };
  }

  const { error } = await supabaseUntyped
    .from('user_roles')
    .update({ role: 'moderator' })
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to give operator status.' };
  }

  // Log the action
  await logModerationAction({
    action: 'change_role',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { previous_role: targetRole, new_role: 'moderator' }
  });

  return {
    success: true,
    message: `${targetUser.username} has been given moderator status.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const deopCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /deop <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const targetRole = await getUserRole(targetUser.user_id);
  if (targetRole === 'owner') {
    return { success: false, message: 'Cannot change role of owner.' };
  }
  if (targetRole === 'admin' && !context.isOwner) {
    return { success: false, message: 'Only the owner can demote admins.' };
  }

  const { error } = await supabaseUntyped
    .from('user_roles')
    .update({ role: 'user' })
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to remove operator status.' };
  }

  // Log the action
  await logModerationAction({
    action: 'change_role',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { previous_role: targetRole, new_role: 'user' }
  });

  return {
    success: true,
    message: `${targetUser.username} has been demoted to user.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const adminCommand: CommandHandler = async (args, context) => {
  if (!context.isOwner) {
    return { success: false, message: 'Only the owner can promote admins.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /admin <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const previousRole = await getUserRole(targetUser.user_id);

  const { error } = await supabaseUntyped
    .from('user_roles')
    .update({ role: 'admin' })
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to give admin status.' };
  }

  // Log the action
  await logModerationAction({
    action: 'change_role',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { previous_role: previousRole, new_role: 'admin' }
  });

  return {
    success: true,
    message: `${targetUser.username} has been promoted to admin.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const deadminCommand: CommandHandler = async (args, context) => {
  if (!context.isOwner) {
    return { success: false, message: 'Only the owner can demote admins.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /deadmin <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const targetRole = await getUserRole(targetUser.user_id);
  if (targetRole !== 'admin') {
    return { success: false, message: 'User is not an admin.' };
  }

  const { error } = await supabaseUntyped
    .from('user_roles')
    .update({ role: 'moderator' })
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to demote admin.' };
  }

  // Log the action
  await logModerationAction({
    action: 'change_role',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { previous_role: 'admin', new_role: 'moderator' }
  });

  return {
    success: true,
    message: `${targetUser.username} has been demoted to moderator.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const kickCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /kick <username> [reason]' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const targetRole = await getUserRole(targetUser.user_id);
  if (targetRole === 'owner' || (targetRole === 'admin' && !context.isOwner)) {
    return { success: false, message: 'Cannot kick this user.' };
  }

  const reason = args.slice(1).join(' ') || 'No reason given';

  // Log the action
  await logModerationAction({
    action: 'kick_user',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { reason }
  });

  return {
    success: true,
    message: `${targetUser.username} has been kicked by ${context.username}. Reason: ${reason}`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const banCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /ban <username> [reason]' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const targetRole = await getUserRole(targetUser.user_id);
  if (targetRole === 'owner' || (targetRole === 'admin' && !context.isOwner)) {
    return { success: false, message: 'Cannot ban this user.' };
  }

  const reason = args.slice(1).join(' ') || 'No reason given';

  const { error } = await supabaseUntyped
    .from('bans')
    .upsert({
      user_id: targetUser.user_id,
      banned_by: context.userId,
      reason,
    });

  if (error) {
    return { success: false, message: 'Failed to ban user.' };
  }

  // Log the action
  await logModerationAction({
    action: 'ban_user',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { reason }
  });

  return {
    success: true,
    message: `${targetUser.username} has been banned by ${context.username}. Reason: ${reason}`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const unbanCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /unban <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const { error } = await supabaseUntyped
    .from('bans')
    .delete()
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to unban user.' };
  }

  // Log the action
  await logModerationAction({
    action: 'unban_user',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
  });

  return {
    success: true,
    message: `${targetUser.username} has been unbanned.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const muteCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /mute <username> [reason]' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const reason = args.slice(1).join(' ') || 'No reason given';

  const { error } = await supabaseUntyped
    .from('mutes')
    .upsert({
      user_id: targetUser.user_id,
      muted_by: context.userId,
      reason,
    });

  if (error) {
    return { success: false, message: 'Failed to mute user.' };
  }

  // Log the action
  await logModerationAction({
    action: 'mute_user',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
    details: { reason }
  });

  return {
    success: true,
    message: `${targetUser.username} has been muted. Reason: ${reason}`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const unmuteCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /unmute <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const { error } = await supabaseUntyped
    .from('mutes')
    .delete()
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to unmute user.' };
  }

  // Log the action
  await logModerationAction({
    action: 'unmute_user',
    moderatorId: context.userId,
    targetUserId: targetUser.user_id,
    targetUsername: targetUser.username,
  });

  return {
    success: true,
    message: `${targetUser.username} has been unmuted.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const topicCommand: CommandHandler = async (args, context) => {
  if (!canModerate(context)) {
    return { success: false, message: 'You need moderator privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /topic <new topic>' };
  }

  const newTopic = args.join(' ').slice(0, 200); // Limit topic length

  const { error } = await supabaseUntyped
    .from('channel_settings')
    .update({ 
      topic: newTopic,
      updated_by: context.userId,
      updated_at: new Date().toISOString()
    })
    .eq('channel_name', 'general');

  if (error) {
    return { success: false, message: 'Failed to update topic.' };
  }

  return {
    success: true,
    message: `${context.username} changed the topic to: ${newTopic}`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const whoisCommand: CommandHandler = async (args, context) => {
  if (args.length === 0) {
    return { success: false, message: 'Usage: /whois <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const role = await getUserRole(targetUser.user_id);
  
  // Check ban/mute status
  const { data: ban } = await supabaseUntyped
    .from('bans')
    .select('*')
    .eq('user_id', targetUser.user_id)
    .maybeSingle();
  
  const { data: mute } = await supabaseUntyped
    .from('mutes')
    .select('*')
    .eq('user_id', targetUser.user_id)
    .maybeSingle();

  let status = '';
  if (ban) status += ' [BANNED]';
  if (mute) status += ' [MUTED]';

  return {
    success: true,
    message: `**User Info: ${targetUser.username}**
Role: ${role}${status}`,
    isSystemMessage: true,
  };
};

// PM command - returns special result that signals to open PM modal
const pmCommand: CommandHandler = async (args, context) => {
  if (args.length === 0) {
    return { success: false, message: 'Usage: /pm <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  if (targetUser.user_id === context.userId) {
    return { success: false, message: "You can't send a private message to yourself." };
  }

  // Return special format that ChatRoom can detect
  return {
    success: true,
    message: `PM_REQUEST:${targetUser.user_id}:${targetUser.username}`,
    isSystemMessage: false,
  };
};

// Radio command handlers - these return special tokens that ChatRoom will interpret
const radioCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'RADIO_COMMAND:toggle',
    isSystemMessage: false,
  };
};

const playCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'RADIO_COMMAND:play',
    isSystemMessage: false,
  };
};

const pauseCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'RADIO_COMMAND:pause',
    isSystemMessage: false,
  };
};

const skipCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'RADIO_COMMAND:skip',
    isSystemMessage: false,
  };
};

const nowPlayingCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'RADIO_COMMAND:nowplaying',
    isSystemMessage: false,
  };
};

// Trivia commands - return special tokens that ChatRoom will interpret
const triviaCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'TRIVIA_COMMAND:start',
    isSystemMessage: false,
  };
};

const scoreCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'TRIVIA_COMMAND:score',
    isSystemMessage: false,
  };
};

const leaderboardCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'TRIVIA_COMMAND:leaderboard',
    isSystemMessage: false,
  };
};

const skipQuestionCommand: CommandHandler = async () => {
  return {
    success: true,
    message: 'TRIVIA_COMMAND:skip',
    isSystemMessage: false,
  };
};

// Room-specific moderation commands
const canRoomModerate = (context: CommandContext): boolean => {
  return context.isRoomOwner || context.isRoomAdmin || context.isOwner || context.isAdmin;
};

const roombanCommand: CommandHandler = async (args, context) => {
  if (!canRoomModerate(context)) {
    return { success: false, message: 'You need room owner/admin privileges to use this command.' };
  }
  if (!context.channelId) {
    return { success: false, message: 'Cannot determine current channel.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /roomban <username> [reason]' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  if (targetUser.user_id === context.channelOwnerId) {
    return { success: false, message: 'Cannot ban the room owner.' };
  }

  const reason = args.slice(1).join(' ') || 'No reason given';

  const { error } = await supabaseUntyped
    .from('room_bans')
    .upsert({
      channel_id: context.channelId,
      user_id: targetUser.user_id,
      banned_by: context.userId,
      reason,
    });

  if (error) {
    return { success: false, message: 'Failed to ban user from room.' };
  }

  return {
    success: true,
    message: `${targetUser.username} has been banned from this room. Reason: ${reason}`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const roomunbanCommand: CommandHandler = async (args, context) => {
  if (!canRoomModerate(context)) {
    return { success: false, message: 'You need room owner/admin privileges to use this command.' };
  }
  if (!context.channelId) {
    return { success: false, message: 'Cannot determine current channel.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /roomunban <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const { error } = await supabaseUntyped
    .from('room_bans')
    .delete()
    .eq('channel_id', context.channelId)
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to unban user from room.' };
  }

  return {
    success: true,
    message: `${targetUser.username} has been unbanned from this room.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const roommuteCommand: CommandHandler = async (args, context) => {
  if (!canRoomModerate(context)) {
    return { success: false, message: 'You need room owner/admin privileges to use this command.' };
  }
  if (!context.channelId) {
    return { success: false, message: 'Cannot determine current channel.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /roommute <username> [duration: 5m/30m/1h/1d]' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  if (targetUser.user_id === context.channelOwnerId) {
    return { success: false, message: 'Cannot mute the room owner.' };
  }

  // Parse duration
  let expiresAt: Date | null = null;
  const durationArg = args[1];
  if (durationArg) {
    const match = durationArg.match(/^(\d+)(m|h|d)$/);
    if (match) {
      const amount = parseInt(match[1]);
      const unit = match[2];
      expiresAt = new Date();
      if (unit === 'm') expiresAt.setMinutes(expiresAt.getMinutes() + amount);
      else if (unit === 'h') expiresAt.setHours(expiresAt.getHours() + amount);
      else if (unit === 'd') expiresAt.setDate(expiresAt.getDate() + amount);
    }
  }

  const { error } = await supabaseUntyped
    .from('room_mutes')
    .upsert({
      channel_id: context.channelId,
      user_id: targetUser.user_id,
      muted_by: context.userId,
      expires_at: expiresAt?.toISOString() || null,
    });

  if (error) {
    return { success: false, message: 'Failed to mute user in room.' };
  }

  const durationText = expiresAt ? ` for ${durationArg}` : ' indefinitely';
  return {
    success: true,
    message: `${targetUser.username} has been muted in this room${durationText}.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const roomunmuteCommand: CommandHandler = async (args, context) => {
  if (!canRoomModerate(context)) {
    return { success: false, message: 'You need room owner/admin privileges to use this command.' };
  }
  if (!context.channelId) {
    return { success: false, message: 'Cannot determine current channel.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /roomunmute <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  const { error } = await supabaseUntyped
    .from('room_mutes')
    .delete()
    .eq('channel_id', context.channelId)
    .eq('user_id', targetUser.user_id);

  if (error) {
    return { success: false, message: 'Failed to unmute user in room.' };
  }

  return {
    success: true,
    message: `${targetUser.username} has been unmuted in this room.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const roomkickCommand: CommandHandler = async (args, context) => {
  if (!canRoomModerate(context)) {
    return { success: false, message: 'You need room owner/admin privileges to use this command.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /roomkick <username>' };
  }

  const targetUser = await findUserByUsername(args[0]);
  if (!targetUser) {
    return { success: false, message: `User "${args[0]}" not found.` };
  }

  if (targetUser.user_id === context.channelOwnerId) {
    return { success: false, message: 'Cannot kick the room owner.' };
  }

  return {
    success: true,
    message: `${targetUser.username} has been kicked from this room by ${context.username}.`,
    isSystemMessage: true,
    broadcast: true,
  };
};

const roomadminCommand: CommandHandler = async (args, context) => {
  if (!context.channelId) {
    return { success: false, message: 'Cannot determine current channel.' };
  }
  if (args.length === 0) {
    return { success: false, message: 'Usage: /roomadmin <password>' };
  }

  const password = args.join(' ');
  
  // Get the room's admin password
  const { data: channel } = await supabaseUntyped
    .from('channels')
    .select('admin_password')
    .eq('id', context.channelId)
    .single();
  
  if (!channel?.admin_password) {
    return { success: false, message: 'This room does not have an admin password set.' };
  }
  
  if (password !== channel.admin_password) {
    return { success: false, message: 'Incorrect password.' };
  }
  
  // Grant room admin
  const { error } = await supabaseUntyped
    .from('room_admins')
    .upsert({
      channel_id: context.channelId,
      user_id: context.userId,
      granted_by: context.userId,
    });
  
  if (error) {
    return { success: false, message: 'Failed to grant room admin.' };
  }
  
  return {
    success: true,
    message: `You are now a room admin. You can use /roomban, /roommute, /roomkick commands.`,
    isSystemMessage: true,
  };
};

// Command registry
const commands: Record<string, CommandHandler> = {
  help: helpCommand,
  me: meCommand,
  nick: nickCommand,
  pm: pmCommand,
  msg: pmCommand, // Alias
  op: opCommand,
  deop: deopCommand,
  admin: adminCommand,
  deadmin: deadminCommand,
  kick: kickCommand,
  ban: banCommand,
  unban: unbanCommand,
  mute: muteCommand,
  unmute: unmuteCommand,
  topic: topicCommand,
  whois: whoisCommand,
  // Room-specific moderation
  roomban: roombanCommand,
  roomunban: roomunbanCommand,
  roommute: roommuteCommand,
  roomunmute: roomunmuteCommand,
  roomkick: roomkickCommand,
  roomadmin: roomadminCommand,
  // Radio commands
  radio: radioCommand,
  play: playCommand,
  pause: pauseCommand,
  skip: skipCommand,
  nowplaying: nowPlayingCommand,
  np: nowPlayingCommand, // Alias
  // Trivia commands
  trivia: triviaCommand,
  score: scoreCommand,
  leaderboard: leaderboardCommand,
  lb: leaderboardCommand, // Alias
  skipq: skipQuestionCommand,
};

export const parseCommand = (input: string): { command: string; args: string[] } | null => {
  if (!input.startsWith('/')) return null;
  
  const parts = input.slice(1).split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  return { command, args };
};

export const executeCommand = async (
  command: string,
  args: string[],
  context: CommandContext
): Promise<CommandResult> => {
  const handler = commands[command];
  
  if (!handler) {
    return {
      success: false,
      message: `Unknown command: /${command}. Type /help for available commands.`,
    };
  }
  
  return handler(args, context);
};

export const isCommand = (input: string): boolean => {
  return input.startsWith('/');
};
