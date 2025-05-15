// Deploy script for lending contracts
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  // Get the contract factories
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const LendingPoolUpgradeable = await hre.ethers.getContractFactory("LendingPoolUpgradeable");
  
  // Deploy the TestToken
  console.log("Deploying TestToken...");
  const testToken = await TestToken.deploy("Test Token", "TEST", 1000000);
  await testToken.waitForDeployment();
  console.log(`TestToken deployed to: ${await testToken.getAddress()}`);
  
  // Deploy the LendingPool
  console.log("Deploying LendingPool...");
  const lendingPool = await LendingPool.deploy(await testToken.getAddress());
  await lendingPool.waitForDeployment();
  console.log(`LendingPool deployed to: ${await lendingPool.getAddress()}`);
  
  // Deploy the upgradeable implementation
  console.log("Deploying LendingPoolUpgradeable implementation...");
  
  // Get the ProxyAdmin contract factory
  const { ethers, upgrades } = hre;
  
  // Deploy the upgradeable contract with a proxy
  console.log("Deploying proxy...");
  const lendingPoolUpgradeable = await upgrades.deployProxy(
    LendingPoolUpgradeable, 
    [await testToken.getAddress()], 
    { kind: 'uups' }
  );
  await lendingPoolUpgradeable.waitForDeployment();
  
  console.log(`LendingPoolUpgradeable proxy deployed to: ${await lendingPoolUpgradeable.getAddress()}`);
  
  // Save deployment addresses
  const deploymentData = {
    testToken: await testToken.getAddress(),
    lendingPool: await lendingPool.getAddress(),
    lendingPoolUpgradeable: await lendingPoolUpgradeable.getAddress(),
    timestamp: new Date().toISOString()
  };
  
  // Create or update the deployments file
  const deploymentPath = path.join(__dirname, "../lending-deployments.json");
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log(`Deployment information saved to ${deploymentPath}`);
  console.log("Deployment complete!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 