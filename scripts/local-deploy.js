// Local Hardhat Deployment Script
// Deploys both TestToken and LendingPool to the local Hardhat network
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting local Hardhat network deployment...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  try {
    // Verify we're on local network
    const network = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Deploy TestToken first
    console.log("\nDeploying TestToken (USDC mock)...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy(
      "USD Coin",          // name
      "USDC",              // symbol
      6                    // decimals (USDC has 6 decimals)
    );
    
    const tokenTxHash = testToken.deploymentTransaction().hash;
    console.log(`TestToken deployment transaction sent: ${tokenTxHash}`);
    
    await testToken.waitForDeployment();
    const tokenAddress = await testToken.getAddress();
    console.log(`TestToken deployed to: ${tokenAddress}`);

    // Deploy MockPriceFeed for ETH/USD
    console.log("\nDeploying MockPriceFeed...");
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const ethPrice = 2000; // $2000 per ETH
    const priceFeed = await MockPriceFeed.deploy(
      ethers.parseUnits(ethPrice.toString(), 8), // Price in 8 decimals (Chainlink standard)
      8 // Decimals
    );
    
    const priceFeedTxHash = priceFeed.deploymentTransaction().hash;
    console.log(`MockPriceFeed deployment transaction sent: ${priceFeedTxHash}`);
    
    await priceFeed.waitForDeployment();
    const priceFeedAddress = await priceFeed.getAddress();
    console.log(`MockPriceFeed deployed to: ${priceFeedAddress}`);
    console.log(`Price set to: $${ethPrice} per ETH`);
    
    // Now deploy LendingPool with the TestToken address and MockPriceFeed
    console.log("\nDeploying LendingPool...");
    const LendingPool = await ethers.getContractFactory("contracts/LendingPool.sol:LendingPool");
    
    const lendingPool = await LendingPool.deploy(
      tokenAddress,
      priceFeedAddress
    );
    
    const poolTxHash = lendingPool.deploymentTransaction().hash;
    console.log(`LendingPool deployment transaction sent: ${poolTxHash}`);
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log(`\n🎉 SUCCESS! Deployment completed:`);
    console.log(`  - TestToken (USDC): ${tokenAddress}`);
    console.log(`  - MockPriceFeed (ETH/USD): ${priceFeedAddress}`);
    console.log(`  - LendingPool: ${lendingPoolAddress}`);
    
    // Mint some tokens to the deployer for testing
    const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
    console.log(`\nMinting ${ethers.formatUnits(mintAmount, 6)} USDC to deployer...`);
    await testToken.mint(deployer.address, mintAmount);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "hardhat",
      tokenContract: {
        address: tokenAddress,
        transactionHash: tokenTxHash
      },
      priceFeedContract: {
        address: priceFeedAddress,
        transactionHash: priceFeedTxHash,
        initialPrice: `$${ethPrice} per ETH`
      },
      lendingPoolContract: {
        address: lendingPoolAddress,
        transactionHash: poolTxHash
      },
      timestamp: new Date().toISOString(),
      chainId: Number(network.chainId)
    };
    
    fs.writeFileSync(
      "local-deployment.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nDeployment information saved to local-deployment.json");
    console.log("You can now update your frontend configuration with these addresses");
    
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
    console.log("\nDeployment process completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFatal error in deployment script:");
    console.error(error);
    process.exit(1);
  }); 