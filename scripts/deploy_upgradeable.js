// deploy_upgradeable.js - Script to deploy upgradeable contracts
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Default to deploy the test token and lending pool upgradeable
async function main() {
  try {
    // Step 1: Compile the contracts
    console.log(`Compiling contracts...`);
    await hre.run('compile');
    
    // Step 2: Get wallet information
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    
    console.log(`Using deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Step 3: Deploy the TestToken first
    console.log(`Deploying TestToken...`);
    const TestToken = await hre.ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy("Test Lending Token", "TLT", 1000000);
    
    await testToken.waitForDeployment();
    const testTokenAddress = await testToken.getAddress();
    
    console.log(`TestToken deployed successfully!`);
    console.log(`TestToken address: ${testTokenAddress}`);
    console.log(`Transaction hash: ${testToken.deploymentTransaction().hash}`);
    
    // Step 4: Deploy the LendingPoolUpgradeable through a proxy
    console.log(`Deploying LendingPoolUpgradeable...`);
    const LendingPoolUpgradeable = await hre.ethers.getContractFactory("LendingPoolUpgradeable");
    
    const lendingPoolUpgradeable = await hre.upgrades.deployProxy(
      LendingPoolUpgradeable, 
      [testTokenAddress], 
      { kind: 'uups' }
    );
    
    await lendingPoolUpgradeable.waitForDeployment();
    const lendingPoolUpgradeableAddress = await lendingPoolUpgradeable.getAddress();
    
    console.log(`LendingPoolUpgradeable deployed successfully!`);
    console.log(`LendingPoolUpgradeable proxy address: ${lendingPoolUpgradeableAddress}`);
    
    // Get implementation address
    const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(
      lendingPoolUpgradeableAddress
    );
    console.log(`LendingPoolUpgradeable implementation address: ${implementationAddress}`);
    
    // Step 5: Save deployment information
    const deployments = {
      TestToken: {
        address: testTokenAddress,
        txHash: testToken.deploymentTransaction().hash,
        timestamp: new Date().toISOString()
      },
      LendingPoolUpgradeable: {
        proxyAddress: lendingPoolUpgradeableAddress,
        implementationAddress: implementationAddress,
        timestamp: new Date().toISOString()
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'upgradeable-deployments.json'),
      JSON.stringify(deployments, null, 2)
    );
    
    console.log('Deployment information saved to upgradeable-deployments.json');
    
    return {
      testTokenAddress,
      lendingPoolUpgradeableAddress
    };
  } catch (error) {
    console.error('Deployment failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(({testTokenAddress, lendingPoolUpgradeableAddress}) => {
    console.log(`✅ All done!`);
    console.log(`TestToken deployed at: ${testTokenAddress}`);
    console.log(`LendingPoolUpgradeable deployed at: ${lendingPoolUpgradeableAddress}`);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 