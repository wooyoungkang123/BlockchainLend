// setup-test-env.js - Script to configure a test environment with pre-funded accounts
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Setting up a test environment with pre-funded accounts...');

  // 1. Update hardhat config to make accounts deterministic if needed
  const hardhatConfigPath = path.join(__dirname, '..', 'hardhat.config.js');
  let hardhatConfigContent = fs.readFileSync(hardhatConfigPath, 'utf8');
  
  // Make sure hardhat config has a consistent private key for first account
  if (!hardhatConfigContent.includes('accounts: {')) {
    // Add deterministic accounts with known private keys
    hardhatConfigContent = hardhatConfigContent.replace(
      'module.exports = {',
      `module.exports = {
  networks: {
    hardhat: {
      // Makes hardhat accounts deterministic with known private keys
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20
      }
    }
  },`
    );
    
    fs.writeFileSync(hardhatConfigPath, hardhatConfigContent);
    console.log('✅ Updated Hardhat configuration with deterministic accounts');
  }
  
  // 2. Set the first account's private key in .env
  // The first account from the mnemonic has this private key
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  
  // Read current .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update the private key
  if (envContent.includes('PRIVATE_KEY=')) {
    envContent = envContent.replace(
      /PRIVATE_KEY=.*/,
      `PRIVATE_KEY=${privateKey.slice(2)}` // Remove 0x prefix
    );
  } else {
    envContent += `\nPRIVATE_KEY=${privateKey.slice(2)}\n`;
  }
  
  // Make sure RPC URL points to local hardhat
  if (envContent.includes('RPC_URL=')) {
    envContent = envContent.replace(
      /RPC_URL=.*/,
      'RPC_URL=http://127.0.0.1:8545'
    );
  } else {
    envContent += '\nRPC_URL=http://127.0.0.1:8545\n';
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with local Hardhat account');
  
  // 3. Print instructions for using the test environment
  console.log('\n=== TEST ENVIRONMENT INFO ===');
  console.log('Account address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  console.log('Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  console.log('Initial balance: 10000 ETH');
  
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Start the local Hardhat node:');
  console.log('   npx hardhat node');
  console.log('2. In a separate terminal, start the wallet server:');
  console.log('   node scripts/wallet-server.js');
  console.log('3. Deploy your contracts to the local network:');
  console.log('   node scripts/deploy.js');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error setting up test environment:');
    console.error(error);
    process.exit(1);
  }); 