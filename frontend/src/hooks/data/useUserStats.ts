import { useState, useEffect } from 'react';
import { useLendingPool } from './useLendingPool';
import { useAccount } from 'wagmi';
import { useToken } from './useToken';

export interface UserStats {
  collateralBalance: string;
  borrowBalance: string;
  availableToBorrow: string;
  healthFactor: string | null;
  liquidationThreshold: string;
}

export const useUserStats = (): UserStats => {
  const [stats, setStats] = useState<UserStats>({
    collateralBalance: '0',
    borrowBalance: '0',
    availableToBorrow: '0',
    healthFactor: null,
    liquidationThreshold: '80',
  });
  
  const { address } = useAccount();
  const { getUserData } = useLendingPool();
  const { tokenBalance } = useToken();
  
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!address) return;
      
      try {
        const userData = await getUserData();
        
        if (userData) {
          const collateralBalance = userData.collateralBalance || '0';
          const borrowBalance = userData.borrowBalance || '0';
          const availableToBorrow = userData.availableToBorrow || '0';
          const healthFactor = userData.healthFactor || null;
          
          setStats({
            collateralBalance,
            borrowBalance,
            availableToBorrow,
            healthFactor,
            liquidationThreshold: '80', // This could be fetched from the contract if available
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };
    
    fetchUserStats();
  }, [address, getUserData, tokenBalance]);
  
  return stats;
}; 