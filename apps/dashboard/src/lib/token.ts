import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token (hex string).
 * Suitable for magic links, password reset tokens, etc.
 * @param lengthBytes Number of bytes of entropy (default 32, results in 64 char string)
 */
export function generateToken(lengthBytes: number = 32): string {
  return crypto.randomBytes(lengthBytes).toString('hex');
}

/**
 * Generates a URL-safe random string (Base64URL).
 * @param lengthBytes Number of bytes of entropy
 */
export function generateUrlSafeToken(lengthBytes: number = 32): string {
  return crypto.randomBytes(lengthBytes).toString('base64url');
}

/**
 * Generates a shorter numeric code (e.g. for email OTP).
 * @param length Length of the numeric code (default 6)
 */
export function generateNumericCode(length: number = 6): string {
  let code = '';
  // crypto.randomInt is available in Node.js 14.10+
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}
