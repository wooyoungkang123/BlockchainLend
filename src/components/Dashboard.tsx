import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useLendingPool } from '../hooks/useLendingPool';
import PoolStatsCard from './PoolStatsCard';
import HealthFactorBar from './HealthFactorBar';
import ActionButtons from './ActionButtons';
import ActivityHistory from './ActivityHistory';
import { LENDING_POOL_ADDRESS } from '../contracts/config';
import LendingPoolABI from '../contracts/LendingPoolABI.json';
import { useState } from 'react';
import type { ModalType } from './ModalHost';
import ModalHost from './ModalHost';

const Dashboard = () => {
  const { isConnected, address } = useAccount();
  const { 
    totalDeposits, 
    totalBorrows, 
    formattedInterestRate, 
    formattedEthPrice 
  } = useLendingPool();
  
  // State for modal management
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  
  // Direct call to get user data for health factor
  const userData = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LendingPoolABI,
    functionName: 'getUserAccountData',
    args: address ? [address] : undefined,
  });
  
  // Calculate health factor from user data
  const calculateHealthFactor = () => {
    if (!userData.data) return 0;
    
    try {
      const data = userData.data as any[];
      const collateral = Number(formatEther(data[0] || 0n)); // ETH
      const borrowed = Number(formatEther(data[1] || 0n)); // USDC
      
      // Simple health factor calculation (collateral value / borrowed * liquidation threshold)
      return borrowed > 0 ? (collateral * 2000 * 0.8) / borrowed : 100;
    } catch (error) {
      console.error('Error calculating health factor:', error);
      return 0;
    }
  };
  
  // Open modal handler
  const openModal = (type: ModalType) => {
    setCurrentModal(type);
  };
  
  // Close modal handler
  const closeModal = () => {
    setCurrentModal(null);
  };

  if (!isConnected) {
    return (
      <div className="dashboard not-connected">
        <h2>Connect your wallet to get started</h2>
        <p>Connect your wallet to see your lending and borrowing positions</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2>Your Dashboard</h2>
        </div>
        
        <div className="dashboard-content">
          <div className="dashboard-stats">
            <PoolStatsCard 
              totalDeposits={totalDeposits}
              totalBorrows={totalBorrows}
              interestRate={formattedInterestRate}
              ethPrice={formattedEthPrice}
            />
          </div>
          
          <div className="dashboard-health">
            <h3>Your Health Factor</h3>
            <HealthFactorBar healthFactor={calculateHealthFactor()} />
          </div>
          
          <div className="dashboard-actions">
            <h3>Quick Actions</h3>
            <ActionButtons openModal={openModal} />
          </div>
          
          <div className="dashboard-history">
            <h3>Recent Activity</h3>
            <ActivityHistory />
          </div>
        </div>
      </div>
      
      {/* Modal host for all interactive modals */}
      <ModalHost 
        modalType={currentModal} 
        closeModal={closeModal} 
      />
    </>
  );
};

export default Dashboard; 