const hre = require("hardhat");
const { ethers } = require("hardhat");

// Chainlink Price Feed Addresses
const CHAINLINK_PRICE_FEEDS = {
  // ETH / USD
  mainnet: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  sepolia: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  // For local testing, use a mock address
  localhost: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", // Using the Sepolia address for local simulation
  hardhat: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e"
};

async function main() {
  console.log("Starting robust LendingPool deployment...");
  console.log("Using account:", (await ethers.getSigners())[0].address);

  try {
    // Check network connection
    console.log("Checking network connection...");
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("Current block number:", blockNumber);
    
    // Check wallet balance
    const deployer = (await ethers.getSigners())[0];
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      console.error("Warning: Low balance for deployment");
    }
    
    // Deploy with a dummy token address that can be updated later
    const dummyTokenAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    
    // Get the appropriate Chainlink price feed based on network
    const network = hre.network.name;
    console.log("Deploying to network:", network);
    
    let priceFeedAddress = CHAINLINK_PRICE_FEEDS[network];
    
    // For localhost, we'll skip price feed validation during deployment
    const isLocalNetwork = network === "localhost" || network === "hardhat";
    
    if (!priceFeedAddress) {
      // If no price feed for this network, use a dummy address for local testing
      if (isLocalNetwork) {
        console.log("Using dummy price feed for local testing");
        priceFeedAddress = "0x9326BFA02ADD2366b30bacB125260Af641031331";
      } else {
        throw new Error(`No price feed address configured for network: ${network}`);
      }
    }
    
    console.log(`Using ETH/USD price feed at: ${priceFeedAddress}`);
    
    // Get contract factory
    const LendingPool = await ethers.getContractFactory("LendingPool");
    console.log("Deploying LendingPool...");
    
    // Setup detailed transaction override options
    const deployTx = isLocalNetwork ? {} : {
      gasLimit: ethers.parseUnits("3000000", "wei"),  // 3 million gas
      maxFeePerGas: ethers.parseUnits("8", "gwei"),   // Increased from 3 to 8 gwei
      maxPriorityFeePerGas: ethers.parseUnits("3", "gwei")  // Increased from 1.5 to 3 gwei
    };
    
    if (!isLocalNetwork) {
      // Deploy with gas overrides for testnets/mainnet
      console.log("Sending deployment transaction with gas settings:");
      console.log(`  - Gas Limit: 3,000,000 wei`);
      console.log(`  - Max Fee: 8 gwei`);
      console.log(`  - Priority Fee: 3 gwei`);
    }
    
    console.log("Deploying contract with parameters:", dummyTokenAddress, priceFeedAddress);
    const lendingPool = await LendingPool.deploy(dummyTokenAddress, priceFeedAddress, deployTx);
    
    console.log("Deployment transaction sent, hash:", lendingPool.deploymentTransaction().hash);
    console.log("Waiting for transaction confirmation...");
    
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log(`Success! LendingPool deployed to: ${lendingPoolAddress}`);
    console.log(`Transaction hash: ${lendingPool.deploymentTransaction().hash}`);
    
    // Save deployment info to a file
    const fs = require("fs");
    const deploymentInfo = {
      network: hre.network.name,
      lendingPool: lendingPoolAddress,
      priceFeed: priceFeedAddress,
      tokenAddress: dummyTokenAddress,
      transactionHash: lendingPool.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };
    
    fs.writeFileSync(
      "deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Deployment information saved to deployment-info.json");
    
    return {
      lendingPool: lendingPoolAddress,
      transactionHash: lendingPool.deploymentTransaction().hash
    };
    
  } catch (error) {
    console.error("Deployment failed with error:");
    console.error(error);
    
    // Provide more detailed troubleshooting guidance
    if (error.message.includes("insufficient funds")) {
      console.error("\nTROUBLESHOOTING: You don't have enough ETH to deploy. Get more Sepolia ETH from a faucet.");
    }
    else if (error.message.includes("nonce")) {
      console.error("\nTROUBLESHOOTING: Nonce issue detected. Try resetting the account nonce in MetaMask or waiting for pending transactions.");
    }
    else if (error.message.includes("gas") || error.message.includes("underpriced")) {
      console.error("\nTROUBLESHOOTING: Gas price too low. Try increasing maxFeePerGas and maxPriorityFeePerGas values.");
    }
    else if (error.message.includes("timeout") || error.message.includes("invalid json response")) {
      console.error("\nTROUBLESHOOTING: RPC endpoint issues. Get a dedicated API key from Alchemy (https://www.alchemy.com/).");
    }
    else if (error.message.includes("price feed") && error.message.includes("data")) {
      console.error("\nTROUBLESHOOTING: Price feed verification failed. This may happen on local networks where the feed doesn't exist.");
    }
    
    process.exit(1);
  }
}

// Execute the deployment
main()
  .then((deployedContracts) => {
    console.log("\nDeployment workflow completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Top-level error:", error);
    process.exit(1);
  }); 