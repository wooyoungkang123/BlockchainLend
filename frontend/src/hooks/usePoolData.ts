import { useState, useEffect } from 'react';

interface PoolData {
  totalSupplied: number;
  totalBorrowed: number;
  supplyAPY: number;
  borrowAPY: number;
  maxBorrowAmount: number;
  utilizationRate: number;
}

export const usePoolData = (): PoolData => {
  const [poolData, setPoolData] = useState<PoolData>({
    totalSupplied: 100000,
    totalBorrowed: 65000,
    supplyAPY: 3.2,
    borrowAPY: 5.8,
    maxBorrowAmount: 10000,
    utilizationRate: 0.65
  });

  useEffect(() => {
    // Mock API call to fetch pool data
    const fetchPoolData = async () => {
      // In a real implementation, we would fetch this data from the blockchain
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      setPoolData({
        totalSupplied: 100000,
        totalBorrowed: 65000,
        supplyAPY: 3.2,
        borrowAPY: 5.8,
        maxBorrowAmount: 10000,
        utilizationRate: 0.65
      });
    };

    fetchPoolData();
  }, []);

  return poolData;
}; 