// EXTREME GAS Sepolia deployment - uses 20 gwei for immediate inclusion
const { ethers } = require("ethers");
const fs = require("fs");

// Get contract ABI and bytecode
const LendingPoolJson = require("../artifacts/contracts/LendingPool.sol/LendingPool.json");

// Alchemy RPC
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/alcht_IKzFDPnvW1RB3QseWxNUSEXDOb3Uan";

// Sepolia Chainlink ETH/USD Price Feed
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
// Dummy token address
const DUMMY_TOKEN = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

// Load private key
require("dotenv").config();
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function main() {
  console.log("🔥 EXTREME GAS Sepolia deployment 🔥");
  console.log("Using 20 gwei - TOP PRIORITY transaction!");

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log("Connected to Sepolia");

  // Create wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Deployer:", wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Handle stuck transactions by incrementing nonce
  const pendingNonce = await provider.getTransactionCount(wallet.address, "pending");
  const confirmedNonce = await provider.getTransactionCount(wallet.address, "latest");
  
  console.log("Confirmed nonce:", confirmedNonce);
  console.log("Pending nonce:", pendingNonce);
  
  // If there are pending transactions, we'll skip ahead of them
  const nonce = pendingNonce > confirmedNonce ? pendingNonce + 1 : confirmedNonce;
  console.log("Using nonce:", nonce, "(skipping any stuck transactions)");

  // Create contract factory
  const factory = new ethers.ContractFactory(
    LendingPoolJson.abi,
    LendingPoolJson.bytecode,
    wallet
  );
  
  // EXTREME gas settings - this will almost certainly get picked up immediately
  const deploymentOptions = {
    gasPrice: ethers.parseUnits("20", "gwei"),  // 20 gwei - extremely high priority
    gasLimit: 4000000,  // 4 million gas units for safety
    nonce: nonce  // explicitly set nonce to skip past stuck transactions
  };
  
  console.log("\n⛽ EXTREME Gas settings:");
  console.log("- Gas Price: 20 gwei (extremely high for Sepolia)");
  console.log("- Gas Limit: 4,000,000 units");
  
  try {
    console.log("\n🚀 Deploying contract...");
    const contract = await factory.deploy(
      DUMMY_TOKEN, 
      SEPOLIA_ETH_USD_FEED, 
      deploymentOptions
    );
    
    const txHash = contract.deploymentTransaction().hash;
    console.log("Transaction hash:", txHash);
    console.log("Etherscan: https://sepolia.etherscan.io/tx/" + txHash);
    console.log("\n⏳ Waiting for confirmation...");
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("\n✅ SUCCESS! Contract deployed!");
    console.log("Address:", contractAddress);
    console.log("View: https://sepolia.etherscan.io/address/" + contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      contractAddress: contractAddress,
      transactionHash: txHash,
      tokenAddress: DUMMY_TOKEN,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      gasPrice: "20 gwei",
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      "sepolia-deployment-success.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\nDeployment information saved to sepolia-deployment-success.json");
    return deploymentInfo;
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Execute with shorter timeout
const timeout = 180000; // 3 minutes (should be plenty with this gas price)
const deploymentPromise = main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

setTimeout(() => {
  console.error("\n⏱️ Deployment timed out after 3 minutes");
  console.error("Transaction might still be pending - check Etherscan");
  process.exit(1);
}, timeout); 