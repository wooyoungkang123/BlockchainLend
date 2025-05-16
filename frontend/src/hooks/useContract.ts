import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import { getContractConfig } from '../config/contractConfig';

// ABI imports (minimal versions for demo purposes)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)'
];

const LENDING_POOL_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function borrow(uint256 amount) external',
  'function repay(uint256 amount) external',
  'function deposits(address user) view returns (uint256)',
  'function borrows(address user) view returns (uint256)',
  'function getLatestEthUsdPrice() view returns (uint256)',
  'function liquidationThreshold() view returns (uint256)'
];

export function useContract() {
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const { address } = useAccount();
  
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [lendingPoolContract, setLendingPoolContract] = useState<ethers.Contract | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Get correct contract addresses for the current network
    const config = getContractConfig(chain?.id);
    
    if (provider) {
      // Initialize read-only contracts with provider
      const tokenReadOnly = new ethers.Contract(
        config.tokenContract.address,
        ERC20_ABI,
        provider
      );
      
      const lendingPoolReadOnly = new ethers.Contract(
        config.lendingPoolContract.address,
        LENDING_POOL_ABI,
        provider
      );
      
      setTokenContract(tokenReadOnly);
      setLendingPoolContract(lendingPoolReadOnly);
      setIsInitialized(true);
      
      // If we have a signer, connect contracts for write operations
      if (signer) {
        setTokenContract(tokenReadOnly.connect(signer));
        setLendingPoolContract(lendingPoolReadOnly.connect(signer));
      }
    }
  }, [provider, signer, chain?.id]);
  
  return {
    tokenContract,
    lendingPoolContract,
    isInitialized,
    userAddress: address
  };
} 