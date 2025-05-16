import { useAccount } from 'wagmi';
import { useLendingPool } from '../hooks/useLendingPool';
import { useToken } from '../hooks/useToken';
import { ConnectButton } from './ConnectButton';

export const Dashboard = () => {
  const { isConnected } = useAccount();
  const { userData, ethPrice, liquidationThreshold } = useLendingPool();
  const { balance: tokenBalance, tokenSymbol } = useToken();
  
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">DeFi Lending Platform</h1>
        <p className="text-lg mb-6">Connect your wallet to use the platform</p>
        <ConnectButton />
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Lending Platform Dashboard</h1>
        <ConnectButton />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Overview Card */}
        <div className="card flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ETH Collateral:</span>
              <span className="font-medium">
                {userData ? userData.formattedCollateral : '0'} ETH
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Borrowed:</span>
              <span className="font-medium">
                {userData ? userData.formattedBorrow : '0'} {tokenSymbol || 'USDC'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Health Factor:</span>
              <span className={`font-medium ${
                userData && Number(userData.healthFactor) < (liquidationThreshold + 10) 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {userData ? userData.formattedHealthFactor : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">{tokenSymbol || 'USDC'} Balance:</span>
              <span className="font-medium">{tokenBalance} {tokenSymbol || 'USDC'}</span>
            </div>
          </div>
        </div>
        
        {/* Market Info Card */}
        <div className="card flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Market Information</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ETH/USD Price:</span>
              <span className="font-medium">
                ${ethPrice ? (Number(ethPrice) / 1e18).toFixed(2) : 'Loading...'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Liquidation Threshold:</span>
              <span className="font-medium">{liquidationThreshold}%</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Loan to Value:</span>
              <span className="font-medium">{liquidationThreshold}%</span>
            </div>
            
            <div className="border-t pt-3 mt-4">
              <p className="text-sm text-gray-500">
                You can borrow up to {liquidationThreshold}% of your collateral value. 
                If your health factor drops below {liquidationThreshold}%, your position may be liquidated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 