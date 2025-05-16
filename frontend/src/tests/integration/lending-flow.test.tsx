import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../../App';

// Mock all hooks and components
jest.mock('../../hooks/useWalletData', () => {
  const mockData = {
    collateral: '0',
    borrow: '0',
    ethPrice: 200000000, // $2000 with 8 decimals
    tokenBalance: '1000',
  };
  
  return {
    useWalletData: () => ({
      walletData: mockData,
      updateCollateral: jest.fn((value) => {
        mockData.collateral = value;
      }),
      updateBorrow: jest.fn((value) => {
        mockData.borrow = value;
      }),
      updateEthPrice: jest.fn((value) => {
        mockData.ethPrice = value;
      }),
      updateTokenBalance: jest.fn((value) => {
        mockData.tokenBalance = value;
      }),
    }),
  };
});

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useChainId: () => 1, // Ethereum mainnet
}));

// Mock RainbowKit
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: any }) => children({
      account: {
        address: '0x1234567890123456789012345678901234567890',
        displayName: '0x1234...7890',
      },
      chain: {
        id: 1,
        name: 'Ethereum',
        unsupported: false,
      },
      openConnectModal: jest.fn(),
      openChainModal: jest.fn(),
      openAccountModal: jest.fn(),
      authenticationStatus: 'authenticated',
      mounted: true,
    }),
  },
}));

describe('Lending-Borrowing Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('Complete lending-borrowing flow', async () => {
    render(<App />);
    
    // Wait for the dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Market Overview')).toBeInTheDocument();
    });
    
    // 1. First test deposit functionality
    const depositForm = screen.getByTestId('deposit-form');
    const depositInput = within(depositForm).getByRole('spinbutton') as HTMLInputElement;
    const depositButton = within(depositForm).getByText('Deposit ETH');
    
    // Enter deposit amount and submit
    fireEvent.change(depositInput, { target: { value: '5' } });
    fireEvent.click(depositButton);
    
    // Wait for deposit to complete
    await waitFor(() => {
      expect(screen.getByText('Collateral Supplied')).toBeInTheDocument();
      // Should now show 5 ETH
      expect(screen.getByText('5 ETH')).toBeInTheDocument();
    });
    
    // 2. Test borrow functionality
    const borrowForm = screen.getByTestId('borrow-form');
    const borrowInput = within(borrowForm).getByRole('spinbutton') as HTMLInputElement;
    const borrowButton = within(borrowForm).getByText('Borrow USDC');
    
    // Enter borrow amount and submit
    fireEvent.change(borrowInput, { target: { value: '5000' } });
    fireEvent.click(borrowButton);
    
    // Should fail due to insufficient collateral
    await waitFor(() => {
      expect(screen.getByText('Insufficient collateral')).toBeInTheDocument();
    });
    
    // Try with a valid amount
    fireEvent.change(borrowInput, { target: { value: '2000' } });
    fireEvent.click(borrowButton);
    
    // Wait for borrow to complete
    await waitFor(() => {
      expect(screen.getByText('Borrowed Amount')).toBeInTheDocument();
      // Should now show 2000 USDC
      expect(screen.getByText('2000 USDC')).toBeInTheDocument();
    });
    
    // 3. Test ETH price simulator
    const priceInput = screen.getByTestId('eth-price-input') as HTMLInputElement;
    const updatePriceButton = screen.getByText('Update');
    
    // Lower ETH price to trigger health factor warning
    fireEvent.change(priceInput, { target: { value: '1000' } });
    fireEvent.click(updatePriceButton);
    
    // Wait for health factor to update
    await waitFor(() => {
      // Health factor should be in "At Risk" state now
      expect(screen.getByText('At Risk')).toBeInTheDocument();
    });
    
    // 4. Test repay functionality
    const repayForm = screen.getByTestId('repay-form');
    const repayInput = within(repayForm).getByRole('spinbutton') as HTMLInputElement;
    const repayButton = within(repayForm).getByText('Repay USDC');
    
    // Enter repay amount and submit
    fireEvent.change(repayInput, { target: { value: '1000' } });
    fireEvent.click(repayButton);
    
    // Wait for repay to complete
    await waitFor(() => {
      // Borrowed amount should now be 1000 USDC
      expect(screen.getByText('1000 USDC')).toBeInTheDocument();
      // Health factor should improve
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });
    
    // 5. Test ETH price simulator again - increase price
    fireEvent.change(priceInput, { target: { value: '3000' } });
    fireEvent.click(updatePriceButton);
    
    // Wait for health factor to update
    await waitFor(() => {
      // Health factor should be in "Safe" state now
      expect(screen.getByText('Safe')).toBeInTheDocument();
    });
    
    // 6. Test withdraw functionality
    const withdrawForm = screen.getByTestId('withdraw-form');
    const withdrawInput = within(withdrawForm).getByRole('spinbutton') as HTMLInputElement;
    const withdrawButton = within(withdrawForm).getByText('Withdraw ETH');
    
    // Try to withdraw too much
    fireEvent.change(withdrawInput, { target: { value: '4.9' } });
    fireEvent.click(withdrawButton);
    
    // Should fail due to risk to position
    await waitFor(() => {
      expect(screen.getByText('Withdrawal would put position at risk')).toBeInTheDocument();
    });
    
    // Withdraw a safe amount
    fireEvent.change(withdrawInput, { target: { value: '1' } });
    fireEvent.click(withdrawButton);
    
    // Wait for withdraw to complete
    await waitFor(() => {
      // Collateral should now be 4 ETH
      expect(screen.getByText('4 ETH')).toBeInTheDocument();
    });
  });
}); 