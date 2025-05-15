// Targeted Sepolia deployment with proper nonce management
require("dotenv").config();
const { ethers } = require("hardhat");
const hre = require("hardhat");

// Sepolia Chainlink ETH/USD Price Feed
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
// Dummy token address for testing
const DUMMY_TOKEN = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

async function main() {
  // Make sure we're on Sepolia
  if (hre.network.name !== "sepolia") {
    console.log("This script is intended to be run on the Sepolia network");
    console.log(`Current network: ${hre.network.name}`);
    console.log("Please run with: npx hardhat run scripts/targeted-sepolia-deploy.js --network sepolia");
    return;
  }
  
  console.log("📌 TARGETED Sepolia Deployment 📌");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  // Get account details
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Get nonce information for proper transaction sequencing
  const confirmedNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log(`Confirmed nonce: ${confirmedNonce}`);
  console.log(`Pending nonce: ${pendingNonce}`);
  
  // Use the next available nonce (either pending or confirmed + 1)
  const useNonce = pendingNonce > confirmedNonce ? pendingNonce : confirmedNonce;
  console.log(`Using nonce: ${useNonce}`);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
  
  // Deploy the LendingPool contract
  const LendingPool = await ethers.getContractFactory("LendingPool");
  console.log("\nDeploying LendingPool contract...");
  console.log(`- Token address: ${DUMMY_TOKEN}`);
  console.log(`- Price feed: ${SEPOLIA_ETH_USD_FEED}`);
  
  // Use moderate gas settings - not too high (to save ETH) but high enough to get included
  const gasSettings = {
    nonce: useNonce,
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits("7", "gwei") // 7 gwei is reasonable for Sepolia
  };
  
  console.log("\n⛽ Gas settings:");
  console.log(`- Gas Price: 7 gwei`);
  console.log(`- Gas Limit: 3,000,000 units`);
  console.log(`- Nonce: ${useNonce}`);
  
  try {
    console.log("\n🚀 Sending deployment transaction...");
    // Deploy with appropriate parameters
    const lendingPool = await LendingPool.deploy(
      DUMMY_TOKEN,
      SEPOLIA_ETH_USD_FEED,
      gasSettings
    );
    
    const txHash = lendingPool.deploymentTransaction().hash;
    console.log(`Transaction hash: ${txHash}`);
    console.log("⏳ Waiting for confirmation (this could take a minute or two)...");
    
    // Wait for deployment 
    await lendingPool.waitForDeployment();
    const contractAddress = await lendingPool.getAddress();
    
    console.log("\n✅ Deployment successful!");
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Transaction hash: ${txHash}`);
    
    // Save deployment details
    const fs = require("fs");
    const deploymentDetails = {
      network: network.name,
      chainId: network.chainId,
      contractAddress: contractAddress,
      tokenAddress: DUMMY_TOKEN,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      deploymentTx: txHash,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      `deployment-${network.name}-${new Date().toISOString().replace(/:/g, "-")}.json`,
      JSON.stringify(deploymentDetails, null, 2)
    );
    
    console.log("Deployment information saved to file");
    
  } catch (error) {
    console.error("⚠️ Deployment failed:", error.message);
    
    // Provide helpful next steps based on the error
    if (error.message.includes("insufficient funds")) {
      console.log("\nYou don't have enough ETH to complete this deployment.");
      console.log("Try getting some Sepolia ETH from a faucet like:");
      console.log("- https://sepoliafaucet.com/");
      console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
    } else if (error.message.includes("replacement transaction underpriced")) {
      console.log("\nOne of your previous transactions is still pending.");
      console.log("Try running the cancel-transactions.js script to clear the pending tx queue.");
    } else if (error.message.includes("nonce too low")) {
      console.log("\nThe nonce used is too low. A transaction with this nonce has already been confirmed.");
      console.log("Try running this script again to use the latest nonce.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 