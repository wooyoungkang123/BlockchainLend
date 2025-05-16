import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useUserStats } from '../../hooks/useUserStats';
import { useWalletData } from '../../hooks/useWalletData';

interface HealthFactorIndicatorProps {
  minSafeLevel?: number;
  liquidationLevel?: number;
}

export const HealthFactorIndicator: React.FC<HealthFactorIndicatorProps> = ({
  minSafeLevel = 1.5,
  liquidationLevel = 1.0,
}) => {
  const { healthFactor: userHealthFactor, collateralRatio } = useUserStats();
  const { walletData } = useWalletData();
  const [healthFactor, setHealthFactor] = useState(userHealthFactor);
  
  // Update health factor when user stats change
  useEffect(() => {
    console.log('HealthFactorIndicator: Updating health factor to', userHealthFactor);
    setHealthFactor(userHealthFactor);
  }, [userHealthFactor, walletData]);
  
  // Calculate safe threshold value based on collateral ratio (typically 80%)
  // Liquidation happens at 1.0, so a collateral ratio of 80% means the safe threshold is at 1.25
  const safeThresholdValue = collateralRatio ? (100 / collateralRatio) : 1.25;
  
  // Use fixed scale for consistent visualization
  const dangerLevel = 1.1; // Below this is dangerous (red)
  const warningLevel = safeThresholdValue; // Below this is warning (yellow)
  const safeLevel = 2.0; // Above this is "safe"
  const verySafeLevel = 5.0; // Upper reference for "very safe"
  
  // Calculate the percentage using a logarithmic scale to better represent high health factors
  const calculatePercentage = (value: number) => {
    // Clamp minimum at liquidation level
    const normalizedValue = Math.max(value, liquidationLevel);
    
    // Use a logarithmic scale for better visualization of health factors
    const logMin = Math.log(liquidationLevel);
    const logMax = Math.log(verySafeLevel);
    const logValue = Math.log(normalizedValue);
    
    // Calculate percentage on logarithmic scale
    const percentage = ((logValue - logMin) / (logMax - logMin)) * 100;
    return Math.min(Math.round(percentage), 100); // Cap at 100%
  };
  
  // Static widths for the colored sections - these don't change
  const dangerWidth = 20; // Red zone - 20% width
  const warningWidth = 20; // Yellow zone - 20% width 
  const safeWidth = 60; // Green zone - 60% width
  
  // Calculate position for the health factor indicator (black line)
  const percentage = calculatePercentage(healthFactor);
  
  // Safe threshold position (gray line)
  const thresholdPosition = calculatePercentage(warningLevel);
  
  // Determine color based on health factor
  const getStatusText = () => {
    if (healthFactor < dangerLevel) return 'At Risk';
    if (healthFactor < warningLevel) return 'Caution';
    if (healthFactor < safeLevel) return 'Safe';
    return 'Very Safe';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800">Health Factor</h3>
          <button className="ml-2 text-gray-400 hover:text-gray-600">
            <Info size={16} />
          </button>
        </div>
        
        <div className="flex items-center">
          <span className={`text-lg font-bold ${
            healthFactor < dangerLevel ? 'text-red-600' : 
            healthFactor < warningLevel ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {healthFactor > 100 ? "∞" : healthFactor.toFixed(2)}
          </span>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
            healthFactor < dangerLevel ? 'bg-red-100 text-red-800' : 
            healthFactor < warningLevel ? 'bg-yellow-100 text-yellow-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      {/* Health Factor Bar */}
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden mb-1">
        {/* Static Gradient Bar with fixed widths */}
        <div className="absolute inset-0 flex">
          <div className="h-full bg-red-500" style={{ width: `${dangerWidth}%` }}></div>
          <div className="h-full bg-yellow-500" style={{ width: `${warningWidth}%` }}></div>
          <div className="h-full bg-green-500" style={{ width: `${safeWidth}%` }}></div>
        </div>
        
        {/* Safe Threshold Marker (gray line) */}
        <div 
          className="absolute inset-y-0 w-0.5 bg-gray-500 opacity-70"
          style={{ 
            left: `${thresholdPosition}%`,
            transform: 'translateX(-50%)',
            zIndex: 5
          }}
        ></div>
        
        {/* Health Factor Indicator (black triangle) */}
        <div 
          className="absolute top-0 bottom-0"
          style={{ 
            left: `${percentage}%`,
            zIndex: 30,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Triangle indicator with white border */}
          <div 
            className="absolute top-0 h-10 w-2 bg-black"
            style={{
              transform: 'translateX(-50%)',
              borderRadius: '1px',
              border: '1px solid white',
              boxShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}
          ></div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-600 mb-4">
        <div className="flex items-center">
          <AlertTriangle size={12} className="text-red-500 mr-1" />
          <span>Liquidation</span>
        </div>
        <span className="font-medium">Safe Threshold: {collateralRatio}%</span>
        <span>Very Safe</span>
      </div>
      
      {/* Info Box */}
      {healthFactor < warningLevel && (
        <div className={`p-3 rounded-lg flex items-start ${
          healthFactor < dangerLevel ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          <AlertTriangle 
            size={16} 
            className={healthFactor < dangerLevel ? 'text-red-600 mt-0.5 mr-2' : 'text-yellow-600 mt-0.5 mr-2'} 
          />
          <div>
            <p className={`text-sm ${healthFactor < dangerLevel ? 'text-red-700' : 'text-yellow-700'}`}>
              {healthFactor < dangerLevel 
                ? 'Your position is at high risk of liquidation. Add more collateral immediately.'
                : 'Your position is below the recommended safety threshold. Consider adding more collateral.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 