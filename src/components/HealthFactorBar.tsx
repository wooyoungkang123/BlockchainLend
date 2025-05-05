import { useMemo } from 'react';

interface HealthFactorBarProps {
  healthFactor: number;
}

const HealthFactorBar = ({ healthFactor }: HealthFactorBarProps) => {
  const { barWidth, barColor, label } = useMemo(() => {
    // Convert health factor to a percentage (capped at 100%)
    // We consider 2.0 as the "healthy" max (100%)
    const percentage = Math.min((healthFactor / 2) * 100, 100);
    
    let color: string;
    let statusLabel: string;
    
    if (healthFactor < 1) {
      // Red - Liquidation zone
      color = '#ff4d4f';
      statusLabel = 'Liquidation Risk';
    } else if (healthFactor < 1.5) {
      // Orange - Warning zone
      color = '#faad14';
      statusLabel = 'Warning';
    } else {
      // Green - Safe zone
      color = '#52c41a';
      statusLabel = 'Safe';
    }
    
    return {
      barWidth: `${percentage}%`,
      barColor: color,
      label: statusLabel
    };
  }, [healthFactor]);
  
  return (
    <div className="health-factor-visual">
      <div className="health-factor-bar">
        <div 
          className="health-factor-indicator" 
          style={{ width: barWidth, backgroundColor: barColor }}
        />
      </div>
      
      <div className="health-factor-details">
        <span className="health-factor-value">
          {healthFactor.toFixed(2)}
        </span>
        <span className="health-factor-status" style={{ color: barColor }}>
          {label}
        </span>
      </div>
    </div>
  );
};

export default HealthFactorBar; 