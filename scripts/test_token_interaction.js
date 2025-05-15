const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting TestToken interaction test...");

  // Get deployments
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    console.error("deployments.json not found!");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  const testTokenAddress = deployments.TestToken.address;
  
  console.log(`TestToken address: ${testTokenAddress}`);

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`Signer address: ${signerAddress}`);

  // Get contract
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const testToken = TestToken.attach(testTokenAddress);

  // Check initial balance
  const initialBalance = await testToken.balanceOf(signerAddress);
  console.log(`Initial balance: ${hre.ethers.formatUnits(initialBalance, 18)} TEST`);

  // Request tokens from faucet
  console.log("Requesting 1000 tokens from faucet...");
  const faucetTx = await testToken.faucet(hre.ethers.parseUnits("1000", 18));
  await faucetTx.wait();
  console.log(`Faucet transaction hash: ${faucetTx.hash}`);

  // Check updated balance
  const updatedBalance = await testToken.balanceOf(signerAddress);
  console.log(`Updated balance: ${hre.ethers.formatUnits(updatedBalance, 18)} TEST`);

  // Transfer tokens to another account
  const recipientAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account #1 in Hardhat
  console.log(`Transferring 100 tokens to ${recipientAddress}...`);
  const transferTx = await testToken.transfer(recipientAddress, hre.ethers.parseUnits("100", 18));
  await transferTx.wait();
  console.log(`Transfer transaction hash: ${transferTx.hash}`);

  // Check balances after transfer
  const finalBalance = await testToken.balanceOf(signerAddress);
  console.log(`Final sender balance: ${hre.ethers.formatUnits(finalBalance, 18)} TEST`);

  const recipientBalance = await testToken.balanceOf(recipientAddress);
  console.log(`Recipient balance: ${hre.ethers.formatUnits(recipientBalance, 18)} TEST`);

  console.log("TestToken interaction test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in TestToken interaction test:");
    console.error(error);
    process.exit(1);
  }); 