import { keccak256, encodePacked, toBytes } from 'viem';
import type { Choice } from '@/config/constants';

/**
 * Generate commit hash from choice and salt
 * @param choice The player's choice (1 = Rock, 2 = Paper, 3 = Scissors)
 * @param salt Random 32-byte salt
 * @returns The keccak256 hash
 */
export function generateCommitHash(
  choice: Choice,
  salt: `0x${string}`
): `0x${string}` {
  return keccak256(encodePacked(['uint8', 'bytes32'], [choice, salt]));
}

/**
 * Hash a private match code for creating private matches
 * @param code The private code string
 * @returns The keccak256 hash
 */
export function hashPrivateCode(code: string): `0x${string}` {
  return keccak256(toBytes(code));
}

/**
 * Verify that a commit hash matches the choice and salt
 * @param commitHash The original commit hash
 * @param choice The choice to verify
 * @param salt The salt to verify
 * @returns Whether the commit is valid
 */
export function verifyCommit(
  commitHash: `0x${string}`,
  choice: Choice,
  salt: `0x${string}`
): boolean {
  return generateCommitHash(choice, salt) === commitHash;
}
