const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Simulating cross-chain repayment...");

  // Get deployments
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  
  const testTokenAddress = deployments.TestToken.address;
  const lendingPoolAddress = deployments.LendingPool.address;
  const ccipReceiverAddress = deployments.LoanCCIPReceiver.address;
  
  console.log(`TestToken address: ${testTokenAddress}`);
  console.log(`LendingPool address: ${lendingPoolAddress}`);
  console.log(`CCIPReceiver address: ${ccipReceiverAddress}`);

  // Get signers - using account #0 as lender/deployer and account #1 as borrower
  const [deployer, borrower] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const borrowerAddress = await borrower.getAddress();
  
  console.log(`Deployer/Lender address: ${deployerAddress}`);
  console.log(`Borrower address: ${borrowerAddress}`);

  // Get contracts
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const LendingPool = await hre.ethers.getContractFactory("LendingPool");
  const LoanCCIPReceiver = await hre.ethers.getContractFactory("LoanCCIPReceiver");
  
  const testToken = TestToken.attach(testTokenAddress);
  const lendingPool = LendingPool.attach(lendingPoolAddress);
  const ccipReceiver = LoanCCIPReceiver.attach(ccipReceiverAddress);

  // Step 1: Transfer some tokens to the borrower and check initial balances
  console.log("\n--- Step 1: Initial setup ---");
  
  // Ensure deployer has enough tokens
  const deployerInitialBalance = await testToken.balanceOf(deployerAddress);
  console.log(`Deployer initial token balance: ${hre.ethers.formatUnits(deployerInitialBalance, 18)}`);
  
  // Use faucet to get more tokens if needed
  if (deployerInitialBalance < hre.ethers.parseUnits("10000", 18)) {
    console.log("Requesting more tokens from faucet...");
    await testToken.faucet(hre.ethers.parseUnits("10000", 18));
  }
  
  // Transfer tokens to borrower for initial deposit
  console.log(`Transferring 1000 tokens to borrower...`);
  await testToken.transfer(borrowerAddress, hre.ethers.parseUnits("1000", 18));
  
  const borrowerBalance = await testToken.balanceOf(borrowerAddress);
  console.log(`Borrower token balance: ${hre.ethers.formatUnits(borrowerBalance, 18)}`);

  // Step 2: Borrower deposits tokens into lending pool
  console.log("\n--- Step 2: Borrower deposits tokens ---");
  
  const depositAmount = hre.ethers.parseUnits("500", 18);
  console.log(`Borrower depositing ${hre.ethers.formatUnits(depositAmount, 18)} tokens...`);
  
  // Approve tokens for lending pool from borrower account
  await testToken.connect(borrower).approve(lendingPoolAddress, depositAmount);
  
  // Deposit tokens
  await lendingPool.connect(borrower).deposit(depositAmount);
  
  // Check updated balances
  const borrowerBalanceAfterDeposit = await testToken.balanceOf(borrowerAddress);
  console.log(`Borrower token balance after deposit: ${hre.ethers.formatUnits(borrowerBalanceAfterDeposit, 18)}`);
  
  const borrowerDepositInPool = await lendingPool.deposits(borrowerAddress);
  console.log(`Borrower deposit in pool: ${hre.ethers.formatUnits(borrowerDepositInPool, 18)}`);

  // Step 3: Borrower takes out a loan
  console.log("\n--- Step 3: Borrower takes out a loan ---");
  
  const borrowAmount = hre.ethers.parseUnits("200", 18);
  console.log(`Borrower borrowing ${hre.ethers.formatUnits(borrowAmount, 18)} tokens...`);
  
  await lendingPool.connect(borrower).borrow(borrowAmount);
  
  // Check updated balances
  const borrowerBorrowBalance = await lendingPool.borrows(borrowerAddress);
  console.log(`Borrower borrow balance: ${hre.ethers.formatUnits(borrowerBorrowBalance, 18)}`);
  
  const borrowerBalanceAfterBorrow = await testToken.balanceOf(borrowerAddress);
  console.log(`Borrower token balance after borrowing: ${hre.ethers.formatUnits(borrowerBalanceAfterBorrow, 18)}`);

  // Step 4: Prepare for cross-chain repayment
  console.log("\n--- Step 4: Simulating cross-chain repayment ---");
  
  const repayAmount = hre.ethers.parseUnits("100", 18);
  console.log(`Repaying ${hre.ethers.formatUnits(repayAmount, 18)} tokens on behalf of borrower...`);

  // Calculate interest amount (5% default in LendingPool contract)
  const interestRate = await lendingPool.borrowInterestRate();
  const interestAmount = (repayAmount * interestRate) / 10000n;
  const totalRepayAmount = repayAmount + interestAmount;
  
  console.log(`Interest rate: ${interestRate / 100n}%`);
  console.log(`Interest amount: ${hre.ethers.formatUnits(interestAmount, 18)}`);
  console.log(`Total repayment amount: ${hre.ethers.formatUnits(totalRepayAmount, 18)}`);
  
  // Configure the CCIPReceiver to trust the deployer as a source
  const sourceChainSelector = "16015286601757825753"; // Ethereum Sepolia selector as an example
  console.log(`Adding deployer as trusted source for chain ${sourceChainSelector}...`);
  await ccipReceiver.addTrustedSource(sourceChainSelector, deployerAddress);
  
  // We'll perform the repayment directly without transferring to CCIPReceiver
  
  // Step 5: Directly call repayOnBehalf to simulate the CCIP message being received
  console.log("\n--- Step 5: Execute repayment ---");
  
  // We need to grant the deployer the ability to call repayOnBehalf by temporarily
  // setting the deployer as the ccipReceiver in the lending pool
  console.log(`Temporarily setting deployer as ccipReceiver...`);
  const currentCCIPReceiver = await lendingPool.ccipReceiver();
  await lendingPool.setCCIPReceiver(deployerAddress);
  
  // Now we can simulate a repayment
  console.log(`Approving tokens for LendingPool...`);
  await testToken.approve(lendingPoolAddress, totalRepayAmount);
  
  console.log(`Executing repayOnBehalf...`);
  await lendingPool.repayOnBehalf(borrowerAddress, repayAmount);
  
  // Reset the CCIP receiver
  console.log(`Resetting ccipReceiver to original address...`);
  await lendingPool.setCCIPReceiver(currentCCIPReceiver);
  
  // Check final balances
  const finalBorrowBalance = await lendingPool.borrows(borrowerAddress);
  console.log(`Borrower final borrow balance: ${hre.ethers.formatUnits(finalBorrowBalance, 18)}`);
  
  const finalPoolBalance = await lendingPool.deposits(borrowerAddress);
  console.log(`Borrower final deposit balance: ${hre.ethers.formatUnits(finalPoolBalance, 18)}`);
  
  console.log("\nCross-chain repayment simulation completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error simulating cross-chain repayment:");
    console.error(error);
    process.exit(1);
  }); 