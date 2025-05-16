import type { ReactNode } from 'react';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config, queryClient } from './lib/wagmiConfig';
import { QueryClientProvider } from '@tanstack/react-query';

// Import RainbowKit styles
import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
}

const Web3Provider = ({ children }: Web3ProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#1a90ff',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system'
          })}
        >
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
};

export default Web3Provider;
