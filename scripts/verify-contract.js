// Etherscan verification script
const hre = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification on Etherscan");
  
  // Load deployment data from our saved file
  const fs = require("fs");
  const deploymentData = JSON.parse(fs.readFileSync("./deployment-success.json", "utf8"));
  
  const contractAddress = deploymentData.contractAddress;
  const tokenAddress = deploymentData.tokenAddress;
  const priceFeed = deploymentData.priceFeed;
  
  console.log(`Contract address: ${contractAddress}`);
  console.log(`Token address: ${tokenAddress}`);
  console.log(`Price feed: ${priceFeed}`);
  
  console.log("\nVerifying contract on Etherscan...");
  console.log("This may take a minute or two...");
  
  try {
    // Run the verification
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        tokenAddress,
        priceFeed
      ],
      // Optional: If your contract is in a specific path or has a specific name
      // contract: "contracts/LendingPool.sol:LendingPool" 
    });
    
    console.log("\n✅ Contract successfully verified on Etherscan!");
    console.log(`View at: https://sepolia.etherscan.io/address/${contractAddress}#code`);
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract is already verified on Etherscan!");
      console.log(`View at: https://sepolia.etherscan.io/address/${contractAddress}#code`);
    } else {
      console.error("\n❌ Verification failed:", error.message);
      console.log("\nTroubleshooting tips:");
      console.log("1. Make sure you've configured your Etherscan API key in the Hardhat config");
      console.log("2. Confirm the constructor arguments match exactly what was used in deployment");
      console.log("3. Wait a few more blocks before trying again - the contract may still be propagating");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 