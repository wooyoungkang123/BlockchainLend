import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, hardhat } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Create a new QueryClient instance
export const queryClient = new QueryClient();

// Set up RainbowKit and Wagmi config
export const config = getDefaultConfig({
  appName: 'DeFi Lending Platform',
  projectId: 'a7b790a0273bd7f2d7c6f2cde7abe00a', // Example project ID - this is a placeholder
  chains: [
    hardhat,
    sepolia,
    mainnet,
  ],
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  ssr: false, // We don't need server-side rendering for this app
}); 