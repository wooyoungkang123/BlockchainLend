// Direct Sepolia deployment script - bypasses local node completely
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Get the contract ABI and bytecode
const LendingPoolJson = require("../artifacts/contracts/LendingPool.sol/LendingPool.json");

// Public Sepolia RPC (no API key needed)
const PUBLIC_RPC = "https://eth-sepolia.g.alchemy.com/v2/alcht_IKzFDPnvW1RB3QseWxNUSEXDOb3Uan";
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

  console.log("Starting direct Sepolia deployment...");
  console.log("Using public RPC endpoint, bypassing local node");

  // Connect to Sepolia using public RPC
  const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
  console.log("Connected to Sepolia network");

  // Create wallet from private key
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deployer address:", wallet.address);

  // Check account balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Create contract factory
  const factory = new ethers.ContractFactory(
    LendingPoolJson.abi,
    LendingPoolJson.bytecode,
    wallet
  );
  
  console.log("Deploying LendingPool to Sepolia...");
  console.log("Using these parameters:");
  console.log("- Token address:", DUMMY_TOKEN);
  console.log("- Price feed:", SEPOLIA_ETH_USD_FEED);

  // Fixed gas price deployment for better reliability
  const deploymentOptions = {
    gasPrice: ethers.parseUnits("3", "gwei"),
    gasLimit: 2000000
  };
  
  try {
    // Deploy the contract
    const contract = await factory.deploy(
      DUMMY_TOKEN, 
      SEPOLIA_ETH_USD_FEED, 
      deploymentOptions
    );
    
    console.log("Transaction sent! Hash:", contract.deploymentTransaction().hash);
    console.log("Waiting for confirmation (this may take a few minutes)...");
    
    // Wait for deployment
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("✅ Contract deployed successfully!");
    console.log("Contract address:", contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      contractAddress: contractAddress,
      transactionHash: contract.deploymentTransaction().hash,
      tokenAddress: DUMMY_TOKEN,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      "sepolia-direct-deployment.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("Deployment information saved to sepolia-direct-deployment.json");
    return deploymentInfo;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    // Check for common errors
    if (error.message.includes("insufficient funds")) {
      console.error("Not enough ETH in your account for deployment");
    }
    if (error.message.includes("nonce")) {
      console.error("Nonce issue - you may have pending transactions");
    }
    if (error.message.includes("could not detect network") || error.message.includes("invalid response")) {
      console.error("Network connection issue - the public RPC may be congested");
      console.error("Try using your Alchemy API key directly");
    }
    process.exit(1);
  }
}

// Execute with timeout
const timeout = 300000; // 5 minutes
const deploymentPromise = main()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

setTimeout(() => {
  console.error("Deployment timed out after 5 minutes");
  console.error("The transaction might still be pending - check Sepolia explorer with your wallet address");
  process.exit(1);
}, timeout); 