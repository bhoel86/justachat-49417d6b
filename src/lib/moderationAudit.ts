import { supabase } from '@/integrations/supabase/client';

type ModerationAction = 
  | 'ban_user'
  | 'unban_user'
  | 'mute_user'
  | 'unmute_user'
  | 'change_role'
  | 'kick_user'
  | 'delete_message';

interface ModerationLogParams {
  action: ModerationAction;
  moderatorId: string;
  targetUserId: string;
  targetUsername: string;
  details?: Record<string, unknown>;
}

export const logModerationAction = async ({
  action,
  moderatorId,
  targetUserId,
  targetUsername,
  details
}: ModerationLogParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: moderatorId,
        action,
        resource_type: 'moderation',
        resource_id: targetUserId,
        details: {
          target_username: targetUsername,
          ...details
        } as unknown as null, // Type workaround
      }]);

    if (error) {
      console.error('Failed to log moderation action:', error);
    }
  } catch (err) {
    console.error('Moderation audit log error:', err);
  }
};
