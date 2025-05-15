const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying minimal contract...");
  
  // Get the MinimalContract factory
  const MinimalContract = await ethers.getContractFactory("MinimalContract");
  
  // Deploy with initial value of 42
  console.log("Deploying MinimalContract...");
  const minimalContract = await MinimalContract.deploy(42);
  await minimalContract.waitForDeployment();
  
  const address = await minimalContract.getAddress();
  console.log(`MinimalContract deployed to: ${address}`);
  
  // Check initial value
  const initialValue = await minimalContract.getValue();
  console.log(`Initial value: ${initialValue}`);
  
  // Update value
  console.log("Setting new value to 100...");
  const tx = await minimalContract.setValue(100);
  await tx.wait();
  
  // Check new value
  const newValue = await minimalContract.getValue();
  console.log(`New value: ${newValue}`);
  
  console.log("Deployment and interaction completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 