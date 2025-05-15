// Script to deploy the LoanCCIPReceiver contract
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting LoanCCIPReceiver deployment...");

  // Get router address for the network
  const routerAddress = getRouterAddress(hre.network.name);

  // Check if deployments.json exists and contains the LendingPool address
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments.json not found. Please deploy LendingPool first.");
  }

  const deploymentsContent = fs.readFileSync(deploymentsPath, "utf8");
  const deployments = JSON.parse(deploymentsContent);

  if (!deployments.LendingPool || !deployments.LendingPool.address) {
    throw new Error("LendingPool address not found in deployments.json. Please deploy LendingPool first.");
  }

  const lendingPoolAddress = deployments.LendingPool.address;
  console.log(`Using LendingPool address: ${lendingPoolAddress}`);

  // Deploy the LoanCCIPReceiver contract
  const LoanCCIPReceiver = await hre.ethers.getContractFactory("LoanCCIPReceiver");
  console.log(`Deploying LoanCCIPReceiver with router: ${routerAddress} and lending pool: ${lendingPoolAddress}...`);
  
  const loanCCIPReceiver = await LoanCCIPReceiver.deploy(routerAddress, lendingPoolAddress);
  await loanCCIPReceiver.waitForDeployment();
  
  const receiverAddress = await loanCCIPReceiver.getAddress();
  console.log(`LoanCCIPReceiver deployed to: ${receiverAddress}`);

  // Now we need to set the CCIP receiver address in the LendingPool
  console.log("Setting CCIP receiver in LendingPool...");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const lendingPool = LendingPool.attach(lendingPoolAddress);
  
  const txSetReceiver = await lendingPool.setCCIPReceiver(receiverAddress);
  await txSetReceiver.wait();
  console.log(`CCIPReceiver set in LendingPool. Tx hash: ${txSetReceiver.hash}`);

  // Save deployment information
  deployments.LoanCCIPReceiver = {
    address: receiverAddress,
    transactionHash: txSetReceiver.hash,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`Deployment information saved to ${deploymentsPath}`);

  console.log("Deployment and configuration completed successfully!");
}

function getRouterAddress(networkName) {
  // This is a mapping of network names to their router addresses
  // Update with the appropriate addresses for your target networks
  const routerAddresses = {
    // Testnets
    sepolia: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Ethereum Sepolia
    fuji: "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8", // Avalanche Fuji
    mumbai: "0x70499c328e1E2a3c41108bd3730F6670a44595D1", // Polygon Mumbai
    // Local network - using a placeholder for testing
    hardhat: "0x70499c328e1E2a3c41108bd3730F6670a44595D1", // Using Mumbai router address for testing
    localhost: "0x70499c328e1E2a3c41108bd3730F6670a44595D1" // Using Mumbai router address for testing
    // Add more as needed
  };

  const routerAddress = routerAddresses[networkName];
  if (!routerAddress) {
    throw new Error(`Network ${networkName} not configured. Please add a router address for this network.`);
  }

  return routerAddress;
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 