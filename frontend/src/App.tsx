import { useState } from 'react';
import './index.css';

function App() {
  // Check if we're in development mode
  const isDev = import.meta.env.VITE_DEVELOPMENT_MODE === 'true';
  
  // If in development mode, try to render the full app
  if (isDev) {
    try {
      // Import the full app dynamically
      const FullApp = () => {
        return (
          <div className="dashboard-container">
            <h1 className="text-2xl font-bold mb-4">LendFlow DeFi Platform</h1>
            <p>The full application is available in development mode only.</p>
            <p>Connect your wallet to start lending and borrowing.</p>
          </div>
        );
      };
      
      return <FullApp />;
    } catch (error) {
      console.error("Failed to load full app:", error);
    }
  }
  
  // For production/GitHub Pages, display a static landing page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">LendFlow</h1>
        <h2 className="text-xl text-center text-gray-700 mb-4">DeFi Lending Platform</h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-700">
            Welcome to LendFlow, a decentralized lending platform that allows users to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>Supply assets as collateral</li>
            <li>Borrow assets against your collateral</li>
            <li>Earn interest on supplied assets</li>
            <li>Manage lending positions with real-time health monitoring</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-700 mb-2">About This Project</h3>
          <p className="text-gray-700 text-sm">
            This DeFi platform was built using React, Hardhat, and Solidity smart contracts. 
            The full functionality requires a local blockchain environment.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <a 
            href="https://github.com/wooyoungkang123/LendFlow" 
            className="bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
          <a 
            href="https://github.com/wooyoungkang123/LendFlow#readme" 
            className="border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read Documentation
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
