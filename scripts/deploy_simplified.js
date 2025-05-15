const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying simplified lending contract...");
  
  // Get the SimplifiedLending factory
  const SimplifiedLending = await ethers.getContractFactory("SimplifiedLending");
  
  // Deploy contract
  console.log("Deploying SimplifiedLending...");
  const lending = await SimplifiedLending.deploy();
  await lending.waitForDeployment();
  
  const address = await lending.getAddress();
  console.log(`SimplifiedLending deployed to: ${address}`);
  
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
  
  // Borrow tokens
  console.log("\n--- Borrowing Tokens ---");
  const liquidationThreshold = await lending.LIQUIDATION_THRESHOLD();
  console.log(`Liquidation threshold: ${liquidationThreshold}%`);
  
  // Calculate a safe borrow amount (50% of collateral value)
  const borrowAmount = (collateralValue * BigInt(50)) / BigInt(100);
  console.log(`Borrowing $${borrowAmount} worth of tokens...`);
  
  try {
    const borrowTx = await lending.borrow(borrowAmount);
    await borrowTx.wait();
    
    // Check borrow balance
    const borrowBalance = await lending.getBorrowBalance(deployer.address);
    console.log(`Borrow balance: ${borrowBalance} USDC`);
    
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