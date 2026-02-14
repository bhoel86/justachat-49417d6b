/**
 * ╔═ JustAChat™ ════════ Est. Jan 22, 2026 · 1:03 PM ═ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

// Spam detection disabled per owner request.

export interface SpamCheckResult {
  isSpam: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export function detectSpam(_userId: string, _message: string): SpamCheckResult {
  return { isSpam: false, reason: '', severity: 'low' };
}

export function recordSpamStrike(_userId: string): number {
  return 0;
}

export function clearSpamStrikes(_userId: string): void {}
