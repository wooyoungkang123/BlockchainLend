import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContract } from './useContract';

export function useRealUserData() {
  const { tokenContract, lendingPoolContract, isInitialized, userAddress } = useContract();
  
  const [userData, setUserData] = useState({
    collateralBalance: 0,
    borrowedAmount: 0,
    healthFactor: 0,
    etherBalance: 0,
    tokenBalance: 0,
    ethPrice: 0,
    liquidationThreshold: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Only fetch if contracts are initialized and we have a user address
    if (isInitialized && userAddress && lendingPoolContract && tokenContract) {
      const fetchUserData = async () => {
        setIsLoading(true);
        try {
          // Get ETH/USD price from lending pool
          const ethUsdPrice = await lendingPoolContract.getLatestEthUsdPrice();
          const ethPrice = Number(ethers.formatUnits(ethUsdPrice, 8)); // 8 decimals for Chainlink price
          
          // Get liquidation threshold
          const liquidationThreshold = await lendingPoolContract.liquidationThreshold();
          const threshold = Number(liquidationThreshold) / 100; // Convert from basis points to percentage
          
          // Get user's collateral (ETH)
          const collateral = await lendingPoolContract.deposits(userAddress);
          const collateralEth = Number(ethers.formatEther(collateral));
          
          // Get user's borrowed amount (USDC)
          const borrowed = await lendingPoolContract.borrows(userAddress);
          const decimals = await tokenContract.decimals();
          const borrowedUSDC = Number(ethers.formatUnits(borrowed, decimals));
          
          // Calculate health factor
          // Health factor = (collateral in USD * liquidation threshold) / borrowed amount
          const collateralValueUSD = collateralEth * ethPrice;
          const healthFactor = borrowed.toString() === '0' 
            ? 100 // If no debt, health factor is excellent
            : (collateralValueUSD * (threshold / 100)) / borrowedUSDC;
          
          // Get ETH balance
          const provider = tokenContract.provider;
          const ethBalance = await provider.getBalance(userAddress);
          const etherBalance = Number(ethers.formatEther(ethBalance));
          
          // Get token (USDC) balance
          const tokenBalance = await tokenContract.balanceOf(userAddress);
          const usdcBalance = Number(ethers.formatUnits(tokenBalance, decimals));
          
          setUserData({
            collateralBalance: collateralEth,
            borrowedAmount: borrowedUSDC,
            healthFactor: Number(healthFactor.toFixed(2)),
            etherBalance,
            tokenBalance: usdcBalance,
            ethPrice,
            liquidationThreshold: threshold
          });
          
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserData();
      
      // Set up an interval to refresh data
      const interval = setInterval(fetchUserData, 15000); // refresh every 15 seconds
      
      return () => clearInterval(interval);
    }
  }, [isInitialized, userAddress, lendingPoolContract, tokenContract]);
  
  // Function to refresh data on demand
  const refetch = async () => {
    if (isInitialized && userAddress && lendingPoolContract && tokenContract) {
      setIsLoading(true);
      try {
        // Same logic as above, but we'll use a more optimized approach
        const [
          ethUsdPriceResult,
          liquidationThresholdResult,
          collateralResult,
          borrowedResult,
          decimalsResult,
          ethBalanceResult,
          tokenBalanceResult
        ] = await Promise.all([
          lendingPoolContract.getLatestEthUsdPrice(),
          lendingPoolContract.liquidationThreshold(),
          lendingPoolContract.deposits(userAddress),
          lendingPoolContract.borrows(userAddress),
          tokenContract.decimals(),
          tokenContract.provider.getBalance(userAddress),
          tokenContract.balanceOf(userAddress)
        ]);
        
        const ethPrice = Number(ethers.formatUnits(ethUsdPriceResult, 8));
        const threshold = Number(liquidationThresholdResult) / 100;
        const collateralEth = Number(ethers.formatEther(collateralResult));
        const decimals = Number(decimalsResult);
        const borrowedUSDC = Number(ethers.formatUnits(borrowedResult, decimals));
        const etherBalance = Number(ethers.formatEther(ethBalanceResult));
        const usdcBalance = Number(ethers.formatUnits(tokenBalanceResult, decimals));
        
        const collateralValueUSD = collateralEth * ethPrice;
        const healthFactor = borrowedResult.toString() === '0'
          ? 100
          : (collateralValueUSD * (threshold / 100)) / borrowedUSDC;
        
        setUserData({
          collateralBalance: collateralEth,
          borrowedAmount: borrowedUSDC,
          healthFactor: Number(healthFactor.toFixed(2)),
          etherBalance,
          tokenBalance: usdcBalance,
          ethPrice,
          liquidationThreshold: threshold
        });
      } catch (error) {
        console.error('Error refreshing user data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return {
    ...userData,
    isLoading,
    refetch
  };
} 