// scripts/verify_contract.js
const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  // Contract address from previous deployment
  const contractAddress = "0x09635F643e140090A9A8Dcd712eD6285858ceBef";
  
  // Constructor arguments used during deployment
  const constructorArgs = ["0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"]; // Token address
  
  console.log("Verifying LendingPool contract on Etherscan...");
  console.log(`Address: ${contractAddress}`);
  console.log(`Constructor Arguments: ${constructorArgs}`);
  
  try {
    // Wait a bit to make sure the contract is properly propagated on the blockchain
    console.log("Waiting for transaction to be fully confirmed...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds delay
    
    // Execute verification
    console.log("Submitting verification request...");
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
    });
    
    console.log("Contract verification successful!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification error:", error);
    process.exit(1);
  }); 