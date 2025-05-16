import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectButton } from '../ConnectButton';

// Mock RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: any }) => children({
      account: null,
      chain: null,
      openConnectModal: jest.fn(),
      openChainModal: jest.fn(),
      openAccountModal: jest.fn(),
      authenticationStatus: 'unauthenticated',
      mounted: true,
    }),
  },
}));

describe('ConnectButton', () => {
  it('renders connect button when not connected', () => {
    render(<ConnectButton />);
    
    // Should display "Connect Wallet" text
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('calls openConnectModal when button is clicked', () => {
    const mockOpenConnectModal = jest.fn();
    
    // Override the mock to return our mock function
    jest.mock('@rainbow-me/rainbowkit', () => ({
      ConnectButton: {
        Custom: ({ children }: { children: any }) => children({
          account: null,
          chain: null,
          openConnectModal: mockOpenConnectModal,
          openChainModal: jest.fn(),
          openAccountModal: jest.fn(),
          authenticationStatus: 'unauthenticated',
          mounted: true,
        }),
      },
    }), { virtual: true });
    
    render(<ConnectButton />);
    
    // Click the connect button
    fireEvent.click(screen.getByText('Connect Wallet'));
    
    // Should call the openConnectModal function
    expect(mockOpenConnectModal).toHaveBeenCalled();
  });

  it('renders account info when connected', () => {
    // Override the mock to simulate connected state
    jest.mock('@rainbow-me/rainbowkit', () => ({
      ConnectButton: {
        Custom: ({ children }: { children: any }) => children({
          account: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: '0x1234...7890',
            balanceDecimals: 18,
            balanceFormatted: '1.5',
            balanceSymbol: 'ETH',
            displayBalance: '1.5 ETH',
          },
          chain: {
            id: 1,
            name: 'Ethereum',
            unsupported: false,
            hasIcon: true,
            iconUrl: 'https://example.com/eth.png',
            iconBackground: '#fff',
          },
          openConnectModal: jest.fn(),
          openChainModal: jest.fn(),
          openAccountModal: jest.fn(),
          authenticationStatus: 'authenticated',
          mounted: true,
        }),
      },
    }), { virtual: true });
    
    render(<ConnectButton />);
    
    // Should display the account display name
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    
    // Should display the chain name
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });
}); 