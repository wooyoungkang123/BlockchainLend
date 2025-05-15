// Aggressive Sepolia deployment script with high gas settings
const hre = require("hardhat");
const { ethers } = require("hardhat");

// Chainlink Price Feed Address for Sepolia
const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

async function main() {
  console.log("Starting aggressive Sepolia deployment...");

  try {
    // Get the first signer for deployment
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      throw new Error("Insufficient balance for deployment, need at least 0.01 ETH");
    }
    
    // Check network and latest block
    const network = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`Latest block: ${blockNumber}`);
    
    // Deploy a mock token for testing
    console.log("Deploying mock token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    // Use very aggressive gas settings for faster inclusion
    const tokenDeployTx = {
      gasLimit: ethers.parseUnits("5000000", "wei"),  // 5 million gas limit
      maxFeePerGas: ethers.parseUnits("20", "gwei"),  // 20 gwei max fee (very high)
      maxPriorityFeePerGas: ethers.parseUnits("5", "gwei") // 5 gwei priority fee (very high)
    };
    
    console.log("Token deployment gas settings:", 
      `Max Fee: ${ethers.formatUnits(tokenDeployTx.maxFeePerGas, "gwei")} gwei, ` +
      `Priority Fee: ${ethers.formatUnits(tokenDeployTx.maxPriorityFeePerGas, "gwei")} gwei`
    );
    
    const mockToken = await MockERC20.deploy("Lending Test Token", "LTT", tokenDeployTx);
    console.log("Token deployment tx hash:", mockToken.deploymentTransaction().hash);
    
    console.log("Waiting for token deployment (typically 30-60 seconds)...");
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("✅ Mock token deployed to:", tokenAddress);
    
    // Deploy the LendingPool with the Chainlink price feed
    console.log("Deploying LendingPool with Chainlink integration...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    
    // Even more aggressive gas settings for the main contract
    const poolDeployTx = {
      gasLimit: ethers.parseUnits("8000000", "wei"),  // 8 million gas limit
      maxFeePerGas: ethers.parseUnits("25", "gwei"),  // 25 gwei max fee (extremely high)
      maxPriorityFeePerGas: ethers.parseUnits("10", "gwei") // 10 gwei priority fee (extremely high)
    };
    
    console.log("LendingPool deployment gas settings:", 
      `Max Fee: ${ethers.formatUnits(poolDeployTx.maxFeePerGas, "gwei")} gwei, ` +
      `Priority Fee: ${ethers.formatUnits(poolDeployTx.maxPriorityFeePerGas, "gwei")} gwei`
    );
    
    const lendingPool = await LendingPool.deploy(tokenAddress, SEPOLIA_ETH_USD_FEED, poolDeployTx);
    console.log("LendingPool deployment tx hash:", lendingPool.deploymentTransaction().hash);
    
    console.log("Waiting for LendingPool deployment (typically 30-90 seconds)...");
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    
    console.log("✅ LendingPool successfully deployed!");
    console.log("LendingPool address:", lendingPoolAddress);
    console.log("Token address:", tokenAddress);
    console.log("Price feed used:", SEPOLIA_ETH_USD_FEED);
    
    // Save deployment info to a file with timestamp
    const fs = require("fs");
    const deploymentInfo = {
      network: "sepolia",
      chainId: network.chainId,
      lendingPool: lendingPoolAddress,
      tokenAddress: tokenAddress,
      priceFeed: SEPOLIA_ETH_USD_FEED,
      deployerAddress: deployer.address,
      deploymentTxHash: lendingPool.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };
    
    fs.writeFileSync(
      "sepolia-deployment-info.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("✅ Deployment information saved to sepolia-deployment-info.json");
    
    // Return deployment info for further use
    return deploymentInfo;
    
  } catch (error) {
    console.error("❌ Deployment failed with error:");
    console.error(error);
    
    // Provide detailed error information for troubleshooting
    if (error.message.includes("insufficient funds")) {
      console.error("\nERROR: Not enough ETH in your account. Get Sepolia ETH from a faucet.");
    } 
    else if (error.message.includes("nonce")) {
      console.error("\nERROR: Nonce issue detected. There might be pending transactions from your account.");
      console.error("Solution: Check pending transactions and wait for them to complete, or reset nonce in MetaMask.");
    }
    else if (error.message.includes("timeout") || error.message.includes("invalid response") || error.message.includes("network")) {
      console.error("\nERROR: RPC connection issue with Sepolia. The RPC endpoint might be unresponsive.");
      console.error("Solution: Try again later or use a different RPC provider in your .env file.");
    }
    else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      console.error("\nERROR: The contract deployment is reverting during construction.");
      console.error("Solution: Check contract constructor for issues, especially with the price feed address.");
    }
    
    process.exit(1);
  }
}

// Execute the deployment with a timeout
const timeout = 300000; // 5 minutes
const deploymentPromise = main()
  .then((deploymentInfo) => {
    console.log("\n✅ Sepolia deployment completed successfully!");
    console.log("Deployment information:", deploymentInfo);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error in deployment script:");
    console.error(error);
    process.exit(1);
  });

// Add a timeout to abort if deployment takes too long
setTimeout(() => {
  console.error("⏱️ Deployment timed out after 5 minutes.");
  console.error("The transaction might still be pending. Check Sepolia explorer with your address.");
  process.exit(1);
}, timeout); 