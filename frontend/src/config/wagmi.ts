import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from 'connectkit';
import { Attribution } from 'ox/erc8021';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Get Builder Code from base.dev > Settings > Builder Code
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_zvg8e7hy'],
});

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
    dataSuffix: DATA_SUFFIX,
  })
);

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
