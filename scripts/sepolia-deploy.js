// Optimized Sepolia deployment script
const hre = require("hardhat");
const { ethers } = require("hardhat");

// Chainlink Price Feed Address for Sepolia
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

async function main() {
  console.log("🚀 Starting optimized Sepolia deployment...");

  try {
    // Get the first signer for deployment
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      throw new Error("Insufficient balance for deployment, need at least 0.01 ETH");
    }
    
    // Deploy a mock token for testing
    console.log("Deploying mock token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    // Use high but reasonable gas settings
    const gasSettings = {
      gasLimit: ethers.parseUnits("1500000", "wei"),  // Reduced from 5M to 1.5M
      maxFeePerGas: ethers.parseUnits("10", "gwei"),  // Reduced from 25 to 10
      maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei") // Reduced from 10 to 1.5
    };
    
    console.log("Using optimized gas settings for fast inclusion:");
    console.log(`  - Gas Limit: 1,500,000 wei`);
    console.log(`  - Max Fee: 10 gwei`);
    console.log(`  - Priority Fee: 1.5 gwei`);
    
    // Deploy the token with the correct constructor (name, symbol)
    const mockToken = await MockERC20.deploy(
      "Lending Test Token", 
      "LTT",
      gasSettings
    );
    
    console.log("Token deployment tx hash:", mockToken.deploymentTransaction().hash);
    console.log("⏳ Waiting for token deployment confirmation...");
    
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("✅ Mock token deployed to:", tokenAddress);
    
    // Deploy the LendingPool with the Chainlink price feed
    console.log("Deploying LendingPool with Chainlink integration...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    
    const lendingPool = await LendingPool.deploy(
      tokenAddress, 
      SEPOLIA_ETH_USD_FEED,
      gasSettings
    );
    
    console.log("LendingPool deployment tx hash:", lendingPool.deploymentTransaction().hash);
    console.log("⏳ Waiting for LendingPool deployment confirmation...");
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log("✅ LendingPool successfully deployed!");
    console.log("LendingPool address:", lendingPoolAddress);
    console.log("Token address:", tokenAddress);
    console.log("Price feed used:", SEPOLIA_ETH_USD_FEED);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "sepolia",
      lendingPool: lendingPoolAddress,
      tokenAddress: tokenAddress,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      deploymentTxHash: lendingPool.deploymentTransaction().hash,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      "sepolia-deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("✅ Deployment information saved to sepolia-deployment-info.json");
    return deploymentInfo;
  } catch (error) {
    console.error("❌ Deployment failed with error:", error);
    process.exit(1);
  }
}

// Execute with a 5-minute timeout
const timeoutMs = 5 * 60 * 1000;
const deploymentPromise = main()
  .then((deploymentInfo) => {
    console.log("\n✅ Sepolia deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error in deployment:", error);
    process.exit(1);
  });

setTimeout(() => {
  console.error("\n⏱️ Deployment timed out after 5 minutes");
  console.error("The transaction might still be pending - check Sepolia explorer");
  process.exit(1);
}, timeoutMs); 