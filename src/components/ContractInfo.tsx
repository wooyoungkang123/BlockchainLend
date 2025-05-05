import { useLendingPool } from '../hooks/useLendingPool';
import { LENDING_POOL_ADDRESS } from '../contracts/config';

export const ContractInfo = () => {
  const { 
    formattedInterestRate, 
    formattedEthPrice, 
    totalDeposits, 
    totalBorrows,
  } = useLendingPool();

  return (
    <div className="contract-info">
      <h2>LendingPool Contract</h2>
      <div className="contract-address">
        <span>Address:</span>
        <a 
          href={`https://sepolia.etherscan.io/address/${LENDING_POOL_ADDRESS}`} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {LENDING_POOL_ADDRESS}
        </a>
      </div>
      <div className="contract-stats">
        <div className="stat-item">
          <span>Interest Rate:</span>
          <span>{formattedInterestRate}</span>
        </div>
        <div className="stat-item">
          <span>ETH/USD Price:</span>
          <span>{formattedEthPrice}</span>
        </div>
        <div className="stat-item">
          <span>Total Deposits:</span>
          <span>{totalDeposits} tokens</span>
        </div>
        <div className="stat-item">
          <span>Total Borrows:</span>
          <span>{totalBorrows} tokens</span>
        </div>
      </div>
    </div>
  );
};

export default ContractInfo; 