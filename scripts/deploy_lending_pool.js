const { ethers } = require("hardhat");

async function main() {
  console.log("Starting LendingPool deployment...");

  // Deploy with a dummy token address that can be updated later
  // This avoids needing to deploy the token first
  const dummyTokenAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"; // This address should be replaced later
  
  // Deploy the LendingPool with lower gas settings
  const LendingPool = await ethers.getContractFactory("LendingPool");
  console.log("Deploying LendingPool...");
  
  // Use lower gas limit and price to help with public endpoints
  const deployOptions = {
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits("1.5", "gwei")
  };
  
  const lendingPool = await LendingPool.deploy(dummyTokenAddress, deployOptions);
  console.log("Waiting for deployment transaction to be mined...");
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  
  console.log(`LendingPool deployed to: ${lendingPoolAddress}`);
  console.log(`Transaction hash: ${lendingPool.deploymentTransaction().hash}`);

  return {
    lendingPool: lendingPoolAddress,
    transactionHash: lendingPool.deploymentTransaction().hash
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