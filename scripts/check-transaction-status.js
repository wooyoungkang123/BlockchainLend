const { ethers } = require("hardhat");

async function main() {
  // Connect to the network
  const provider = await ethers.provider;
  
  // Get the signer
  const [deployer] = await ethers.getSigners();
  const address = await deployer.address;
  
  console.log(`Checking transaction status for: ${address}`);
  
  // Get the current balance
  const balance = await provider.getBalance(address);
  console.log(`Current balance: ${ethers.formatEther(balance)} ETH`);
  
  // Get nonce information
  const currentNonce = await provider.getTransactionCount(address, "latest");
  const pendingNonce = await provider.getTransactionCount(address, "pending");
  
  console.log(`Latest confirmed nonce: ${currentNonce}`);
  console.log(`Pending nonce: ${pendingNonce}`);
  
  if (pendingNonce > currentNonce) {
    console.log(`There are ${pendingNonce - currentNonce} pending transactions.`);
    console.log("You may need to wait for these to confirm or cancel them.");
  } else {
    console.log("No pending transactions.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 