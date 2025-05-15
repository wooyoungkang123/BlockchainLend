// wallet-server.js - Simple Ethers.js wallet server for Cursor integration
require('dotenv').config();
const { ethers } = require('ethers');
const http = require('http');
const url = require('url');
const crypto = require('crypto');

// Check if the private key is available
let privateKey = process.env.PRIVATE_KEY;
let useEnvKey = true;

// Generate a random key if no private key is provided in .env
if (!privateKey) {
  console.warn('⚠️ No PRIVATE_KEY found in .env file. Generating a random key for development only.');
  privateKey = crypto.randomBytes(32).toString('hex');
  useEnvKey = false;
}

// Use the specified RPC URL or default to Hardhat local
const rpcUrl = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Create wallet from private key
const wallet = new ethers.Wallet(privateKey, provider);

console.log(`Wallet server started with address: ${wallet.address}`);
console.log(`Network: ${rpcUrl}`);
console.log(`Using ${useEnvKey ? '.env private key' : 'randomly generated key (development only)'}`);

if (!useEnvKey) {
  console.log('----------------------------------------');
  console.log('⚠️ DEVELOPMENT MODE - DO NOT USE IN PRODUCTION');
  console.log('To use your own wallet, add your private key to the .env file:');
  console.log('PRIVATE_KEY=yourprivatekeyhere');
  console.log('----------------------------------------');
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  res.setHeader('Content-Type', 'application/json');

  try {
    if (path === '/info') {
      // Return wallet info
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(wallet.address);
      
      res.end(JSON.stringify({
        address: wallet.address,
        balance: ethers.formatEther(balance),
        network: network.name !== 'unknown' ? network.name : rpcUrl,
        chainId: network.chainId
      }));
    } else if (path === '/generate-key') {
      // Generate a new private key and address (for development only)
      const newWallet = ethers.Wallet.createRandom();
      
      res.end(JSON.stringify({
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        mnemonic: newWallet.mnemonic?.phrase,
        message: '⚠️ SAVE THIS INFORMATION SECURELY AND NEVER SHARE IT'
      }));
    } else if (path === '/deploy') {
      // Deploy a contract
      if (!query.abi || !query.bytecode) {
        throw new Error('Missing ABI or bytecode');
      }
      
      const abi = JSON.parse(query.abi);
      const bytecode = query.bytecode;
      
      const factory = new ethers.ContractFactory(abi, bytecode, wallet);
      const deployTx = await factory.deploy();
      
      const receipt = await deployTx.deploymentTransaction().wait();
      
      res.end(JSON.stringify({
        contractAddress: deployTx.target,
        deploymentTx: receipt.hash
      }));
    } else if (path === '/call') {
      // Call a contract method
      if (!query.address || !query.abi || !query.method) {
        throw new Error('Missing address, ABI, or method');
      }
      
      const address = query.address;
      const abi = JSON.parse(query.abi);
      const method = query.method;
      const params = query.params ? JSON.parse(query.params) : [];
      
      const contract = new ethers.Contract(address, abi, wallet);
      const result = await contract[method](...params);
      
      res.end(JSON.stringify({ result }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Wallet server listening on port ${PORT}`);
}); 