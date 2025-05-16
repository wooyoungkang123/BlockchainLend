import React, { useState } from 'react';
import { TabNavigation } from './ui/TabNavigation';
import { BorrowForm } from './forms/BorrowForm';
import { RepayForm } from './forms/RepayForm';
import { useUserData } from '../hooks/useUserData';

// Icons for tabs
const BorrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
  </svg>
);

const RepayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);

export const LendBorrowPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('borrow');
  const userData = useUserData();
  
  const tabs = [
    { id: 'borrow', label: 'Borrow', icon: <BorrowIcon /> },
    { id: 'repay', label: 'Repay', icon: <RepayIcon /> },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSuccess = () => {
    // In a real implementation, we might want to refresh data here
    // For now, this is just a placeholder
  };

  return (
    <div className="lend-borrow-panel card">
      <div className="card-header">
        <h2 className="card-title">Lend & Borrow</h2>
        <p className="card-description">
          Borrow against your ETH collateral or repay existing loans to maintain a healthy position.
        </p>
      </div>
      
      <div className="card-content">
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />
        
        <div className="form-container">
          {activeTab === 'borrow' && (
            <BorrowForm onSuccess={handleSuccess} />
          )}
          {activeTab === 'repay' && (
            <RepayForm 
              onSuccess={handleSuccess}
              currentDebt={userData.borrowedAmount.toString()}
              tokenBalance="1000" // Mock USDC balance for now
            />
          )}
        </div>
      </div>
      
      <div className="card-footer">
        <div className="info-box">
          <div className="flex-between">
            <span className="text-secondary">Current Health Factor</span>
            <span className={`text-${userData.healthFactor >= 1.5 ? 'green' : userData.healthFactor >= 1.2 ? 'yellow' : 'red'}`}>
              {userData.healthFactor.toFixed(2)}
            </span>
          </div>
          <div className="health-bar-container mt-1">
            <div 
              className={`health-bar ${userData.healthFactor >= 1.5 ? 'health-bar-green' : userData.healthFactor >= 1.2 ? 'health-bar-yellow' : 'health-bar-red'}`} 
              style={{ width: `${Math.min(userData.healthFactor * 30, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 