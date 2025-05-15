// Transaction monitoring script for Sepolia
const { ethers } = require("hardhat");

// The transaction hash to monitor
const TX_HASH = "0x1f5377c6ba349166af53515af3c316244ca4c451c423307cb28c4d23d0561695";

async function main() {
  console.log("📡 Transaction Monitoring Tool 📡");
  console.log(`Monitoring transaction: ${TX_HASH}`);
  
  // Connect to the provider
  const provider = await ethers.provider;
  
  // Get network info
  const network = await provider.getNetwork();
  console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
  
  // Try to get transaction details
  console.log("\nFetching transaction details...");
  const tx = await provider.getTransaction(TX_HASH);
  
  if (!tx) {
    console.log("⚠️ Transaction not found. It might be pending or doesn't exist.");
    return;
  }
  
  console.log("\n📝 Transaction Details:");
  console.log(`From: ${tx.from}`);
  console.log(`To: ${tx.to || "Contract Creation"}`);
  console.log(`Value: ${ethers.formatEther(tx.value || 0)} ETH`);
  console.log(`Nonce: ${tx.nonce}`);
  
  // Gas information
  const gasPrice = tx.gasPrice ? ethers.formatUnits(tx.gasPrice, "gwei") : 
                  (tx.maxFeePerGas ? ethers.formatUnits(tx.maxFeePerGas, "gwei") : "Unknown");
  console.log(`Gas Price: ${gasPrice} gwei`);
  console.log(`Gas Limit: ${tx.gasLimit.toString()}`);
  
  // Check confirmation status
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  if (!receipt) {
    console.log("\n⏳ Transaction Status: PENDING");
    console.log("The transaction has been submitted but not yet mined.");
    
    // Get latest block
    const latestBlock = await provider.getBlockNumber();
    console.log(`Current block height: ${latestBlock}`);
    
    // Estimate confirmation time
    console.log("\nWaiting for confirmation...");
    const newReceipt = await provider.waitForTransaction(TX_HASH, 1, 120000); // 2 minute timeout
    
    if (newReceipt) {
      console.log(`\n✅ Transaction confirmed in block #${newReceipt.blockNumber}!`);
      displayReceipt(newReceipt);
    } else {
      console.log("\n⚠️ Transaction still pending after waiting 2 minutes.");
    }
  } else {
    // Transaction is already confirmed
    const confirmationBlocks = await provider.getBlockNumber() - receipt.blockNumber + 1;
    
    console.log(`\n✅ Transaction Status: CONFIRMED`);
    console.log(`Included in block #${receipt.blockNumber}`);
    console.log(`Confirmations: ${confirmationBlocks}`);
    displayReceipt(receipt);
    
    // Check if it's a contract creation
    if (receipt.contractAddress) {
      console.log(`\n🏗️ Contract deployed at: ${receipt.contractAddress}`);
      console.log(`Etherscan: https://sepolia.etherscan.io/address/${receipt.contractAddress}`);
    }
  }
}

// Helper function to display receipt information
function displayReceipt(receipt) {
  console.log(`Gas Used: ${receipt.gasUsed.toString()} units`);
  
  const status = receipt.status === 1 ? "SUCCESS" : "FAILED";
  console.log(`Execution Status: ${status}`);
  
  if (receipt.effectiveGasPrice) {
    const txFee = ethers.formatEther(receipt.gasUsed * receipt.effectiveGasPrice);
    console.log(`Transaction Fee: ${txFee} ETH`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error monitoring transaction:", error);
    process.exit(1);
  }); 