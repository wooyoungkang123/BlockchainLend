// Minimal Sepolia Deployment for the DeFi Lending App
// Deploys both TestToken and LendingPool with minimal gas settings
const hre = require("hardhat");
const { ethers } = require("hardhat");

// Chainlink ETH/USD Price Feed on Sepolia
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

async function main() {
  console.log("Starting minimal Sepolia deployment...");
  
  // Get deployer account and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  // Minimal gas settings to save on costs
  const gasSettings = {
    gasLimit: 1500000,  // 1.5 million gas units (reduced from 2M)
    gasPrice: ethers.parseUnits("2", "gwei")  // 2 gwei (reduced from 3)
  };
  
  console.log("Gas settings:");
  console.log(`  - Gas limit: 1,500,000 units`);
  console.log(`  - Gas price: 2 gwei`);
  
  try {
    // Deploy TestToken first
    console.log("\nDeploying TestToken (USDC mock)...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy(
      "USD Coin",          // name
      "USDC",              // symbol
      6,                   // decimals (USDC has 6 decimals)
      gasSettings
    );
    
    const tokenTxHash = testToken.deploymentTransaction().hash;
    console.log(`TestToken deployment transaction sent: ${tokenTxHash}`);
    console.log("View on Etherscan: https://sepolia.etherscan.io/tx/" + tokenTxHash);
    console.log("Waiting for confirmation...");
    
    await testToken.waitForDeployment();
    const tokenAddress = await testToken.getAddress();
    console.log(`TestToken deployed to: ${tokenAddress}`);
    
    // Now deploy LendingPool with the TestToken address
    console.log("\nDeploying LendingPool...");
    const LendingPool = await ethers.getContractFactory("contracts/LendingPool.sol:LendingPool");
    const lendingPool = await LendingPool.deploy(
      tokenAddress,
      SEPOLIA_ETH_USD_FEED,
      gasSettings
    );
    
    const poolTxHash = lendingPool.deploymentTransaction().hash;
    console.log(`LendingPool deployment transaction sent: ${poolTxHash}`);
    console.log("View on Etherscan: https://sepolia.etherscan.io/tx/" + poolTxHash);
    console.log("Waiting for confirmation...");
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log(`\n🎉 SUCCESS! Deployment completed:`);
    console.log(`  - TestToken (USDC): ${tokenAddress}`);
    console.log(`  - LendingPool: ${lendingPoolAddress}`);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "sepolia",
      tokenContract: {
        address: tokenAddress,
        transactionHash: tokenTxHash
      },
      lendingPoolContract: {
        address: lendingPoolAddress,
        transactionHash: poolTxHash
      },
      priceFeed: SEPOLIA_ETH_USD_FEED,
      timestamp: new Date().toISOString(),
      chainId: (await ethers.provider.getNetwork()).chainId
    };
    
    fs.writeFileSync(
      "sepolia-deployment.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nDeployment information saved to sepolia-deployment.json");
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