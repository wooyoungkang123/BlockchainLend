// deploy_v6.js - Script to compile and deploy a contract using Hardhat and Ethers v6
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Parse command line arguments - use process.env.CONTRACT_NAME or default
const contractName = process.env.CONTRACT_NAME || 'SimpleStorage';  // Default to SimpleStorage
console.log(`Target contract to deploy: ${contractName}`);

async function main() {
  try {
    // Step 1: Compile the contract using Hardhat
    console.log(`Compiling ${contractName}...`);
    await hre.run('compile');
    
    // Step 2: Get wallet information
    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    
    console.log(`Using deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Check for existing deployments
    let existingDeployments = {};
    const deploymentsPath = path.join(__dirname, '..', 'deployments.json');
    
    if (fs.existsSync(deploymentsPath)) {
      try {
        existingDeployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      } catch (error) {
        console.warn("Warning: Could not parse existing deployments file");
      }
    }
    
    // Step 3: Deploy the contract
    console.log(`Deploying ${contractName}...`);
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    
    let contract;
    
    // Handle special cases for certain contracts
    if (contractName === 'TestToken') {
      console.log("Deploying TestToken with name: Test Token, symbol: TEST, initialSupply: 1000000");
      contract = await ContractFactory.deploy("Test Token", "TEST", 1000000);
    } else if (contractName === 'LendingPool') {
      // Check if TestToken is already deployed
      if (!existingDeployments.TestToken?.address) {
        console.log("TestToken not found in deployments. Deploying TestToken first...");
        const TestTokenFactory = await hre.ethers.getContractFactory("TestToken");
        const testToken = await TestTokenFactory.deploy("Test Token", "TEST", 1000000);
        await testToken.waitForDeployment();
        const testTokenAddress = await testToken.getAddress();
        console.log(`TestToken deployed at: ${testTokenAddress}`);
        
        existingDeployments.TestToken = {
          address: testTokenAddress,
          txHash: testToken.deploymentTransaction().hash,
          timestamp: new Date().toISOString()
        };
        
        // Deploy LendingPool with the new TestToken address
        console.log(`Deploying LendingPool with TestToken: ${testTokenAddress}`);
        contract = await ContractFactory.deploy(testTokenAddress);
      } else {
        const testTokenAddress = existingDeployments.TestToken.address;
        console.log(`Using existing TestToken at: ${testTokenAddress}`);
        console.log(`Deploying LendingPool with TestToken: ${testTokenAddress}`);
        contract = await ContractFactory.deploy(testTokenAddress);
      }
    } else {
      contract = await ContractFactory.deploy();
    }
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log(`Contract deployed successfully!`);
    console.log(`Contract address: ${contractAddress}`);
    console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);
    
    // Step 4: Save deployment information
    existingDeployments[contractName] = {
      address: contractAddress,
      txHash: contract.deploymentTransaction().hash,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      deploymentsPath,
      JSON.stringify(existingDeployments, null, 2)
    );
    
    console.log('Deployment information saved to deployments.json');
    
    return contractAddress;
  } catch (error) {
    console.error('Deployment failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(contractAddress => {
    console.log(`✅ All done! Contract deployed at ${contractAddress}`);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 