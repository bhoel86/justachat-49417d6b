/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { supabase } from '@/integrations/supabase/client';

type ModerationAction = 
  | 'ban_user'
  | 'unban_user'
  | 'mute_user'
  | 'unmute_user'
  | 'change_role'
  | 'kick_user'
  | 'delete_message'
  | 'add_kline'
  | 'remove_kline'
  | 'oper_auth'
  | 'kill_user';

interface ModerationLogParams {
  action: ModerationAction;
  moderatorId: string;
  targetUserId?: string;
  targetUsername: string;
  reason?: string;
  details?: Record<string, unknown>;
}

export const logModerationAction = async ({
  action,
  moderatorId,
  targetUserId,
  targetUsername,
  reason,
  details
}: ModerationLogParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: moderatorId,
        action,
        resource_type: 'moderation',
        resource_id: targetUserId || null,
        details: {
          target_username: targetUsername,
          reason,
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
