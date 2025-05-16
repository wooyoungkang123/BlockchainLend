import { useState, useEffect } from 'react';

interface UserData {
  depositedAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  maxBorrowAmount: number;
  availableToWithdraw: number;
  collateralBalance: number;
}

export const useUserData = (): UserData => {
  const [userData, setUserData] = useState<UserData>({
    depositedAmount: 5,
    borrowedAmount: 1000,
    healthFactor: 1.8,
    maxBorrowAmount: 4000,
    availableToWithdraw: 2.5,
    collateralBalance: 5
  });

  useEffect(() => {
    // Mock API call to fetch user data
    const fetchUserData = async () => {
      // In a real implementation, we would fetch this data from the blockchain
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      setUserData({
        depositedAmount: 5,
        borrowedAmount: 1000,
        healthFactor: 1.8,
        maxBorrowAmount: 4000,
        availableToWithdraw: 2.5,
        collateralBalance: 5
      });
    };

    fetchUserData();
  }, []);

  return userData;
}; 