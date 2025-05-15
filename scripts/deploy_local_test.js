// Simplified deployment script for local testing
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting simplified deployment for local testing...");
  
  try {
    // Get the first signer for deployment
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // First deploy a mock ERC20 token
    console.log("Deploying mock ERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Mock USD", "mUSD");
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("Mock token deployed to:", tokenAddress);
    
    // Mint some tokens to the deployer
    const mintAmount = ethers.parseUnits("1000000", 18); // 1 million tokens
    await mockToken.mint(deployer.address, mintAmount);
    console.log("Minted tokens to deployer:", ethers.formatUnits(mintAmount, 18));
    
    // Deploy LendingPool with mock price feed
    console.log("Deploying LendingPool with mock price feed...");
    
    // Create a mock price feed contract in memory (we don't deploy it)
    const mockPriceFeedAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // A dummy address
    
    // Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(tokenAddress, mockPriceFeedAddress);
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log("LendingPool deployed to:", lendingPoolAddress);
    console.log("Mock Token:", tokenAddress);
    console.log("Mock Price Feed:", mockPriceFeedAddress);
    
    // Save deployment info to a file
    const fs = require("fs");
    const deploymentInfo = {
      network: "localhost",
      lendingPool: lendingPoolAddress,
      tokenAddress: tokenAddress,
      mockPriceFeed: mockPriceFeedAddress,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      "local-deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Deployment information saved to local-deployment-info.json");
    
    return {
      token: tokenAddress,
      lendingPool: lendingPoolAddress
    };
  } catch (error) {
    console.error("Deployment failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then((deployed) => {
    console.log("Local deployment completed successfully!");
    console.log("Deployed contracts:", deployed);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  }); 