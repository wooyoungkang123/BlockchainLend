import { useState, useEffect } from 'react';

interface UserStats {
  collateralBalance: string;
  borrowBalance: string;
  availableToBorrow: string;
  currentLTV: number;
  maxLTV: number;
  healthFactor: string;
  liquidationThreshold: number;
}

export const useUserStats = (): UserStats => {
  const [stats, setStats] = useState<UserStats>({
    collateralBalance: '5.0',
    borrowBalance: '1000',
    availableToBorrow: '3000',
    currentLTV: 40,
    maxLTV: 75,
    healthFactor: '1.8',
    liquidationThreshold: 85
  });

  useEffect(() => {
    // Mock API call to fetch user stats
    const fetchStats = async () => {
      // In a real implementation, we would fetch this data from the blockchain
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      setStats({
        collateralBalance: '5.0',
        borrowBalance: '1000',
        availableToBorrow: '3000',
        currentLTV: 40,
        maxLTV: 75,
        healthFactor: '1.8',
        liquidationThreshold: 85
      });
    };

    fetchStats();
  }, []);

  return stats;
}; 