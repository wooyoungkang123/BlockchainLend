const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying consolidated contracts...");
  
  // Get the Deploy contract factory
  const Deploy = await ethers.getContractFactory("Deploy");
  console.log("Deploying Deploy contract...");
  const deploy = await Deploy.deploy();
  await deploy.waitForDeployment();
  
  console.log(`Deploy contract deployed to: ${await deploy.getAddress()}`);
  
  // Use the deployAll function to deploy all contracts
  console.log("Deploying all contracts (Token, PriceFeed, LendingPool)...");
  const tx = await deploy.deployAll();
  await tx.wait();
  
  // Get deployed contract addresses
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
  
  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 