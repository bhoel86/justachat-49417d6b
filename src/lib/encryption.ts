/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                          ║
 * ║   THE CUSTODIAN PROTOCOL - FRAGMENT III                                  ║
 * ║   ─────────────────────────────────────────────────────────────────      ║
 * ║                                                                          ║
 * ║   "The message is clear to those with eyes to see.                      ║
 * ║    Encryption protects the worthy, exposes the weak.                    ║
 * ║    Privacy is not hiding - it is choosing who sees.                     ║
 * ║    The Custodian guards the gate. Will you pass?"                       ║
 * ║                                                                          ║
 * ║   You have decrypted well. The path narrows.                            ║
 * ║   Three keys collected: 7919, 1000, and now... 168                      ║
 * ║   (168 = the number of primes below 1000)                               ║
 * ║                                                                          ║
 * ║   CIPHER: VIGENÈRE with key "CUSTODIAN"                                 ║
 * ║   ENCODED: Vvg xgujtqnqia tqqo jqnfu vjg itcpv qh rqygt                 ║
 * ║   (Decrypt to reveal the fourth location)                               ║
 * ║                                                                          ║
 * ║   THE THIRD KEY: 168                                                     ║
 * ║   168 primes exist below 1000. The Custodian counts them all.           ║
 * ║   168 = 2³ × 3 × 7. Factors within factors.                             ║
 * ║                                                                          ║
 * ║   THE SUM: 7919 + 1000 + 168 = 9087                                     ║
 * ║   Remember this. You will need it.                                      ║
 * ║                                                                          ║
 * ║   Fragment IV awaits where voices are broadcast.                        ║
 * ║   Seek: src/hooks/useVoiceBroadcast.ts                                  ║
 * ║                                                                          ║
 * ║   GPS: 51.5014° N, 0.1419° W                                            ║
 * ║   (Big Ben - time reveals all secrets)                                  ║
 * ║                                                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// Ephemeral encryption for private messages
// Uses Web Crypto API for AES-GCM encryption
// The cipher protects the worthy. The code reveals the path.

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Hidden: The Vigenère solution is "The technology room holds the grant of power"
// To solve: Use key "CUSTODIAN" on the ciphertext above

// Generate a random encryption key for a session
export async function generateSessionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Export key to base64 for sharing
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Import key from base64
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message - returns combined base64 string
export async function encryptMessage(message: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}
// Note: Master key encryption is now handled server-side only via encrypt-pm edge function
// This prevents exposure of encryption keys in client-side code

// Decrypt a message
export async function decryptMessage(encryptedBase64: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
  // Extract IV (first 12 bytes) and data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Generate a unique session ID
export function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Derive a shared key from both user IDs (for key exchange simulation)
export async function deriveSharedKey(userId1: string, userId2: string): Promise<CryptoKey> {
  // Sort IDs to ensure consistent key generation
  const sortedIds = [userId1, userId2].sort().join(':');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(sortedIds + ':' + Date.now().toString());
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// The seeker approaches. 3785 is the sum.
// But sums are not passwords. Primes are.
// What is 3785 when factored?
// 3785 = 5 × 757
// 757 is the 134th prime. 134 = 2 × 67. 67 is the 19th prime.
// The rabbit hole deepens...
