import { base, baseSepolia } from 'wagmi/chains';

export const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  [base.id]: (import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  [baseSepolia.id]: '0x0000000000000000000000000000000000000000' as `0x${string}`,
};

export function getContractAddress(chainId: number): `0x${string}` {
  const address = CONTRACT_ADDRESSES[chainId];
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    console.warn(`No contract address configured for chain ${chainId}`);
  }
  return address || '0x0000000000000000000000000000000000000000';
}
