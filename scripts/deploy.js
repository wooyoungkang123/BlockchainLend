// deploy.js - Script to compile and deploy a contract using Hardhat and the wallet server
const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ethers } = require("hardhat");
const { updateContractAddress } = require('./helpers/config');

// Configuration
const walletServer = 'http://localhost:3000';
const contractName = process.argv[2] || 'SimpleStorage'; // Default to SimpleStorage or use CLI arg

async function main() {
  console.log("Starting deployment process...");

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Deploy MockToken (USDC with 6 decimals)
  const MockToken = await ethers.getContractFactory('MockToken');
  const token = await MockToken.deploy('USD Coin', 'USDC', 6);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`MockToken deployed to: ${tokenAddress}`);
  updateContractAddress('localhost', 'MockToken', tokenAddress);

  // Deploy MockPriceFeed
  const INITIAL_ETH_PRICE = 2000 * 10**8; // $2000 with 8 decimals
  const MockPriceFeed = await ethers.getContractFactory('MockPriceFeed');
  const priceFeed = await MockPriceFeed.deploy(INITIAL_ETH_PRICE, 8);
  await priceFeed.waitForDeployment();
  const priceFeedAddress = await priceFeed.getAddress();
  console.log(`MockPriceFeed deployed to: ${priceFeedAddress}`);
  updateContractAddress('localhost', 'MockPriceFeed', priceFeedAddress);

  // Deploy LendingPool
  const LendingPool = await ethers.getContractFactory('contracts/core/LendingPool.sol:LendingPool');
  const lendingPool = await LendingPool.deploy(tokenAddress, priceFeedAddress);
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log(`LendingPool deployed to: ${lendingPoolAddress}`);
  updateContractAddress('localhost', 'LendingPool', lendingPoolAddress);

  // Initialize: Mint initial tokens to deployer
  const INITIAL_TOKEN_SUPPLY = 1000000 * 10**6; // 1,000,000 USDC with 6 decimals
  await token.mint(deployer.address, INITIAL_TOKEN_SUPPLY);
  console.log(`Minted ${INITIAL_TOKEN_SUPPLY} tokens to deployer`);

  // Initialize: Transfer some tokens to the lending pool
  await token.mint(lendingPoolAddress, INITIAL_TOKEN_SUPPLY / 10);
  console.log(`Minted ${INITIAL_TOKEN_SUPPLY / 10} tokens to lending pool`);

  console.log('Deployment completed successfully!');

  return {
    mockToken: tokenAddress,
    lendingPool: lendingPoolAddress
  };
}

// Execute the deployment
main()
  .then((deployedContracts) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 