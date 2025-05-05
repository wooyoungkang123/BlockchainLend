interface PoolStatsCardProps {
  interestRate: string;
  ethPrice: string;
  totalDeposits: string;
  totalBorrows: string;
}

const PoolStatsCard = ({ interestRate, ethPrice, totalDeposits, totalBorrows }: PoolStatsCardProps) => {
  // Calculate utilization rate
  const utilizationRate = (): string => {
    if (!totalDeposits || parseFloat(totalDeposits) === 0) return '0%';
    const utilization = (parseFloat(totalBorrows) / parseFloat(totalDeposits)) * 100;
    return `${Math.min(utilization, 100).toFixed(2)}%`;
  };

  return (
    <div className="pool-stats-card">
      <h3>Pool Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Interest Rate</span>
          <span className="stat-value">{interestRate}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">ETH Price</span>
          <span className="stat-value">{ethPrice}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Deposits</span>
          <span className="stat-value">{totalDeposits} tokens</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Borrows</span>
          <span className="stat-value">{totalBorrows} tokens</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Utilization Rate</span>
          <span className="stat-value">{utilizationRate()}</span>
        </div>
      </div>
    </div>
  );
};

export default PoolStatsCard; 