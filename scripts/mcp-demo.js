// mcp-demo.js - Simplified MCP demonstration script
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// This script demonstrates using environment variables with MCP
async function main() {
  console.log('=== MCP Environment Secrets Demo ===');
  
  // 1. Read the private key from .env
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ No private key found in .env file');
    console.log('Run: node scripts/generate-key.js');
    process.exit(1);
  }
  
  // 2. Determine which network to use (local hardhat or sepolia)
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  
  console.log(`Using network: ${rpcUrl}`);
  console.log(`Wallet address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`);
  console.log('\nThis demo shows how MCP uses environment variables from .env to avoid');
  console.log('having to manually enter sensitive information like private keys.');
  
  // Print the information about both test environment options
  console.log('\n=== Development Options ===');
  console.log('1. LOCAL HARDHAT NETWORK (current configuration)');
  console.log('  - Use node scripts/setup-test-env.js to configure');
  console.log('  - Run npx hardhat node to start a local chain');
  console.log('  - Pre-funded with 10,000 ETH for testing');
  
  console.log('\n2. SEPOLIA TESTNET');
  console.log('  - Use node scripts/generate-key.js to create a wallet');
  console.log('  - Fund via a Sepolia faucet');
  console.log('  - Edit .env to use SEPOLIA_RPC_URL');
  
  console.log('\nMCP reads the .env file to access private keys securely,');
  console.log('so you never need to copy/paste them into your code or chat.');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 