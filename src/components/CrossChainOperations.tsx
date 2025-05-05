import { useState } from 'react';
import { useAccount } from 'wagmi';

interface ChainOption {
  id: string;
  name: string;
  icon: string;
}

const CHAIN_OPTIONS: ChainOption[] = [
  {
    id: 'sepolia',
    name: 'Sepolia',
    icon: '🔵',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    icon: '🟣',
  },
  {
    id: 'fuji',
    name: 'Avalanche Fuji',
    icon: '❄️',
  },
];

const CrossChainOperations = () => {
  const { isConnected } = useAccount();
  const [selectedChain, setSelectedChain] = useState<string>('mumbai');
  const [amount, setAmount] = useState<string>('0.1');
  
  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };
  
  const handleCrossChainTransfer = () => {
    if (parseFloat(amount) <= 0) return;
    
    // Here you would call the appropriate contract function
    // This is where the CCIP cross-chain logic would be implemented
    console.log(`Sending ${amount} to ${selectedChain} chain`);
  };
  
  if (!isConnected) return null;
  
  return (
    <div className="cross-chain-container">
      <h3>Cross-Chain Operations <span className="network-pill sepolia">Sepolia</span></h3>
      
      <p>Transfer tokens between different chains using Chainlink CCIP.</p>
      
      <div className="form-group">
        <label>Select Target Chain:</label>
        <div className="chain-selector">
          {CHAIN_OPTIONS.map((chain) => (
            <div 
              key={chain.id}
              className={`chain-option ${selectedChain === chain.id ? 'active' : ''}`}
              onClick={() => handleChainSelect(chain.id)}
            >
              <span>{chain.icon}</span>
              <span>{chain.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-group">
        <label>Amount to Transfer:</label>
        <div className="input-group">
          <input 
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={handleAmountChange}
          />
          <button 
            onClick={handleCrossChainTransfer}
            disabled={parseFloat(amount) <= 0}
          >
            Transfer
          </button>
        </div>
      </div>
      
      <div className="cross-chain-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Cross-chain transfers are powered by Chainlink CCIP for secure interoperability.
      </div>
    </div>
  );
};

export default CrossChainOperations; 