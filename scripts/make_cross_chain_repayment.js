// Script to make a cross-chain repayment using Chainlink CCIP
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

// This script demonstrates sending a payment from a source chain to repay a loan on a destination chain
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.error("Usage: node make_cross_chain_repayment.js <source-chain> <destination-chain> <borrower-address> <token-address> <amount> [--native-pay]");
    process.exit(1);
  }
  
  const sourceChain = args[0];
  const destinationChain = args[1];
  const borrowerAddress = args[2];
  const tokenAddress = args[3];
  const amount = args[4];
  const useNativePay = args.includes("--native-pay");
  
  console.log(`Making cross-chain repayment:
  - Source chain: ${sourceChain}
  - Destination chain: ${destinationChain}
  - Borrower: ${borrowerAddress}
  - Token: ${tokenAddress}
  - Amount: ${amount}
  - Payment method: ${useNativePay ? "Native token" : "LINK token"}
  `);
  
  // Load deployments to get contract addresses
  const deploymentsPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    console.error("deployments.json not found!");
    process.exit(1);
  }
  
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  
  // Chain selectors for CCIP
  const chainSelectors = {
    ethereumSepolia: "16015286601757825753",
    avalancheFuji: "14767482510784806043",
    arbitrumSepolia: "3478487238524512106",
    polygonMumbai: "12532609583862916517",
    bnbChainTestnet: "13264668631405831108",
    hardhat: "12532609583862916517", // Using Mumbai's selector for local testing
    localhost: "12532609583862916517" // Using Mumbai's selector for local testing
    // Add more selectors as needed
  };
  
  // Link token addresses
  const linkTokens = {
    ethereumSepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    avalancheFuji: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
    arbitrumSepolia: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
    polygonMumbai: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    bnbChainTestnet: "0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06",
    hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Using our test token for local testing
    localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Using our test token for local testing
    // Add more as needed
  };
  
  if (!chainSelectors[destinationChain]) {
    console.error(`Chain selector not configured for destination chain: ${destinationChain}`);
    process.exit(1);
  }
  
  // Get the CCIP receiver address on the destination chain
  if (!deployments.LoanCCIPReceiver || !deployments.LoanCCIPReceiver.address) {
    console.error("LoanCCIPReceiver address not found in deployments.json!");
    process.exit(1);
  }
  
  // Get the CCIP sender contract on the source chain
  if (!deployments.ccipSenderContracts || !deployments.ccipSenderContracts[sourceChain]) {
    console.error(`CCIPSenderExample address not found for ${sourceChain} in deployments.json!`);
    console.error("Please deploy the CCIPSenderExample contract first using scripts/deploy_ccip_sender.js");
    process.exit(1);
  }
  
  const ccipReceiverAddress = deployments.LoanCCIPReceiver.address;
  console.log(`CCIP Receiver address on destination chain: ${ccipReceiverAddress}`);
  
  const ccipSenderAddress = deployments.ccipSenderContracts[sourceChain].address;
  console.log(`CCIP Sender address on source chain: ${ccipSenderAddress}`);
  
  // Create a provider and signer for the source chain
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Load the token contract
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
    "function transfer(address, uint256) returns (bool)",
    "function allowance(address, address) view returns (uint256)",
    "function faucet(uint256) returns ()"  // Add faucet function for TestToken
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  
  // Get token balance
  let tokenBalance = await tokenContract.balanceOf(signerAddress);
  console.log(`Initial token balance: ${ethers.formatUnits(tokenBalance, 18)} tokens`);
  
  // If this is our TestToken, we can get tokens from the faucet if needed
  const amountNeeded = ethers.parseUnits(amount, 18);
  if (tokenBalance < amountNeeded) {
    console.log("Insufficient token balance. Requesting tokens from faucet...");
    try {
      const faucetTx = await tokenContract.faucet(amountNeeded);
      await faucetTx.wait();
      console.log(`Faucet request successful! Tx hash: ${faucetTx.hash}`);
      
      // Check updated balance
      tokenBalance = await tokenContract.balanceOf(signerAddress);
      console.log(`Updated token balance: ${ethers.formatUnits(tokenBalance, 18)} tokens`);
    } catch (error) {
      console.error("Error requesting tokens from faucet:", error.message);
      process.exit(1);
    }
  }
  
  if (tokenBalance < amountNeeded) {
    console.error("Still insufficient token balance after faucet request!");
    process.exit(1);
  }
  
  // Connect to the CCIP sender contract
  const CCIPSenderAbi = (await hre.artifacts.readArtifact("CCIPSenderExample")).abi;
  const ccipSender = new ethers.Contract(ccipSenderAddress, CCIPSenderAbi, signer);
  
  // Approve the CCIP sender to spend tokens
  console.log(`Approving tokens for CCIP Sender...`);
  const approveTx = await tokenContract.approve(
    ccipSenderAddress, 
    ethers.parseUnits(amount, 18)
  );
  await approveTx.wait();
  console.log(`Token approval successful! Tx hash: ${approveTx.hash}`);
  
  // If paying with LINK, we need to fund the sender contract
  if (!useNativePay) {
    const linkTokenAddress = linkTokens[sourceChain];
    if (!linkTokenAddress) {
      console.error(`LINK token address not configured for chain: ${sourceChain}`);
      process.exit(1);
    }
    
    const linkToken = new ethers.Contract(linkTokenAddress, ERC20_ABI, signer);
    
    // Send some LINK to the contract for fees (0.1 LINK is usually enough for testing)
    console.log(`Sending LINK to CCIP Sender for fees...`);
    const linkTx = await linkToken.transfer(ccipSenderAddress, ethers.parseUnits("0.1", 18));
    await linkTx.wait();
    console.log(`LINK transfer successful! Tx hash: ${linkTx.hash}`);
  }
  
  // Send the CCIP message with token
  console.log(`Sending CCIP message with token repayment...`);
  
  let tx;
  if (useNativePay) {
    // Send payment using native tokens for fees
    tx = await ccipSender.sendTokensPayNative(
      chainSelectors[destinationChain],  // Destination chain selector
      ccipReceiverAddress,               // Receiver address on destination chain
      tokenAddress,                      // Token address on source chain
      ethers.parseUnits(amount, 18),     // Amount of tokens to send
      borrowerAddress,                   // Borrower address for repayment
      { value: ethers.parseUnits("0.1", 18) } // 0.1 native token for fees
    );
  } else {
    // Send payment using LINK tokens for fees
    tx = await ccipSender.sendTokensPayLINK(
      chainSelectors[destinationChain],  // Destination chain selector
      ccipReceiverAddress,               // Receiver address on destination chain
      tokenAddress,                      // Token address on source chain
      ethers.parseUnits(amount, 18),     // Amount of tokens to send
      borrowerAddress                    // Borrower address for repayment
    );
  }
  
  const receipt = await tx.wait();
  console.log(`CCIP message sent! Transaction hash: ${receipt.hash}`);
  console.log();
  console.log("Cross-chain repayment initiated successfully!");
  console.log(`Check the transaction on the source chain (${sourceChain}) explorer.`);
  console.log(`The CCIP message will be delivered to the destination chain (${destinationChain}) shortly.`);
  console.log(`Note: CCIP message delivery typically takes about 2-5 minutes to complete.`);
}

// We recommend this pattern to be able to use async/await everywhere
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 