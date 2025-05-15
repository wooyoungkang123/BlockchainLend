// scripts/simple_deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying a minimal SimpleStorage contract...");

  // Deploy SimpleStorage contract
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  console.log("Deploying SimpleStorage...");
  
  // Specify low gas values
  const deployOptions = {
    gasLimit: 500000,
    gasPrice: ethers.parseUnits("1.5", "gwei")
  };
  
  const simpleStorage = await SimpleStorage.deploy(deployOptions);
  await simpleStorage.waitForDeployment();
  const contractAddress = await simpleStorage.getAddress();
  
  console.log(`SimpleStorage deployed to: ${contractAddress}`);
  console.log(`Transaction hash: ${simpleStorage.deploymentTransaction().hash}`);

  return {
    contractAddress: contractAddress,
    transactionHash: simpleStorage.deploymentTransaction().hash
  };
}

// Execute the deployment
main()
  .then((deployedContracts) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 