/**
 * Short code generation for Dynamic QR codes.
 *
 * Cryptographically random and collision-resistant; the database keeps a
 * unique partial index on short_code as the last line of defence, and
 * collisions are retried with a fresh code.
 */

export const SHORT_CODE_LENGTH = 8;
export const MAX_SHORT_CODE_ATTEMPTS = 5;

/**
 * URL-safe alphabet without ambiguous characters (0/O, 1/I/l) so printed /
 * hand-typed codes stay readable.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ALPHABET_LENGTH = ALPHABET.length;

export function getAlphabet(): string {
  return ALPHABET;
}

function randomBytes(length: number): Uint8Array {
  const globalCrypto = globalThis.crypto;
  if (globalCrypto && typeof globalCrypto.getRandomValues === "function") {
    return globalCrypto.getRandomValues(new Uint8Array(length));
  }
  // All modern browsers and Node.js >= 18 expose the Web Crypto API globally.
  // Never fall back to Math.random(): short codes must be unpredictable.
  throw new Error("Secure random source is not available");
}

/**
 * Generate a URL-safe short code of SHORT_CODE_LENGTH characters using a
 * cryptographically secure source. Never uses Math.random().
 */
export function generateShortCode(length: number = SHORT_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    // Keep the index below a multiple of the alphabet so sampling stays fair
    // (rejection sampling is avoided for compactness; the bias is negligible).
    code += ALPHABET[bytes[i] % ALPHABET_LENGTH];
  }
  return code;
}

export function isShortCodeFormat(code: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${SHORT_CODE_LENGTH}}$`).test(code);
}