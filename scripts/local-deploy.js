// Local Hardhat Deployment Script
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting local deployment of test tokens and lending contracts...");
  
  // Get deployer account and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  try {
    // Verify we're on localhost
    const network = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Deploy TestToken (USDC mock)
    console.log("\nDeploying TestToken (USDC mock)...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy(
      "USD Coin",          // name
      "USDC",              // symbol
      6                    // decimals (USDC has 6 decimals)
    );
    
    await testToken.waitForDeployment();
    const tokenAddress = await testToken.getAddress();
    console.log(`\n🎉 SUCCESS! TestToken deployed to: ${tokenAddress}`);
    
    // Deploy MockPriceFeed for ETH/USD
    console.log("\nDeploying MockPriceFeed...");
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const ethPrice = 2000; // $2000 per ETH
    const priceFeed = await MockPriceFeed.deploy(
      ethers.parseUnits(ethPrice.toString(), 8), // Price in 8 decimals (Chainlink standard)
      8 // Decimals
    );
    
    await priceFeed.waitForDeployment();
    const priceFeedAddress = await priceFeed.getAddress();
    console.log(`\n🎉 SUCCESS! MockPriceFeed deployed to: ${priceFeedAddress}`);
    console.log(`Price set to: $${ethPrice} per ETH`);
    
    // Deploy LendingPool
    console.log("\nDeploying LendingPool...");
    const LendingPool = await ethers.getContractFactory("contracts/LendingPool.sol:LendingPool");
    const lendingPool = await LendingPool.deploy(tokenAddress, priceFeedAddress);
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log(`\n🎉 SUCCESS! LendingPool deployed to: ${lendingPoolAddress}`);
    
    // Fund the first account with test tokens
    console.log("\nFunding test account with USDC...");
    const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
    await testToken.mint(deployer.address, mintAmount);
    console.log(`Minted 10,000 USDC to ${deployer.address}`);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "localhost",
      tokenContract: {
        address: tokenAddress,
      },
      priceFeedContract: {
        address: priceFeedAddress,
        initialPrice: `$${ethPrice} per ETH`
      },
      lendingPool: {
        address: lendingPoolAddress,
      },
      timestamp: new Date().toISOString(),
      chainId: Number(network.chainId)
    };
    
    fs.writeFileSync(
      "local-deployment.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nDeployment information saved to local-deployment.json");
    console.log("You can now add these tokens to MetaMask for testing");
    
    return deploymentInfo;
    
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    process.exit(1);
  }
}

// Run the deployment
main()
  .then((deploymentInfo) => {
    console.log("\nDeployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFatal error in deployment script:");
    console.error(error);
    process.exit(1);
  }); 