import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { StatsPanel } from './StatsPanel';
import { LendingDashboard } from './LendingDashboard';
import { LendBorrowPanel } from '../borrowing/LendBorrowPanel';
import { TransactionGuard } from '../wallet/TransactionGuard';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent, Database, Wallet } from 'lucide-react';
import { TransactionForm } from '../transactions';
import { HealthFactorIndicator } from './HealthFactorIndicator';
import { ConnectButton } from '../wallet/ConnectButton';
import { useWalletData } from '../../hooks/useWalletData';

export const Dashboard: React.FC = () => {
  const { isConnected } = useAccount();
  const { walletData } = useWalletData();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Force refresh when wallet data changes
  useEffect(() => {
    console.log('Dashboard: Wallet data changed, refreshing components');
    setRefreshKey(prev => prev + 1);
  }, [walletData]);
  
  // Display connect wallet page if wallet is not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-10 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                <Wallet size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">DeFi Lending Platform</h1>
            <p className="text-gray-600 text-xl">Connect your wallet to use the platform</p>
          </div>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
          <div className="pt-8 text-sm text-gray-500">
            <p>Deposit ETH, Borrow USDC, Monitor Health Factor</p>
            <p>All in one decentralized lending platform</p>
          </div>
        </div>
      </div>
    );
  }
  
  const marketMetrics = [
    {
      title: 'Total Value Locked',
      value: '$8.4M',
      change: '5.2%',
      trend: 'up',
      period: 'from last week',
      icon: <Database size={20} />
    },
    {
      title: 'ETH Price',
      value: '$2,489.55',
      change: '1.8%',
      trend: 'up',
      period: 'in 24h',
      icon: <DollarSign size={20} />
    },
    {
      title: 'Borrow APY',
      value: '4.32%',
      change: '0.1%',
      trend: 'down',
      period: 'from yesterday',
      icon: <Percent size={20} />
    },
    {
      title: 'Supply APY',
      value: '2.87%',
      change: '0.3%',
      trend: 'up',
      period: 'from yesterday',
      icon: <Percent size={20} />
    }
  ];

  return (
    <TransactionGuard>
      <div className="dashboard w-full" style={{ width: '100%', padding: '16px 32px', maxWidth: '100vw' }}>
        {/* First row with Market Overview and Your Position */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '32px', marginBottom: '60px', width: '100%' }}>
          <div style={{ width: '100%' }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Market Overview</h2>
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {marketMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-2">
                        {metric.icon}
                      </div>
                      <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
                    </div>
                    
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-gray-900 mr-2">{metric.value}</span>
                      <div className={`flex items-center text-sm ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.trend === 'up' 
                          ? <TrendingUp size={14} className="mr-1" /> 
                          : <TrendingDown size={14} className="mr-1" />
                        }
                        <span>{metric.trend === 'up' ? '+' : '-'}{metric.change}</span>
                        <span className="text-gray-500 ml-2">{metric.period}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ width: '100%' }}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Position</h2>
            <StatsPanel />
          </div>
        </div>
        
        {/* Second row with Health Status only */}
        <div style={{ width: '100%', marginBottom: '60px', paddingTop: '8px' }}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Health Status</h2>
          <HealthFactorIndicator key={`health-${refreshKey}`} />
        </div>
        
        {/* Third row with Lend & Borrow only */}
        <div style={{ width: '100%', marginBottom: '32px', paddingTop: '8px' }}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Lend & Borrow</h2>
          <LendBorrowPanel />
        </div>
      </div>
    </TransactionGuard>
  );
}; 