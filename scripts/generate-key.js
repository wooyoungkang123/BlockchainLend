// generate-key.js - Script to generate a new Ethereum wallet and update .env file
require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Generating a new Ethereum wallet for Sepolia testnet...');
  
  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('\n=== WALLET INFORMATION ===');
  console.log(`Address:     ${wallet.address}`);
  console.log(`Private Key: ${wallet.privateKey.slice(2)}`); // Remove 0x prefix for .env
  console.log(`Mnemonic:    ${wallet.mnemonic.phrase}`);
  
  // Read current .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.warn('No .env file found, creating a new one.');
  }
  
  // Update or add the PRIVATE_KEY in .env
  if (envContent.includes('PRIVATE_KEY=')) {
    // Replace existing private key
    envContent = envContent.replace(
      /PRIVATE_KEY=.*/,
      `PRIVATE_KEY=${wallet.privateKey.slice(2)}`
    );
  } else {
    // Add new private key if it doesn't exist
    envContent += `\nPRIVATE_KEY=${wallet.privateKey.slice(2)}\n`;
  }
  
  // Write back to .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Private key saved to .env file');
  
  // Fund instructions
  console.log('\n=== NEXT STEPS ===');
  console.log('1. Fund your wallet on Sepolia testnet using one of these faucets:');
  console.log('   - https://sepoliafaucet.com');
  console.log('   - https://sepolia-faucet.pk910.de');
  console.log('   - https://faucet.sepolia.dev');
  console.log('\n2. Once funded, start the wallet server:');
  console.log('   node scripts/wallet-server.js');
  console.log('\n⚠️ IMPORTANT: BACKUP YOUR MNEMONIC PHRASE SECURELY AND NEVER SHARE IT');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error generating wallet:');
    console.error(error);
    process.exit(1);
  }); 