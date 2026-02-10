/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BotSettings {
  enabled: boolean;
  allowed_channels: string[];
  moderator_bots_enabled: boolean;
  chat_speed: number;
}

/**
 * Shared hook for bot_settings — single subscription used by
 * both MemberList and useChatBots so we don't open two channels.
 */
export const useBotSettings = () => {
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('enabled, allowed_channels, moderator_bots_enabled, chat_speed')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setBotSettings(data as BotSettings);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel('bot-settings-shared')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bot_settings' },
        (payload) => {
          setBotSettings(payload.new as BotSettings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return botSettings;
};
