// Script to interact with the deployed contract
require("dotenv").config();
const { ethers } = require("hardhat");

// Load LendingPool ABI from artifacts
const LendingPoolJson = require("../artifacts/contracts/LendingPool.sol/LendingPool.json");

// Load deployment data
const deploymentData = require("../deployment-success.json");
const CONTRACT_ADDRESS = deploymentData.contractAddress;

async function main() {
  console.log("🧪 Testing Deployed LendingPool Contract 🧪");
  console.log(`Contract address: ${CONTRACT_ADDRESS}`);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  // Create contract instance
  const lendingPool = new ethers.Contract(
    CONTRACT_ADDRESS,
    LendingPoolJson.abi,
    signer
  );
  
  // Get initial contract state
  console.log("\n📊 Contract State:");
  try {
    // Get contract state variables
    const borrowInterestRate = await lendingPool.borrowInterestRate();
    console.log(`Interest Rate: ${borrowInterestRate} (${Number(borrowInterestRate)/100}%)`);
    
    const liquidationThreshold = await lendingPool.liquidationThreshold();
    console.log(`Liquidation Threshold: ${liquidationThreshold} (${Number(liquidationThreshold)/100}%)`);
    
    const ethUsdPriceFeed = await lendingPool.ethUsdPriceFeed();
    console.log(`ETH/USD Price Feed: ${ethUsdPriceFeed}`);
    
    const lendingToken = await lendingPool.lendingToken();
    console.log(`Lending Token: ${lendingToken}`);
    
    const totalDeposits = await lendingPool.totalDeposits();
    console.log(`Total Deposits: ${ethers.formatEther(totalDeposits)} tokens`);
    
    const totalBorrows = await lendingPool.totalBorrows();
    console.log(`Total Borrows: ${ethers.formatEther(totalBorrows)} tokens`);
    
    // Get current ETH/USD price 
    const ethUsdPrice = await lendingPool.getLatestEthUsdPrice();
    console.log(`Current ETH/USD Price: $${Number(ethUsdPrice) / 100000000}`); // 8 decimals
    
    // Get total contract balance
    const availableLiquidity = await lendingPool.getAvailableLiquidity();
    console.log(`Available Liquidity: ${ethers.formatEther(availableLiquidity)} tokens`);
    
    // Get user account data
    const userData = await lendingPool.getUserAccountData(signer.address);
    console.log(`\nUser Account Data:`);
    console.log(`- Deposit Balance: ${ethers.formatEther(userData[0])} tokens`);
    console.log(`- Borrow Balance: ${ethers.formatEther(userData[1])} tokens`);
    console.log(`- Health Factor: ${Number(userData[2]) / 10000}`);
    
    // Test deposit functionality (if liquidity is needed)
    const shouldDeposit = false; // Set to true if you want to deposit
    
    if (shouldDeposit) {
      console.log("\n1️⃣ Testing deposit functionality...");
      // First approve the token transfer
      const tokenContract = new ethers.Contract(
        lendingToken,
        ["function approve(address spender, uint256 amount) external returns (bool)"],
        signer
      );
      
      const depositAmount = ethers.parseEther("0.01");
      console.log(`Approving ${ethers.formatEther(depositAmount)} tokens...`);
      
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, depositAmount);
      console.log(`Approval transaction hash: ${approveTx.hash}`);
      console.log("Waiting for approval confirmation...");
      
      await approveTx.wait();
      console.log("✅ Approval successful!");
      
      console.log(`\nDepositing ${ethers.formatEther(depositAmount)} tokens...`);
      const depositTx = await lendingPool.deposit(depositAmount);
      console.log(`Deposit transaction hash: ${depositTx.hash}`);
      console.log("Waiting for confirmation...");
      
      const depositReceipt = await depositTx.wait();
      
      if (depositReceipt.status === 1) {
        console.log("✅ Deposit successful!");
        
        // Check updated contract state
        const newAvailableLiquidity = await lendingPool.getAvailableLiquidity();
        console.log(`New available liquidity: ${ethers.formatEther(newAvailableLiquidity)} tokens`);
        
        // Check user deposit balance
        const userDeposits = await lendingPool.deposits(signer.address);
        console.log(`Your deposit balance: ${ethers.formatEther(userDeposits)} tokens`);
      } else {
        console.log("❌ Deposit failed!");
      }
    }
    
  } catch (error) {
    console.error("❌ Error during contract interaction:", error);
    
    // Provide helpful error interpretation
    if (error.message.includes("execution reverted")) {
      const reason = error.message.split("execution reverted: ")[1]?.split('"')[0];
      console.log("\nExecution reverted with reason:", reason || "Unknown reason");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  }); 