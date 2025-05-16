import { renderHook, act } from '@testing-library/react-hooks';
import { useWalletData } from '../useWalletData';

// Mock wagmi's useAccount hook
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true
  })
}));

// Mock the walletStorage utilities
jest.mock('../../utils/walletStorage', () => ({
  getWalletData: jest.fn((address, key, defaultValue) => defaultValue),
  setWalletData: jest.fn(),
  StorageKeys: {
    DEPOSITS: 'deposits',
    BORROWS: 'borrows',
    ETH_PRICE: 'eth_price',
    TOKEN_BALANCE: 'token_balance',
  }
}));

describe('useWalletData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWalletData());
    
    expect(result.current.walletData).toEqual({
      collateral: '0',
      borrow: '0',
      ethPrice: 200000000, // $2000 with 8 decimals
      tokenBalance: '1000',
    });
  });

  it('should update collateral amount', () => {
    const { result } = renderHook(() => useWalletData());
    
    act(() => {
      result.current.updateCollateral('5');
    });
    
    expect(result.current.walletData.collateral).toBe('5');
  });
  
  it('should update borrow amount', () => {
    const { result } = renderHook(() => useWalletData());
    
    act(() => {
      result.current.updateBorrow('1000');
    });
    
    expect(result.current.walletData.borrow).toBe('1000');
  });
  
  it('should update ETH price', () => {
    const { result } = renderHook(() => useWalletData());
    
    act(() => {
      result.current.updateEthPrice(250000000); // $2500
    });
    
    expect(result.current.walletData.ethPrice).toBe(250000000);
  });
  
  it('should update token balance', () => {
    const { result } = renderHook(() => useWalletData());
    
    act(() => {
      result.current.updateTokenBalance('2000');
    });
    
    expect(result.current.walletData.tokenBalance).toBe('2000');
  });
}); 