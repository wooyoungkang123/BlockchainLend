// Super Minimal Sepolia Deployment - TestToken Only
// Uses the lowest possible gas settings to deploy just the TestToken
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting super minimal Sepolia deployment (TestToken only)...");
  
  // Get deployer account and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  // Higher gas settings to ensure transaction gets mined
  const gasSettings = {
    gasLimit: 1200000,  // 1.2 million gas units
    gasPrice: ethers.parseUnits("5", "gwei")  // 5 gwei - higher priority
  };
  
  console.log("Higher Gas settings for guaranteed mining:");
  console.log(`  - Gas limit: 1,200,000 units`);
  console.log(`  - Gas price: 5 gwei`);
  
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
    console.log("Waiting for confirmation (this may take 1-2 minutes)...");
    
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
    console.log("\nToken deployment complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFatal error in deployment script:");
    console.error(error);
    process.exit(1);
  }); 