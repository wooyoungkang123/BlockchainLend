import { renderHook, act } from '@testing-library/react-hooks';
import { useBorrow } from '../useBorrow';

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
      tokenBalance: '1000', // 1000 USDC
    },
    updateBorrow: mockUpdateBorrow,
    updateTokenBalance: mockUpdateTokenBalance
  })
}));

describe('useBorrow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with no errors and not pending', async () => {
    const { result } = renderHook(() => useBorrow());
    
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should successfully borrow when collateral is sufficient', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useBorrow());
    
    // Start borrowing process
    act(() => {
      result.current.borrow(500); // Borrow $500 more
    });
    
    // Should be pending
    expect(result.current.isPending).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should update borrow and token balance
    expect(mockUpdateBorrow).toHaveBeenCalledWith('1500'); // 1000 + 500
    expect(mockUpdateTokenBalance).toHaveBeenCalledWith('1500'); // 1000 + 500
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fail to borrow when collateral is insufficient', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useBorrow());
    
    // Try to borrow too much
    act(() => {
      result.current.borrow(5000); // Borrow $5000 more (exceeds collateral capacity)
    });
    
    // Should be pending
    expect(result.current.isPending).toBe(true);
    
    // Wait for the async operation to complete
    await waitForNextUpdate();
    
    // Should not update borrow or token balance
    expect(mockUpdateBorrow).not.toHaveBeenCalled();
    expect(mockUpdateTokenBalance).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Insufficient collateral');
  });

  it('should not attempt to borrow negative or zero amounts', async () => {
    const { result } = renderHook(() => useBorrow());
    
    // Try to borrow a negative amount
    act(() => {
      result.current.borrow(-100);
    });
    
    expect(result.current.error).not.toBeNull();
    expect(mockUpdateBorrow).not.toHaveBeenCalled();
    expect(mockUpdateTokenBalance).not.toHaveBeenCalled();
    
    // Try to borrow zero
    jest.clearAllMocks();
    act(() => {
      result.current.borrow(0);
    });
    
    expect(result.current.error).not.toBeNull();
    expect(mockUpdateBorrow).not.toHaveBeenCalled();
    expect(mockUpdateTokenBalance).not.toHaveBeenCalled();
  });
}); 