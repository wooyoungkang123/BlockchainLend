// Load environment variables from .env file
require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
require('@nomicfoundation/hardhat-verify');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
      },
      {
        version: "0.8.28",
      }
    ]
  },
  networks: {
    hardhat: {
      // Makes hardhat accounts deterministic with known private keys
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20
      }
    },
    // Configuration for Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      gasPrice: 2000000000, // 2 gwei - reduced from 3
      gas: 1000000, // 1 million gas limit - reduced from 2 million
      // Added blockGasLimit to prevent out-of-gas errors
      blockGasLimit: 8000000
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  // Etherscan API key for contract verification
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  }
};
