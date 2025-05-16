import React from 'react';
import { useUserStats } from '../hooks/useUserStats';
import { formatCurrency } from '../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
}

const StatCard = ({ title, value, change, positive, icon }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="stat-icon-container">
        {icon}
      </div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-value-container">
          <p className="stat-value">{value}</p>
          {change && (
            <span className={`stat-change ${positive ? 'positive' : 'negative'}`}>
              {positive ? '↑' : '↓'} {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const StatsPanel: React.FC = () => {
  const { 
    collateralBalance, 
    borrowBalance, 
    availableToBorrow,
    healthFactor,
    liquidationThreshold 
  } = useUserStats();

  const healthFactorValue = parseFloat(healthFactor || '0');
  const healthFactorColor = 
    healthFactorValue < 1 ? 'text-red' :
    healthFactorValue < 1.5 ? 'text-yellow' : 'text-green';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your DeFi Position</CardTitle>
        <CardDescription>Overview of your lending and borrowing activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="stats-grid">
          <StatCard 
            title="Collateral Supplied" 
            value={`${collateralBalance} ETH`}
            icon={<span className="icon">📈</span>}
          />
          <StatCard 
            title="Borrowed" 
            value={`${borrowBalance} USDC`}
            icon={<span className="icon">💰</span>}
          />
          <StatCard 
            title="Available to Borrow" 
            value={`${availableToBorrow} USDC`}
            icon={<span className="icon">💳</span>}
          />
          <StatCard 
            title="Health Factor" 
            value={healthFactor || '∞'}
            icon={<span className="icon">❤️</span>}
          />
        </div>
        
        <div className="health-indicator mt-6">
          <div className="flex-between mb-2">
            <span className="text-sm text-gray">Health Factor</span>
            <span className={`text-sm font-medium ${healthFactorColor}`}>
              {healthFactor || '∞'}
            </span>
          </div>
          <div className="health-bar-container">
            <div 
              className={`health-bar ${
                healthFactorValue < 1 ? 'health-bar-red' :
                healthFactorValue < 1.5 ? 'health-bar-yellow' : 'health-bar-green'
              }`} 
              style={{ width: `${Math.min(healthFactorValue * 30, 100)}%` }}
            />
          </div>
          <div className="slider-labels mt-1">
            <span className="text-red">Liquidation</span>
            <span>Threshold: {liquidationThreshold}%</span>
            <span className="text-green">Safe</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 