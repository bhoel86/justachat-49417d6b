/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useCallback } from 'react';

const MAX_HISTORY = 5;

export const useInputHistory = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  const addToHistory = useCallback((input: string) => {
    if (!input.trim()) return;
    
    setHistory(prev => {
      // Don't add duplicates of the last entry
      if (prev[0] === input) return prev;
      
      const newHistory = [input, ...prev].slice(0, MAX_HISTORY);
      return newHistory;
    });
    setHistoryIndex(-1);
    setSavedInput('');
  }, []);

  const navigateHistory = useCallback((
    direction: 'up' | 'down',
    currentInput: string
  ): string | null => {
    if (history.length === 0) return null;

    if (direction === 'up') {
      // Save current input when first pressing up
      if (historyIndex === -1) {
        setSavedInput(currentInput);
      }
      
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      if (newIndex !== historyIndex) {
        setHistoryIndex(newIndex);
        return history[newIndex];
      }
    } else if (direction === 'down') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        return history[newIndex];
      } else if (historyIndex === 0) {
        // Return to saved input
        setHistoryIndex(-1);
        return savedInput;
      }
    }
    
    return null;
  }, [history, historyIndex, savedInput]);

  const resetHistoryNavigation = useCallback(() => {
    setHistoryIndex(-1);
    setSavedInput('');
  }, []);

  return {
    addToHistory,
    navigateHistory,
    resetHistoryNavigation,
    historyIndex,
    historyLength: history.length,
  };
};
