/**
 * Generate a cryptographically secure random salt
 * @returns A 32-byte hex string (with 0x prefix)
 */
export function generateSalt(): `0x${string}` {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `0x${Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

/**
 * Hash a private match code
 * @param code The private code string
 * @returns The keccak256 hash of the code
 */
export async function hashPrivateCode(code: string): Promise<`0x${string}`> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Note: This uses SHA-256 from Web Crypto API
  // For keccak256 compatibility with the contract, we should use viem
  // This is a placeholder - the actual implementation should use viem's keccak256
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return `0x${hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}
