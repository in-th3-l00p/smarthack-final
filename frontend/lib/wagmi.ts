import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { createStorage } from 'wagmi';

export const wagmiConfig = getDefaultConfig({
  appName: 'SmartHack',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
});


