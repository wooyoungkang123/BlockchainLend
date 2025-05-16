import { getContractAddress } from './contracts';
import { LendingPoolABI } from './abis/LendingPoolABI';

export function getLendingPoolContract(chainId: number) {
  const address = getContractAddress(chainId, 'LendingPool') as `0x${string}`;
  
  return {
    address,
    abi: LendingPoolABI
  };
} 