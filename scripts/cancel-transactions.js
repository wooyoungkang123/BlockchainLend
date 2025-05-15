// Cancel stuck transactions by sending a zero-value tx with higher gas
const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Transaction Cancellation Tool 🔥");
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);
  
  // Get current parameters
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log(`Latest confirmed nonce: ${currentNonce}`);
  console.log(`Pending nonce: ${pendingNonce}`);
  
  if (pendingNonce <= currentNonce) {
    console.log("No pending transactions to cancel. Exiting...");
    return;
  }
  
  console.log(`Found ${pendingNonce - currentNonce} pending transactions`);
  console.log("Sending cancellation transactions...");
  
  // Send cancellation transactions for each pending nonce
  for (let nonce = currentNonce; nonce < pendingNonce; nonce++) {
    console.log(`\nCancelling transaction with nonce ${nonce}...`);
    
    // Create a transaction with same nonce but 0 ETH transfer to ourselves
    // With an extremely high gas price to ensure it's mined quickly
    const tx = {
      to: deployer.address, // send to ourselves
      value: 0,             // zero eth transfer
      nonce: nonce,         // use the nonce we want to cancel
      gasLimit: 21000,      // minimum gas for ETH transfer
      maxFeePerGas: ethers.parseUnits("25", "gwei"),         // extremely high max fee
      maxPriorityFeePerGas: ethers.parseUnits("10", "gwei"), // extremely high priority fee
    };
    
    try {
      // Send the transaction
      const response = await deployer.sendTransaction(tx);
      console.log(`Cancellation transaction sent! Hash: ${response.hash}`);
      
      // Wait for it to be mined
      console.log("Waiting for confirmation...");
      const receipt = await response.wait();
      console.log(`Transaction with nonce ${nonce} successfully cancelled!`);
      console.log(`Gas used: ${receipt.gasUsed} units`);
    } catch (error) {
      console.error(`Error cancelling transaction with nonce ${nonce}:`, error.message);
    }
  }
  
  console.log("\nCancellation process complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in cancellation script:", error);
    process.exit(1);
  }); 