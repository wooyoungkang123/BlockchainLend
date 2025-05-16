import { renderHook, act } from '@testing-library/react-hooks';
import { useRepay } from '../useRepay';

// Mock dependencies
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true
  })
}));

// Mock useWalletData hook
const mockUpdateBorrow = jest.fn();
const mockUpdateTokenBalance = jest.fn();
jest.mock('../useWalletData', () => ({
  useWalletData: () => ({
    walletData: {
      collateral: '5', // 5 ETH
      borrow: '1000', // $1000 USDC
      ethPrice: 200000000, // $2000 with 8 decimals
      tokenBalance: '1500', // 1500 USDC
    },
    updateBorrow: mockUpdateBorrow,
    updateTokenBalance: mockUpdateTokenBalance
  })
}));

describe('useRepay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no errors and not pending', async () => {
    const { result } = renderHook(() => useRepay());
    
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should successfully repay when token balance is sufficient', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRepay());
    
    // Start repayment process
    act(() => {
      result.current.repay(500); // Repay $500
    });
    
    // Should be pending
    expect(result.current.isPending).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should update borrow and token balance
    expect(mockUpdateBorrow).toHaveBeenCalledWith('500'); // 1000 - 500
    expect(mockUpdateTokenBalance).toHaveBeenCalledWith('1000'); // 1500 - 500
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should limit repayment to current borrowed amount', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useRepay());
    
    // Try to repay more than borrowed
    act(() => {
      result.current.repay(1500); // Repay $1500 (more than borrowed)
    });
    
    // Should be pending
    expect(result.current.isPending).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should update borrow and token balance, but only reduce borrow to 0
    expect(mockUpdateBorrow).toHaveBeenCalledWith('0'); // Fully repaid
    expect(mockUpdateTokenBalance).toHaveBeenCalledWith('500'); // 1500 - 1000
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fail to repay when token balance is insufficient', async () => {
    // Override the mock to simulate insufficient token balance
    jest.clearAllMocks();
    jest.mock('../useWalletData', () => ({
      useWalletData: () => ({
        walletData: {
          collateral: '5', // 5 ETH
          borrow: '1000', // $1000 USDC
          ethPrice: 200000000, // $2000 with 8 decimals
          tokenBalance: '400', // Only 400 USDC
        },
        updateBorrow: mockUpdateBorrow,
        updateTokenBalance: mockUpdateTokenBalance
      })
    }), { virtual: true });
    
    const { result, waitForNextUpdate } = renderHook(() => useRepay());
    
    // Try to repay more than token balance
    act(() => {
      result.current.repay(500); // Repay $500 with only $400 balance
    });
    
    // Should be pending
    expect(result.current.isPending).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should not update state
    expect(mockUpdateBorrow).not.toHaveBeenCalled();
    expect(mockUpdateTokenBalance).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Insufficient token balance');
  });

  it('should not attempt to repay negative or zero amounts', async () => {
    const { result } = renderHook(() => useRepay());
    
    // Try to repay a negative amount
    act(() => {
      result.current.repay(-100);
    });
    
    expect(result.current.error).not.toBeNull();
    expect(mockUpdateBorrow).not.toHaveBeenCalled();
    expect(mockUpdateTokenBalance).not.toHaveBeenCalled();
    
    // Try to repay zero
    jest.clearAllMocks();
    act(() => {
      result.current.repay(0);
    });
    
    expect(result.current.error).not.toBeNull();
    expect(mockUpdateBorrow).not.toHaveBeenCalled();
    expect(mockUpdateTokenBalance).not.toHaveBeenCalled();
  });
}); 