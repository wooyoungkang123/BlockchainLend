// Full lending pool dApp with all components
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PoolStatsCard from './components/PoolStatsCard';
import ModalHost from './components/ModalHost';
import type { ModalType } from './components/ModalHost';
import ActionButtons from './components/ActionButtons';
import ActivityHistory from './components/ActivityHistory';
import ToastCenter from './components/ToastCenter';
import Footer from './components/Footer';
import { useLendingPool } from './hooks/useLendingPool';
import SecurityInfo from './components/SecurityInfo';

function App() {
  const { isConnected } = useAccount();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [securityInfoType, setSecurityInfoType] = useState<'deposit' | 'borrow' | 'repay' | 'withdraw'>('deposit');
  const [securityInfoAmount, setSecurityInfoAmount] = useState<string>('1.0');
  
  const { 
    formattedInterestRate, 
    formattedEthPrice, 
    totalDeposits, 
    totalBorrows 
  } = useLendingPool();

  const openModal = (modalType: ModalType) => {
    setActiveModal(modalType);
    
    // Set security info type based on modal
    if (modalType === 'deposit') setSecurityInfoType('deposit');
    else if (modalType === 'borrow') setSecurityInfoType('borrow');
    else if (modalType === 'repay') setSecurityInfoType('repay');
    else if (modalType === 'liquidate') setSecurityInfoType('repay'); // Use repay for liquidate
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="app">
      <Header />
      
      <main className="app-main">
        <PoolStatsCard 
          interestRate={formattedInterestRate}
          ethPrice={formattedEthPrice}
          totalDeposits={totalDeposits}
          totalBorrows={totalBorrows}
        />
        
        {isConnected ? (
          <>
            <Dashboard />
            <ActionButtons openModal={openModal} />
            
            {/* Security Info Section */}
            <div className="security-demo-section">
              <div className="section-header">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#1a90ff" strokeWidth="2"/>
                    <path d="M12 8V12L15 15" stroke="#1a90ff" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Transaction Security
                </h3>
                <p>Preview transaction details before submitting to ensure safety and prevent unexpected outcomes.</p>
              </div>
              
              <div className="security-demo-controls">
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select 
                    value={securityInfoType} 
                    onChange={(e) => setSecurityInfoType(e.target.value as any)}
                    className="select-styled"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                    <option value="borrow">Borrow</option>
                    <option value="repay">Repay</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Amount</label>
                  <input 
                    type="number" 
                    value={securityInfoAmount}
                    onChange={(e) => setSecurityInfoAmount(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="input-styled"
                  />
                </div>
              </div>
              
              {securityInfoType && (
                <SecurityInfo 
                  transactionType={securityInfoType}
                  amount={securityInfoAmount}
                />
              )}
            </div>
            
            <ActivityHistory />
          </>
        ) : (
          <div className="not-connected">
            <div className="welcome-card">
              <div className="welcome-icon">
                <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z" fill="#7A6BFF" fillOpacity="0.2"/>
                  <path d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM14 20V12L20 16L14 20Z" fill="#7A6BFF"/>
                </svg>
              </div>
              <h2>Welcome to DeFi Lending Pool</h2>
              <p>Access decentralized lending and borrowing with competitive interest rates on Sepolia testnet.</p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <div className="feature-icon">💰</div>
                  <div className="feature-content">
                    <h4>Earn Interest</h4>
                    <p>Deposit your tokens and earn interest on your assets</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">💸</div>
                  <div className="feature-content">
                    <h4>Instant Borrowing</h4>
                    <p>Use your collateral to borrow assets instantly</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <div className="feature-icon">🔄</div>
                  <div className="feature-content">
                    <h4>Cross-Chain</h4>
                    <p>Seamless transactions across multiple blockchains</p>
                  </div>
                </div>
              </div>
              
              <p className="connect-prompt">Connect your wallet to get started</p>
              <div className="connect-wrapper">
                <ConnectButton />
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
      
      {/* Modal system */}
      {activeModal && (
        <ModalHost 
          modalType={activeModal}
          closeModal={closeModal}
        />
      )}
      
      {/* Toast notifications */}
      <ToastCenter />
    </div>
  );
}

export default App;
