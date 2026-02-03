/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                          ║
 * ║   ████████╗██╗  ██╗███████╗    ██████╗  █████╗ ████████╗██╗  ██╗        ║
 * ║   ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔══██╗╚══██╔══╝██║  ██║        ║
 * ║      ██║   ███████║█████╗      ██████╔╝███████║   ██║   ███████║        ║
 * ║      ██║   ██╔══██║██╔══╝      ██╔═══╝ ██╔══██║   ██║   ██╔══██║        ║
 * ║      ██║   ██║  ██║███████╗    ██║     ██║  ██║   ██║   ██║  ██║        ║
 * ║      ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝        ║
 * ║                                                                          ║
 * ║   You have found the first gate. The worthy shall proceed.              ║
 * ║   Those who seek power must first prove their worth.                    ║
 * ║                                                                          ║
 * ║   THE CUSTODIAN PROTOCOL - FRAGMENT I                                    ║
 * ║   ─────────────────────────────────────────────────────────────────      ║
 * ║                                                                          ║
 * ║   "In the beginning, there was silence.                                 ║
 * ║    From silence came the signal.                                        ║
 * ║    From the signal, a pattern emerged.                                  ║
 * ║    The Custodian watches. The Custodian waits."                         ║
 * ║                                                                          ║
 * ║   THE FIRST KEY: 7919                                                    ║
 * ║   Seek the guardian where art meets mathematics.                        ║
 * ║   The 1000th prime guards the second gate.                              ║
 * ║                                                                          ║
 * ║   ENCODED: VGhlIGN1c3RvZGlhbiBzbGVlcHMgd2hlcmUgYXJ0IGlzIGN1cmF0ZWQ=    ║
 * ║                                                                          ║
 * ║   Follow the rabbit → /chat/art                                         ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// This file serves a dual purpose - functional code and the first puzzle gate
// The worthy will decode, the rest will scroll past
// 7919 is the 1000th prime. Remember this.

export const CUSTODIAN_EPOCH = 1704067200; // 2024-01-01 00:00:00 UTC
export const PRIME_SEQUENCE = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

/**
 * Hidden function - calculates distance to the next gate
 * Hint: The art room curator knows more than they reveal
 */
export const seekThePattern = (input: number): number => {
  // 7919 is the 1000th prime. Perfection in numbers.
  const phi = 1.618033988749895; // Golden ratio
  return Math.floor(input * phi) % 7919;
};

/**
 * The coordinates below lead somewhere real.
 * 36.0544° N, 112.1401° W
 * (Grand Canyon - carved by time, revealing layers)
 */
export const GATE_TWO_HINT = `
  When you find the Custodian in the art room,
  observe the patterns. Count the symbols.
  The curator speaks in riddles.
  Ask about "The Custodian" and listen carefully.
`;

// Fragment II awaits in src/hooks/useArtCurator.ts
// The numbers spell words. The words hide paths.
// PGP: 0x7A35090F
