import React, { useState } from 'react';
import { ChevronDown, Menu, X, Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export const Header: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
    } else if (openConnectModal) {
      openConnectModal();
    }
  };

  const networks = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'];
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);

  return (
    <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
          <Wallet size={20} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">LendFlow</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Network selector - desktop only */}
        <div className="hidden md:block relative">
          <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none bg-gray-100 px-3 py-1.5 rounded-lg transition-colors duration-200">
            <span className="font-medium">{selectedNetwork}</span>
            <ChevronDown size={16} className="ml-1" />
          </button>
        </div>
        
        {/* Connect Wallet Button - Always visible */}
        <button 
          onClick={handleWalletClick}
          className={`flex items-center px-5 py-2.5 rounded-lg text-base font-semibold shadow-sm transition-all duration-200 ${
            isConnected 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
          }`}
          style={{ minWidth: '140px', justifyContent: 'center' }}
        >
          <Wallet size={18} className="mr-2" />
          {isConnected && address ? truncateAddress(address) : 'Connect Wallet'}
        </button>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-700 ml-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-md p-4 md:hidden z-10">
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <button className="flex items-center space-x-2 text-gray-700 bg-gray-100 px-3 py-2 rounded-lg w-full">
                <span className="font-medium">{selectedNetwork}</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}; 