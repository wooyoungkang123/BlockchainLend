// Simplified Sepolia Deployment
// Only deploys the LendingPool with a dummy token address
const hre = require("hardhat");
const { ethers } = require("hardhat");

// Chainlink ETH/USD Price Feed on Sepolia
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

// Dummy token address (this would be replaced with a real token in production)
const DUMMY_TOKEN = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

async function main() {
  console.log("Starting simplified Sepolia deployment...");
  console.log("This script only deploys the LendingPool contract");
  
  // Get deployer account and check balance
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  // Prepare LendingPool deployment with fully qualified name
  const LendingPool = await ethers.getContractFactory("contracts/LendingPool.sol:LendingPool");
  console.log("Preparing LendingPool deployment...");
  
  // Very conservative gas settings to ensure transaction is processed
  const gasSettings = {
    gasLimit: 2000000,  // 2 million gas units
    gasPrice: ethers.parseUnits("3", "gwei")  // Fixed gas price approach (more reliable on Sepolia)
  };
  
  console.log("Gas settings:");
  console.log(`  - Gas limit: 2,000,000 units`);
  console.log(`  - Gas price: 3 gwei`);
  
  // Deploy with simplified parameters
  console.log(`Using dummy token: ${DUMMY_TOKEN}`);
  console.log(`Using ETH/USD price feed: ${SEPOLIA_ETH_USD_FEED}`);
  
  try {
    // Deploy the contract
    console.log("Sending deployment transaction...");
    const lendingPool = await LendingPool.deploy(
      DUMMY_TOKEN, 
      SEPOLIA_ETH_USD_FEED,
      gasSettings
    );
    
    const txHash = lendingPool.deploymentTransaction().hash;
    console.log(`Deployment transaction sent: ${txHash}`);
    console.log("View on Etherscan: https://sepolia.etherscan.io/tx/" + txHash);
    console.log("Waiting for confirmation (may take 1-3 minutes)...");
    
    // Wait for deployment confirmation
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log(`\n🎉 SUCCESS! LendingPool deployed to: ${lendingPoolAddress}`);
    console.log("View contract: https://sepolia.etherscan.io/address/" + lendingPoolAddress);
    
    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
      network: "sepolia",
      contractAddress: lendingPoolAddress,
      transactionHash: txHash,
      dummyToken: DUMMY_TOKEN,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      timestamp: new Date().toISOString(),
      chainId: (await ethers.provider.getNetwork()).chainId
    };
    
    fs.writeFileSync(
      "sepolia-contract.json", 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("Deployment information saved to sepolia-contract.json");
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