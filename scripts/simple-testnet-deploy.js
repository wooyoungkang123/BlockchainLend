// Ultra Simple Sepolia Deployment
// Deploys a simple storage contract to verify deployment works
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting ultra simple Sepolia deployment...");
  
  // Get deployer account and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  // No specific gas settings - use the ones from hardhat.config.js
  
  try {
    // Verify we're on Sepolia
    const network = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Deploy Simple Storage - smallest possible contract
    console.log("\nDeploying SimpleStorage...");
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();
    
    const txHash = simpleStorage.deploymentTransaction().hash;
    console.log(`SimpleStorage deployment transaction sent: ${txHash}`);
    console.log("View on Etherscan: https://sepolia.etherscan.io/tx/" + txHash);
    console.log("Waiting for confirmation...");
    
    await simpleStorage.waitForDeployment();
    const contractAddress = await simpleStorage.getAddress();
    
    console.log(`\n🎉 SUCCESS! SimpleStorage deployed to: ${contractAddress}`);
    console.log("View contract: https://sepolia.etherscan.io/address/" + contractAddress);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "sepolia",
      simpleStorageContract: {
        address: contractAddress,
        transactionHash: txHash
      },
      timestamp: new Date().toISOString(),
      chainId: Number(network.chainId)
    };
    
    fs.writeFileSync(
      "sepolia-simple-storage.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nDeployment information saved to sepolia-simple-storage.json");
    
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