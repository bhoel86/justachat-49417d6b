/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChannelModerationSettings, DEFAULT_MODERATION_SETTINGS } from '@/lib/contentModeration';

interface UseChannelModerationSettingsResult {
  settings: ChannelModerationSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<ChannelModerationSettings>) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export const useChannelModerationSettings = (channelId: string | null): UseChannelModerationSettingsResult => {
  const [settings, setSettings] = useState<ChannelModerationSettings>(DEFAULT_MODERATION_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!channelId) {
      setSettings(DEFAULT_MODERATION_SETTINGS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('channel_moderation_settings')
        .select('url_filter_enabled, profanity_filter_enabled, link_preview_enabled')
        .eq('channel_id', channelId)
        .maybeSingle();

      if (error) {
        console.error('[useChannelModerationSettings] Error fetching settings:', error);
        setSettings(DEFAULT_MODERATION_SETTINGS);
      } else if (data) {
        setSettings({
          url_filter_enabled: data.url_filter_enabled,
          profanity_filter_enabled: data.profanity_filter_enabled,
          link_preview_enabled: data.link_preview_enabled
        });
      } else {
        // No settings exist for this channel, use defaults
        setSettings(DEFAULT_MODERATION_SETTINGS);
      }
    } catch (err) {
      console.error('[useChannelModerationSettings] Exception:', err);
      setSettings(DEFAULT_MODERATION_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<ChannelModerationSettings>): Promise<boolean> => {
    if (!channelId) return false;

    const updatedSettings = { ...settings, ...newSettings };

    try {
      // Try to upsert the settings
      const { error } = await supabase
        .from('channel_moderation_settings')
        .upsert({
          channel_id: channelId,
          url_filter_enabled: updatedSettings.url_filter_enabled,
          profanity_filter_enabled: updatedSettings.profanity_filter_enabled,
          link_preview_enabled: updatedSettings.link_preview_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'channel_id'
        });

      if (error) {
        console.error('[useChannelModerationSettings] Error updating settings:', error);
        return false;
      }

      setSettings(updatedSettings);
      return true;
    } catch (err) {
      console.error('[useChannelModerationSettings] Exception updating:', err);
      return false;
    }
  }, [channelId, settings]);

  return {
    settings,
    loading,
    updateSettings,
    refetch: fetchSettings
  };
};
