import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

type AuditAction = 
  | 'view_locations'
  | 'view_location_analytics'
  | 'export_locations'
  | 'view_user_location'
  | 'ban_user'
  | 'unban_user'
  | 'mute_user'
  | 'unmute_user'
  | 'change_role'
  | 'kick_user'
  | 'delete_message';

interface AuditLogParams {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Json;
}

export const useAuditLog = () => {
  const { user, isOwner, isAdmin } = useAuth();

  const logAction = useCallback(async ({
    action,
    resourceType,
    resourceId,
    details
  }: AuditLogParams) => {
    // Only log for admins/owners accessing sensitive data
    if (!user || (!isOwner && !isAdmin)) return;

    try {
      // Use edge function to create audit logs (bypasses RLS with service role)
      const { error } = await supabase.functions.invoke('audit-log', {
        body: {
          action,
          resourceType,
          resourceId: resourceId || null,
          details: details || null,
        }
      });

      if (error) {
        console.error('Audit log error:', error);
      }
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }, [user, isOwner, isAdmin]);

  return { logAction };
};
