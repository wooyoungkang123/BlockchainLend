const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying consolidated LendingPool system...");
  
  // First, compile the consolidated contract
  console.log("Compiling contracts...");
  await hre.run('compile');
  
  // Get the Deploy contract factory (contained in our consolidated file)
  const Deploy = await ethers.getContractFactory("Deploy");
  console.log("Deploying Deploy contract...");
  const deploy = await Deploy.deploy();
  const deployAddress = await deploy.getAddress();
  
  console.log(`Deploy contract deployed to: ${deployAddress}`);
  
  // Use the deployAll function to deploy all contracts
  console.log("Deploying all contracts (Token, PriceFeed, LendingPool)...");
  const tx = await deploy.deployAll();
  const receipt = await tx.wait();
  
  // Extract deployed contract addresses directly from the Deploy contract
  console.log("Extracting deployed contract addresses...");
  
  const tokenAddress = await deploy.token();
  const priceFeedAddress = await deploy.priceFeed();
  const lendingPoolAddress = await deploy.lendingPool();
  
  console.log(`Token deployed to: ${tokenAddress}`);
  console.log(`PriceFeed deployed to: ${priceFeedAddress}`);
  console.log(`LendingPool deployed to: ${lendingPoolAddress}`);
  
  // Get contract instances
  const Token = await ethers.getContractFactory("MockToken");
  const PriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  
  const token = Token.attach(tokenAddress);
  const priceFeed = PriceFeed.attach(priceFeedAddress);
  const lendingPool = LendingPool.attach(lendingPoolAddress);
  
  // Demo interactions
  const [deployer] = await ethers.getSigners();
  console.log("\n--- System Info ---");
  
  // Check ETH price
  const ethPrice = await priceFeed.latestRoundData();
  console.log(`Current ETH price: $${Number(ethPrice[1]) / 10**8}`);
  
  // Check token balance of deployer
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`Deployer token balance: ${ethers.formatUnits(deployerBalance, 6)} USDC`);
  
  // Check token balance of lending pool
  const poolBalance = await token.balanceOf(lendingPoolAddress);
  console.log(`LendingPool token balance: ${ethers.formatUnits(poolBalance, 6)} USDC`);
  
  // Deposit ETH to the lending pool
  console.log("\n--- Depositing ETH ---");
  const depositAmount = ethers.parseEther("1.0");
  console.log(`Depositing ${ethers.formatEther(depositAmount)} ETH...`);
  const depositTx = await lendingPool.deposit({ value: depositAmount });
  await depositTx.wait();
  
  // Check deposit balance
  const depositBalance = await lendingPool.depositBalances(deployer.address);
  console.log(`Deposit balance: ${ethers.formatEther(depositBalance)} ETH`);
  
  // Get collateral value
  const collateralValue = await lendingPool.getCollateralValue(deployer.address);
  console.log(`Collateral value: $${ethers.formatUnits(collateralValue, 18)}`);
  
  // Borrow tokens
  console.log("\n--- Borrowing Tokens ---");
  const maxBorrowable = await lendingPool.LIQUIDATION_THRESHOLD();
  console.log(`Liquidation threshold: ${maxBorrowable}%`);
  
  // Calculate a safe borrow amount (50% of collateral value)
  const borrowAmount = (collateralValue * BigInt(50)) / BigInt(100);
  console.log(`Borrowing $${ethers.formatUnits(borrowAmount, 18)} worth of tokens...`);
  
  try {
    const borrowTx = await lendingPool.borrow(borrowAmount);
    await borrowTx.wait();
    
    // Check borrow balance
    const borrowBalance = await lendingPool.borrowBalances(deployer.address);
    console.log(`Borrow balance: ${ethers.formatUnits(borrowBalance, 18)}`);
    
    // Check new token balance
    const newTokenBalance = await token.balanceOf(deployer.address);
    console.log(`New token balance: ${ethers.formatUnits(newTokenBalance, 6)} USDC`);
  } catch (error) {
    console.log(`Failed to borrow: ${error.message}`);
  }
  
  console.log("\nDemo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 