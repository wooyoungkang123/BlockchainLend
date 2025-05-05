import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { QueryClient } from '@tanstack/react-query';

// Environment variables
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '';
const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Create a QueryClient
export const queryClient = new QueryClient();

// RainbowKit and Wagmi configuration
export const config = getDefaultConfig({
  appName: 'Lending Pool dApp',
  projectId,
  ssr: false, // If your dApp uses server-side rendering (SSR)
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`),
  },
}); 