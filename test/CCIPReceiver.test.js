const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("LoanCCIPReceiver", function () {
  let loanCCIPReceiver;
  let mockLendingPool;
  let mockRouter;
  let mockToken;
  let owner;
  let user1;
  let user2;
  let borrower;
  
  const sourceChainSelector = "16015286601757825753"; // Random chain selector
  const SOURCE_CHAIN_NAME = "Sepolia";
  
  // Message structure
  const createCCIPMessage = (borrowerAddress, amount, tokenAddress) => {
    const data = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256"],
      [borrowerAddress, amount]
    );
    
    return {
      messageId: ethers.randomBytes(32),
      sourceChainSelector: sourceChainSelector,
      sender: ethers.Wallet.createRandom().address, // Random address
      data: data,
      destTokenAmounts: [
        {
          token: tokenAddress,
          amount: amount
        }
      ]
    };
  };
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, borrower] = await ethers.getSigners();
    
    // Deploy mock contracts
    const MockRouter = await ethers.getContractFactory("MockCCIPRouter");
    mockRouter = await MockRouter.deploy();
    
    const MockLendingPool = await ethers.getContractFactory("MockLendingPool");
    mockLendingPool = await MockLendingPool.deploy();
    
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MTK");
    
    // Deploy LoanCCIPReceiver
    const LoanCCIPReceiver = await ethers.getContractFactory("LoanCCIPReceiver");
    loanCCIPReceiver = await LoanCCIPReceiver.deploy(mockRouter.address, mockLendingPool.address);
  });
  
  describe("Constructor", function () {
    it("Should set the owner correctly", async function () {
      expect(await loanCCIPReceiver.owner()).to.equal(owner.address);
    });
    
    it("Should set the router address correctly", async function () {
      expect(await loanCCIPReceiver.getRouter()).to.equal(mockRouter.address);
    });
    
    it("Should set the lending pool address correctly", async function () {
      expect(await loanCCIPReceiver.lendingPool()).to.equal(mockLendingPool.address);
    });
    
    it("Should revert if router address is zero", async function () {
      const LoanCCIPReceiver = await ethers.getContractFactory("LoanCCIPReceiver");
      await expect(LoanCCIPReceiver.deploy(ethers.ZeroAddress, mockLendingPool.address))
        .to.be.revertedWith("Router address cannot be zero");
    });
    
    it("Should revert if lending pool address is zero", async function () {
      const LoanCCIPReceiver = await ethers.getContractFactory("LoanCCIPReceiver");
      await expect(LoanCCIPReceiver.deploy(mockRouter.address, ethers.ZeroAddress))
        .to.be.revertedWith("Lending pool address cannot be zero");
    });
  });
  
  describe("setLendingPool", function () {
    it("Should update the lending pool address", async function () {
      await loanCCIPReceiver.setLendingPool(user1.address);
      expect(await loanCCIPReceiver.lendingPool()).to.equal(user1.address);
    });
    
    it("Should emit LendingPoolUpdated event", async function () {
      await expect(loanCCIPReceiver.setLendingPool(user1.address))
        .to.emit(loanCCIPReceiver, "LendingPoolUpdated")
        .withArgs(mockLendingPool.address, user1.address);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(loanCCIPReceiver.connect(user1).setLendingPool(user2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if new lending pool address is zero", async function () {
      await expect(loanCCIPReceiver.setLendingPool(ethers.ZeroAddress))
        .to.be.revertedWith("Lending pool address cannot be zero");
    });
  });
  
  describe("addTrustedSources", function () {
    it("Should add a trusted source", async function () {
      await loanCCIPReceiver.addTrustedSources([sourceChainSelector], [user1.address]);
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user1.address)).to.equal(true);
    });
    
    it("Should add multiple trusted sources", async function () {
      await loanCCIPReceiver.addTrustedSources(
        [sourceChainSelector, sourceChainSelector],
        [user1.address, user2.address]
      );
      
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user1.address)).to.equal(true);
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user2.address)).to.equal(true);
    });
    
    it("Should emit SourceAdded events", async function () {
      await expect(loanCCIPReceiver.addTrustedSources([sourceChainSelector], [user1.address]))
        .to.emit(loanCCIPReceiver, "SourceAdded")
        .withArgs(sourceChainSelector, user1.address);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(loanCCIPReceiver.connect(user1).addTrustedSources([sourceChainSelector], [user2.address]))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if arrays length mismatch", async function () {
      await expect(loanCCIPReceiver.addTrustedSources(
        [sourceChainSelector, sourceChainSelector],
        [user1.address]
      ))
        .to.be.revertedWith("Arrays length mismatch");
    });
    
    it("Should revert if sender address is zero", async function () {
      await expect(loanCCIPReceiver.addTrustedSources([sourceChainSelector], [ethers.ZeroAddress]))
        .to.be.revertedWith("Sender address cannot be zero");
    });
  });
  
  describe("removeTrustedSources", function () {
    beforeEach(async function () {
      // Add trusted sources first
      await loanCCIPReceiver.addTrustedSources(
        [sourceChainSelector, sourceChainSelector],
        [user1.address, user2.address]
      );
    });
    
    it("Should remove a trusted source", async function () {
      await loanCCIPReceiver.removeTrustedSources([sourceChainSelector], [user1.address]);
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user1.address)).to.equal(false);
      // Ensure other source is still trusted
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user2.address)).to.equal(true);
    });
    
    it("Should remove multiple trusted sources", async function () {
      await loanCCIPReceiver.removeTrustedSources(
        [sourceChainSelector, sourceChainSelector],
        [user1.address, user2.address]
      );
      
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user1.address)).to.equal(false);
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user2.address)).to.equal(false);
    });
    
    it("Should emit SourceRemoved events", async function () {
      await expect(loanCCIPReceiver.removeTrustedSources([sourceChainSelector], [user1.address]))
        .to.emit(loanCCIPReceiver, "SourceRemoved")
        .withArgs(sourceChainSelector, user1.address);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(loanCCIPReceiver.connect(user1).removeTrustedSources([sourceChainSelector], [user2.address]))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if arrays length mismatch", async function () {
      await expect(loanCCIPReceiver.removeTrustedSources(
        [sourceChainSelector, sourceChainSelector],
        [user1.address]
      ))
        .to.be.revertedWith("Arrays length mismatch");
    });
    
    it("Should not revert if source is not trusted", async function () {
      // Should execute without errors
      await loanCCIPReceiver.removeTrustedSources([sourceChainSelector], [borrower.address]);
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, borrower.address)).to.equal(false);
    });
  });
  
  describe("isTrustedSender", function () {
    beforeEach(async function () {
      await loanCCIPReceiver.addTrustedSources([sourceChainSelector], [user1.address]);
    });
    
    it("Should return true for trusted sources", async function () {
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user1.address)).to.equal(true);
    });
    
    it("Should return false for non-trusted sources", async function () {
      expect(await loanCCIPReceiver.isTrustedSender(sourceChainSelector, user2.address)).to.equal(false);
    });
    
    it("Should return false for trusted address on different chain", async function () {
      const differentChainSelector = "9876543210";
      expect(await loanCCIPReceiver.isTrustedSender(differentChainSelector, user1.address)).to.equal(false);
    });
  });
  
  describe("ccipReceive", function () {
    beforeEach(async function () {
      // Add trusted source
      await loanCCIPReceiver.addTrustedSources([sourceChainSelector], [user1.address]);
      
      // Mint tokens to the receiver contract
      await mockToken.mint(loanCCIPReceiver.address, ethers.parseEther("1000"));
    });
    
    it("Should revert if called directly (not by router)", async function () {
      const message = createCCIPMessage(borrower.address, ethers.parseEther("100"), mockToken.address);
      
      await expect(loanCCIPReceiver.ccipReceive(message))
        .to.be.revertedWith("Only callable by the router");
    });
    
    it("Should process message and emit event when called by router", async function () {
      const amount = ethers.parseEther("100");
      const message = createCCIPMessage(borrower.address, amount, mockToken.address);
      
      // Set sender as trusted
      await loanCCIPReceiver.addTrustedSources([sourceChainSelector], [message.sender]);
      
      // Mock router call to ccipReceive
      await mockRouter.simulateCcipReceive(loanCCIPReceiver.address, message);
      
      // Check the event was emitted
      const events = await mockRouter.getEmittedEvents();
      expect(events.length).to.be.greaterThan(0);
      
      // Verify the repayment record
      const lastEvent = events[events.length - 1];
      expect(lastEvent.eventName).to.equal("RepaymentReceived");
      expect(lastEvent.args.messageId).to.equal(ethers.hexlify(message.messageId));
      expect(lastEvent.args.sourceChainSelector).to.equal(message.sourceChainSelector);
      expect(lastEvent.args.borrower).to.equal(borrower.address);
      expect(lastEvent.args.token).to.equal(mockToken.address);
      expect(lastEvent.args.amount).to.equal(amount);
    });
    
    it("Should revert if sender is not trusted", async function () {
      const amount = ethers.parseEther("100");
      const message = createCCIPMessage(borrower.address, amount, mockToken.address);
      
      // Sender not added to trusted sources
      
      // This should revert
      await expect(mockRouter.simulateCcipReceive(loanCCIPReceiver.address, message))
        .to.be.revertedWith("Sender is not trusted");
    });
    
    it("Should handle repayment failure gracefully", async function () {
      const amount = ethers.parseEther("100");
      const message = createCCIPMessage(borrower.address, amount, mockToken.address);
      
      // Set sender as trusted
      await loanCCIPReceiver.addTrustedSources([sourceChainSelector], [message.sender]);
      
      // Set lending pool to fail repayments
      await mockLendingPool.setFailRepayments(true);
      
      // This should not revert but emit RepaymentFailed
      await mockRouter.simulateCcipReceive(loanCCIPReceiver.address, message);
      
      // Check the event was emitted
      const events = await mockRouter.getEmittedEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.eventName).to.equal("RepaymentFailed");
      expect(lastEvent.args.borrower).to.equal(borrower.address);
    });
  });
  
  describe("withdrawToken", function () {
    beforeEach(async function () {
      // Mint tokens to the receiver contract
      await mockToken.mint(loanCCIPReceiver.address, ethers.parseEther("1000"));
    });
    
    it("Should allow owner to withdraw tokens", async function () {
      const withdrawAmount = ethers.parseEther("500");
      
      // Before withdrawal
      const initialBalance = await mockToken.balanceOf(owner.address);
      
      // Withdraw tokens
      await loanCCIPReceiver.withdrawToken(mockToken.address, owner.address, withdrawAmount);
      
      // After withdrawal
      const finalBalance = await mockToken.balanceOf(owner.address);
      
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);
    });
    
    it("Should emit TokensWithdrawn event", async function () {
      const withdrawAmount = ethers.parseEther("500");
      
      await expect(loanCCIPReceiver.withdrawToken(mockToken.address, owner.address, withdrawAmount))
        .to.emit(loanCCIPReceiver, "TokensWithdrawn")
        .withArgs(mockToken.address, owner.address, withdrawAmount);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(loanCCIPReceiver.connect(user1).withdrawToken(
        mockToken.address, user1.address, ethers.parseEther("500")
      ))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if target address is zero", async function () {
      await expect(loanCCIPReceiver.withdrawToken(
        mockToken.address, ethers.ZeroAddress, ethers.parseEther("500")
      ))
        .to.be.revertedWith("Target address cannot be zero");
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(loanCCIPReceiver.withdrawToken(
        mockToken.address, owner.address, 0
      ))
        .to.be.revertedWith("Amount cannot be zero");
    });
    
    it("Should revert if amount exceeds balance", async function () {
      await expect(loanCCIPReceiver.withdrawToken(
        mockToken.address, owner.address, ethers.parseEther("2000")
      ))
        .to.be.revertedWith("Not enough balance");
    });
  });
  
  describe("withdrawETH", function () {
    beforeEach(async function () {
      // Send ETH to the contract
      await owner.sendTransaction({
        to: loanCCIPReceiver.address,
        value: ethers.parseEther("10")
      });
    });
    
    it("Should allow owner to withdraw ETH", async function () {
      const withdrawAmount = ethers.parseEther("5");
      
      // Before withdrawal
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      // Withdraw ETH
      await loanCCIPReceiver.withdrawETH(user1.address, withdrawAmount);
      
      // After withdrawal
      const finalBalance = await ethers.provider.getBalance(user1.address);
      
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);
    });
    
    it("Should emit ETHWithdrawn event", async function () {
      const withdrawAmount = ethers.parseEther("5");
      
      await expect(loanCCIPReceiver.withdrawETH(owner.address, withdrawAmount))
        .to.emit(loanCCIPReceiver, "ETHWithdrawn")
        .withArgs(owner.address, withdrawAmount);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(loanCCIPReceiver.connect(user1).withdrawETH(
        user1.address, ethers.parseEther("5")
      ))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if target address is zero", async function () {
      await expect(loanCCIPReceiver.withdrawETH(
        ethers.ZeroAddress, ethers.parseEther("5")
      ))
        .to.be.revertedWith("Target address cannot be zero");
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(loanCCIPReceiver.withdrawETH(owner.address, 0))
        .to.be.revertedWith("Amount cannot be zero");
    });
    
    it("Should revert if amount exceeds balance", async function () {
      await expect(loanCCIPReceiver.withdrawETH(
        owner.address, ethers.parseEther("20")
      ))
        .to.be.revertedWith("Not enough balance");
    });
  });
  
  describe("receive function", function () {
    it("Should accept ETH transfers", async function () {
      const sendAmount = ethers.parseEther("1");
      
      // Send ETH to the contract
      await owner.sendTransaction({
        to: loanCCIPReceiver.address,
        value: sendAmount
      });
      
      // Check contract balance
      const contractBalance = await ethers.provider.getBalance(loanCCIPReceiver.address);
      expect(contractBalance).to.equal(sendAmount);
    });
  });
});

// Mock contracts for testing

// Mock CCIP Router
const MockCCIPRouterFactory = async () => {
  const MockCCIPRouter = await ethers.getContractFactory("MockCCIPRouter");
  return await MockCCIPRouter.deploy();
};

// Mock LendingPool
const MockLendingPoolFactory = async () => {
  const MockLendingPool = await ethers.getContractFactory("MockLendingPool");
  return await MockLendingPool.deploy();
};

// Mock ERC20 Token
const MockERC20Factory = async (name, symbol) => {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  return await MockERC20.deploy(name, symbol);
}; 