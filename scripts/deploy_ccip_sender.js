const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting CCIPSenderExample deployment...");

  // Get router address and LINK token address for the network
  const { routerAddress, linkTokenAddress } = getNetworkConfig(hre.network.name);

  // Deploy the contract
  const CCIPSenderExample = await hre.ethers.getContractFactory("CCIPSenderExample");
  console.log(`Deploying CCIPSenderExample with router: ${routerAddress} and LINK token: ${linkTokenAddress}...`);
  
  const ccipSender = await CCIPSenderExample.deploy(routerAddress, linkTokenAddress);
  await ccipSender.waitForDeployment();
  
  const ccipSenderAddress = await ccipSender.getAddress();
  console.log(`CCIPSenderExample deployed to: ${ccipSenderAddress}`);

  // Save deployment information
  saveDeployment(ccipSenderAddress, hre.network.name);

  console.log("Deployment completed successfully!");
}

function getNetworkConfig(networkName) {
  // This is a mapping of network names to their router and LINK token addresses
  // Update with the appropriate addresses for your target networks
  const configs = {
    // Testnets
    sepolia: {
      routerAddress: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Ethereum Sepolia Router
      linkTokenAddress: "0x779877A7B0D9E8603169DdbD7836e478b4624789" // Ethereum Sepolia LINK
    },
    fuji: {
      routerAddress: "0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8", // Avalanche Fuji Router
      linkTokenAddress: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846" // Avalanche Fuji LINK
    },
    mumbai: {
      routerAddress: "0x70499c328e1E2a3c41108bd3730F6670a44595D1", // Polygon Mumbai Router
      linkTokenAddress: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB" // Polygon Mumbai LINK
    },
    // Hardhat local network - using placeholder values for testing
    hardhat: {
      routerAddress: "0x70499c328e1E2a3c41108bd3730F6670a44595D1", // Placeholder
      linkTokenAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // Using deployed TestToken as LINK for testing
    },
    // Localhost network - using placeholder values for testing
    localhost: {
      routerAddress: "0x70499c328e1E2a3c41108bd3730F6670a44595D1", // Placeholder
      linkTokenAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // Using deployed TestToken as LINK for testing
    }
    // Add more networks as needed
  };

  const config = configs[networkName];
  if (!config) {
    throw new Error(`Network ${networkName} not configured. Please add configuration.`);
  }

  return config;
}

function saveDeployment(ccipSenderAddress, networkName) {
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  let deployments = {};

  // Load existing deployments if file exists
  if (fs.existsSync(deploymentsPath)) {
    const deploymentsFile = fs.readFileSync(deploymentsPath, "utf8");
    deployments = JSON.parse(deploymentsFile);
  }

  // Get transaction hash and block number
  const txHash = "local-deployment"; // For hardhat network we don't have a real tx hash
  
  // Add new deployment
  if (!deployments.ccipSenderContracts) {
    deployments.ccipSenderContracts = {};
  }
  
  deployments.ccipSenderContracts[networkName] = {
    address: ccipSenderAddress,
    transactionHash: txHash,
    timestamp: new Date().toISOString()
  };

  // Save back to file
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log(`Deployment information saved to ${deploymentsPath}`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 