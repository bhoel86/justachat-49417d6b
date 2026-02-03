/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  detectedLanguageName: string;
}

interface TranslationCache {
  [key: string]: TranslationResult;
}

export const useTranslation = (targetLanguage: string) => {
  const [translating, setTranslating] = useState<Set<string>>(new Set());
  const cacheRef = useRef<TranslationCache>({});

  const translateMessage = useCallback(async (
    messageId: string,
    text: string
  ): Promise<TranslationResult | null> => {
    // Skip if target is English (default, no translation needed for English speakers)
    if (targetLanguage === 'en') {
      return null;
    }

    // Check cache first
    const cacheKey = `${messageId}-${targetLanguage}`;
    if (cacheRef.current[cacheKey]) {
      return cacheRef.current[cacheKey];
    }

    // Skip if already translating this message
    if (translating.has(messageId)) {
      return null;
    }

    // Skip system messages or very short messages
    if (text.length < 3 || text.startsWith('*')) {
      return null;
    }

    setTranslating(prev => new Set(prev).add(messageId));

    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: {
          text,
          targetLanguage
        }
      });

      if (error) {
        console.error('Translation error:', error);
        return null;
      }

      if (data?.translatedText && data.translatedText !== text) {
        const result: TranslationResult = {
          translatedText: data.translatedText,
          detectedLanguage: data.detectedLanguage || 'en',
          detectedLanguageName: data.detectedLanguageName || 'English'
        };
        cacheRef.current[cacheKey] = result;
        return result;
      }

      return null;
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    } finally {
      setTranslating(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  }, [targetLanguage, translating]);

  const isTranslating = useCallback((messageId: string) => {
    return translating.has(messageId);
  }, [translating]);

  const getCachedTranslation = useCallback((messageId: string): TranslationResult | null => {
    const cacheKey = `${messageId}-${targetLanguage}`;
    return cacheRef.current[cacheKey] || null;
  }, [targetLanguage]);

  const clearCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  return {
    translateMessage,
    isTranslating,
    getCachedTranslation,
    clearCache
  };
};
