// A simple deployment script using ethers.js directly
const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  console.log("Deploying Simple Lending contract...");
  
  // Get the SimpleLending factory
  const SimpleLending = await ethers.getContractFactory("SimpleLending");
  
  // Deploy contract
  console.log("Deploying SimpleLending...");
  const lending = await SimpleLending.deploy();
  await lending.waitForDeployment();
  
  const address = await lending.getAddress();
  console.log(`SimpleLending deployed to: ${address}`);
  
  // Get signer
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  // Check token balances
  const ownerTokenBalance = await lending.getTokenBalance(deployer.address);
  console.log(`Deployer token balance: ${ethers.formatUnits(ownerTokenBalance, 6)} USDC`);
  
  const poolTokenBalance = await lending.getTokenBalance(address);
  console.log(`Pool token balance: ${ethers.formatUnits(poolTokenBalance, 6)} USDC`);
  
  // Deposit ETH
  console.log("\n--- Depositing ETH ---");
  const depositAmount = ethers.parseEther("1.0");
  console.log(`Depositing ${ethers.formatEther(depositAmount)} ETH...`);
  const depositTx = await lending.deposit({ value: depositAmount });
  await depositTx.wait();
  
  // Check deposit balance
  const depositBalance = await lending.getDepositBalance(deployer.address);
  console.log(`Deposit balance: ${ethers.formatEther(depositBalance)} ETH`);
  
  // Get collateral value
  const collateralValue = await lending.getCollateralValue(deployer.address);
  console.log(`Collateral value: $${collateralValue} USD`);
  
  // Calculate a more reasonable borrow amount (10 USDC)
  console.log("\n--- Borrowing Tokens ---");
  // Use a fixed amount that's small enough for the pool to handle
  const borrowAmount = ethers.parseUnits("10", 18); // 10 with 18 decimals for borrow balance
  console.log(`Borrowing equivalent of 10 USDC...`);
  
  try {
    const borrowTx = await lending.borrow(borrowAmount);
    await borrowTx.wait();
    
    // Check borrow balance
    const borrowBalance = await lending.getBorrowBalance(deployer.address);
    console.log(`Borrow balance: ${ethers.formatUnits(borrowBalance, 18)} (in 18 decimals)`);
    
    // Check new token balance
    const newTokenBalance = await lending.getTokenBalance(deployer.address);
    console.log(`New token balance: ${ethers.formatUnits(newTokenBalance, 6)} USDC`);
    
    // Check health factor
    const healthFactor = await lending.getUserHealthFactor(deployer.address);
    console.log(`Health factor: ${healthFactor}%`);
  } catch (error) {
    console.log(`Failed to borrow: ${error.message}`);
  }
  
  console.log("\nDeployment and interaction completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 