import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig(
  getDefaultConfig({
    chains: [base, baseSepolia],
    transports: {
      [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
      [baseSepolia.id]: http('https://sepolia.base.org'),
    },
    walletConnectProjectId,
    appName: 'BaseRPS',
    appDescription: 'Battle for ETH - PvP Rock Paper Scissors on Base',
    appUrl: 'https://baserps.xyz',
    appIcon: 'https://baserps.xyz/logo.png',
  })
);

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
