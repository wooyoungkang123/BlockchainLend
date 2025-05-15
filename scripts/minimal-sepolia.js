// Sepolia Deployment Script with lower gas settings
// Deploys TestToken contract to Sepolia testnet
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting Sepolia deployment with lower gas settings...");
  
  // Get deployer account and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  // Lower gas settings to avoid out-of-gas errors
  const gasSettings = {
    gasLimit: 800000,  // 800k gas units
    gasPrice: ethers.parseUnits("3", "gwei")  // 3 gwei - moderate priority
  };
  
  console.log("Lower Gas settings:");
  console.log(`  - Gas limit: 800,000 units`);
  console.log(`  - Gas price: 3 gwei`);
  
  try {
    // Verify we're on Sepolia
    const network = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    if (network.chainId !== 11155111n) {
      throw new Error("Not connected to Sepolia! Please check your RPC configuration.");
    }
    
    // Deploy TestToken only
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
    console.log("Waiting for confirmation (this may take 3-5 minutes)...");
    
    await testToken.waitForDeployment();
    const tokenAddress = await testToken.getAddress();
    console.log(`\n🎉 SUCCESS! TestToken deployed to: ${tokenAddress}`);
    console.log("View contract: https://sepolia.etherscan.io/address/" + tokenAddress);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "sepolia",
      tokenContract: {
        address: tokenAddress,
        transactionHash: tokenTxHash
      },
      timestamp: new Date().toISOString(),
      chainId: Number(network.chainId)
    };
    
    fs.writeFileSync(
      "sepolia-token.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nToken information saved to sepolia-token.json");
    console.log("You can now add this token to MetaMask for testing");
    
    // Now try to deploy the price feed with even lower gas
    console.log("\nDeploying MockPriceFeed...");
    const priceFeedGasSettings = {
      gasLimit: 500000,  // Even lower for price feed
      gasPrice: ethers.parseUnits("3", "gwei")
    };
    
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const ethPrice = 2000; // $2000 per ETH
    const priceFeed = await MockPriceFeed.deploy(
      ethers.parseUnits(ethPrice.toString(), 8), // Price in 8 decimals
      8, // Decimals
      priceFeedGasSettings
    );
    
    const priceFeedTxHash = priceFeed.deploymentTransaction().hash;
    console.log(`MockPriceFeed deployment transaction sent: ${priceFeedTxHash}`);
    console.log("View on Etherscan: https://sepolia.etherscan.io/tx/" + priceFeedTxHash);
    console.log("Waiting for confirmation...");
    
    await priceFeed.waitForDeployment();
    const priceFeedAddress = await priceFeed.getAddress();
    
    console.log(`\nMockPriceFeed deployed to: ${priceFeedAddress}`);
    
    // Update the deployment info
    deploymentInfo.priceFeedContract = {
      address: priceFeedAddress,
      transactionHash: priceFeedTxHash
    };
    
    fs.writeFileSync(
      "sepolia-deployment.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nDeployment information updated in sepolia-deployment.json");
    
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
    console.log("\nDeployment process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFatal error in deployment script:");
    console.error(error);
    process.exit(1);
  }); 