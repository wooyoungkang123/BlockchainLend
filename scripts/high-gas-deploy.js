// High-gas Sepolia deployment script - uses 10 gwei for quick confirmation
const { ethers } = require("ethers");
const fs = require("fs");

// Get the contract ABI and bytecode
const LendingPoolJson = require("../artifacts/contracts/LendingPool.sol/LendingPool.json");

// Alchemy RPC
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/alcht_IKzFDPnvW1RB3QseWxNUSEXDOb3Uan";
// Sepolia Chainlink ETH/USD Price Feed
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
// Dummy token address for testing
const DUMMY_TOKEN = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

// Load private key from .env file
require("dotenv").config();
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("No private key found in .env file");
  }

  console.log("🚀 Starting HIGH GAS Sepolia deployment...");
  console.log("Using 10 gwei gas price for fast inclusion!");

  // Connect to Sepolia
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log("Connected to Sepolia network");

  // Create wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deployer address:", wallet.address);

  // Check account balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }
  
  // Get current nonce
  const currentNonce = await provider.getTransactionCount(wallet.address);
  console.log("Current account nonce:", currentNonce);

  // Create contract factory
  const factory = new ethers.ContractFactory(
    LendingPoolJson.abi,
    LendingPoolJson.bytecode,
    wallet
  );
  
  console.log("\n📝 Deployment configuration:");
  console.log("- Token address:", DUMMY_TOKEN);
  console.log("- Price feed:", SEPOLIA_ETH_USD_FEED);

  // High gas price deployment settings
  const deploymentOptions = {
    gasPrice: ethers.parseUnits("10", "gwei"),  // 10 gwei - much higher priority
    gasLimit: 3000000,  // 3 million gas units
    nonce: currentNonce  // use current nonce to ensure it goes through
  };
  
  console.log("\n⛽ Gas settings:");
  console.log("- Gas Price: 10 gwei (very high for Sepolia)");
  console.log("- Gas Limit: 3,000,000 units");
  console.log("- Nonce:", currentNonce);
  
  try {
    // Deploy the contract
    console.log("\n🚀 Sending deployment transaction...");
    const contract = await factory.deploy(
      DUMMY_TOKEN, 
      SEPOLIA_ETH_USD_FEED, 
      deploymentOptions
    );
    
    const txHash = contract.deploymentTransaction().hash;
    console.log("Transaction sent! Hash:", txHash);
    console.log("View on Etherscan: https://sepolia.etherscan.io/tx/" + txHash);
    console.log("\n⏳ Waiting for confirmation (should be faster with high gas)...");
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("\n✅ SUCCESS! Contract deployed successfully!");
    console.log("Contract address:", contractAddress);
    console.log("View contract: https://sepolia.etherscan.io/address/" + contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      contractAddress: contractAddress,
      transactionHash: txHash,
      tokenAddress: DUMMY_TOKEN,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      gasPrice: "10 gwei",
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      "sepolia-successful-deployment.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n💾 Deployment information saved to sepolia-successful-deployment.json");
    return deploymentInfo;
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Execute with timeout
const timeout = 300000; // 5 minutes
const deploymentPromise = main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

setTimeout(() => {
  console.error("⏱️ Deployment timed out after 5 minutes");
  console.error("The transaction might still be pending - check Sepolia explorer with your wallet address");
  process.exit(1);
}, timeout); 