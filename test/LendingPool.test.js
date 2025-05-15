const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("LendingPool", function () {
  let lendingPool;
  let testToken;
  let owner;
  let user1;
  let user2;
  let ccipReceiver;
  
  const initialSupply = ethers.parseUnits("1000000", 18);
  const depositAmount = ethers.parseUnits("1000", 18);
  const borrowAmount = ethers.parseUnits("400", 18);
  const smallAmount = ethers.parseUnits("10", 18);
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, ccipReceiver] = await ethers.getSigners();
    
    // Deploy TestToken
    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy("Test Token", "TEST", 1000000);
    
    // Deploy LendingPool with TestToken
    const LendingPool = await ethers.getContractFactory("LendingPool");
    lendingPool = await LendingPool.deploy(await testToken.getAddress());
    
    // Set ccipReceiver in LendingPool
    await lendingPool.setCCIPReceiver(ccipReceiver.address);
    
    // Mint tokens to users for testing
    await testToken.transfer(user1.address, depositAmount);
    await testToken.transfer(user2.address, depositAmount);
    
    // User1 approves LendingPool to spend tokens
    await testToken.connect(user1).approve(await lendingPool.getAddress(), depositAmount);
    
    // User2 approves LendingPool to spend tokens
    await testToken.connect(user2).approve(await lendingPool.getAddress(), depositAmount);
  });
  
  describe("Constructor", function () {
    it("Should set the correct lending token", async function () {
      expect(await lendingPool.lendingToken()).to.equal(await testToken.getAddress());
    });
    
    it("Should set the owner correctly", async function () {
      expect(await lendingPool.owner()).to.equal(owner.address);
    });
    
    it("Should revert if token address is zero", async function () {
      const LendingPool = await ethers.getContractFactory("LendingPool");
      await expect(LendingPool.deploy(ethers.ZeroAddress))
        .to.be.revertedWith("LendingPool: token address cannot be zero");
    });
  });
  
  describe("setCCIPReceiver", function () {
    it("Should set the CCIP receiver correctly", async function () {
      const newReceiver = user2.address;
      await lendingPool.setCCIPReceiver(newReceiver);
      expect(await lendingPool.ccipReceiver()).to.equal(newReceiver);
    });
    
    it("Should emit CCIPReceiverUpdated event", async function () {
      const newReceiver = user2.address;
      await expect(lendingPool.setCCIPReceiver(newReceiver))
        .to.emit(lendingPool, "CCIPReceiverUpdated")
        .withArgs(newReceiver);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(lendingPool.connect(user1).setCCIPReceiver(user2.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if receiver address is zero", async function () {
      await expect(lendingPool.setCCIPReceiver(ethers.ZeroAddress))
        .to.be.revertedWith("LendingPool: CCIP receiver cannot be zero address");
    });
  });
  
  describe("deposit", function () {
    it("Should deposit tokens correctly", async function () {
      await lendingPool.connect(user1).deposit(depositAmount);
      
      expect(await lendingPool.deposits(user1.address)).to.equal(depositAmount);
      expect(await lendingPool.totalDeposits()).to.equal(depositAmount);
      expect(await testToken.balanceOf(await lendingPool.getAddress())).to.equal(depositAmount);
    });
    
    it("Should emit Deposited event", async function () {
      await expect(lendingPool.connect(user1).deposit(depositAmount))
        .to.emit(lendingPool, "Deposited")
        .withArgs(user1.address, depositAmount);
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(lendingPool.connect(user1).deposit(0))
        .to.be.revertedWith("LendingPool: deposit amount must be greater than zero");
    });
    
    it("Should allow multiple deposits", async function () {
      await lendingPool.connect(user1).deposit(smallAmount);
      await lendingPool.connect(user1).deposit(smallAmount);
      
      expect(await lendingPool.deposits(user1.address)).to.equal(smallAmount * 2n);
    });
  });
  
  describe("withdraw", function () {
    beforeEach(async function () {
      // User1 deposits tokens
      await lendingPool.connect(user1).deposit(depositAmount);
    });
    
    it("Should withdraw tokens correctly", async function () {
      const withdrawAmount = depositAmount / 2n;
      const initialBalance = await testToken.balanceOf(user1.address);
      
      await lendingPool.connect(user1).withdraw(withdrawAmount);
      
      expect(await lendingPool.deposits(user1.address)).to.equal(depositAmount - withdrawAmount);
      expect(await lendingPool.totalDeposits()).to.equal(depositAmount - withdrawAmount);
      expect(await testToken.balanceOf(user1.address)).to.equal(initialBalance + withdrawAmount);
    });
    
    it("Should emit Withdrawn event", async function () {
      const withdrawAmount = depositAmount / 2n;
      
      await expect(lendingPool.connect(user1).withdraw(withdrawAmount))
        .to.emit(lendingPool, "Withdrawn")
        .withArgs(user1.address, withdrawAmount);
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(lendingPool.connect(user1).withdraw(0))
        .to.be.revertedWith("LendingPool: withdraw amount must be greater than zero");
    });
    
    it("Should revert if amount exceeds deposit balance", async function () {
      await expect(lendingPool.connect(user1).withdraw(depositAmount + 1n))
        .to.be.revertedWith("LendingPool: insufficient deposit balance");
    });
    
    it("Should revert if amount exceeds available liquidity", async function () {
      // User1 deposits, then borrows to reduce liquidity
      await lendingPool.connect(user1).borrow(depositAmount / 3n);
      
      // User2 deposits
      await lendingPool.connect(user2).deposit(smallAmount);
      
      // User1 tries to withdraw all (which now exceeds available liquidity)
      await expect(lendingPool.connect(user1).withdraw(depositAmount))
        .to.be.revertedWith("LendingPool: insufficient liquidity");
    });
  });
  
  describe("borrow", function () {
    beforeEach(async function () {
      // User1 deposits tokens
      await lendingPool.connect(user1).deposit(depositAmount);
    });
    
    it("Should borrow tokens correctly", async function () {
      const initialBalance = await testToken.balanceOf(user1.address);
      
      await lendingPool.connect(user1).borrow(borrowAmount);
      
      expect(await lendingPool.borrows(user1.address)).to.equal(borrowAmount);
      expect(await lendingPool.totalBorrows()).to.equal(borrowAmount);
      expect(await testToken.balanceOf(user1.address)).to.equal(initialBalance + borrowAmount);
    });
    
    it("Should emit Borrowed event", async function () {
      await expect(lendingPool.connect(user1).borrow(borrowAmount))
        .to.emit(lendingPool, "Borrowed")
        .withArgs(user1.address, borrowAmount);
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(lendingPool.connect(user1).borrow(0))
        .to.be.revertedWith("LendingPool: borrow amount must be greater than zero");
    });
    
    it("Should revert if insufficient collateral", async function () {
      // Try to borrow more than half of the deposit (per the 2x collateral requirement)
      await expect(lendingPool.connect(user1).borrow(depositAmount / 2n + 1n))
        .to.be.revertedWith("LendingPool: insufficient collateral");
    });
    
    it("Should revert if insufficient liquidity", async function () {
      // User1 borrows maximum allowed
      await lendingPool.connect(user1).borrow(depositAmount / 2n);
      
      // User2 deposits and tries to borrow, but there's no liquidity left
      await lendingPool.connect(user2).deposit(depositAmount);
      await expect(lendingPool.connect(user2).borrow(depositAmount / 2n))
        .to.be.revertedWith("LendingPool: insufficient liquidity");
    });
  });
  
  describe("repay", function () {
    beforeEach(async function () {
      // User1 deposits and borrows
      await lendingPool.connect(user1).deposit(depositAmount);
      await lendingPool.connect(user1).borrow(borrowAmount);
      
      // Approve repayment amount plus interest
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      const totalRepayment = borrowAmount + interest;
      await testToken.connect(user1).approve(await lendingPool.getAddress(), totalRepayment);
    });
    
    it("Should repay borrowed tokens correctly", async function () {
      const initialBalance = await testToken.balanceOf(user1.address);
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      const totalRepayment = borrowAmount + interest;
      
      await lendingPool.connect(user1).repay(borrowAmount);
      
      expect(await lendingPool.borrows(user1.address)).to.equal(0);
      expect(await lendingPool.totalBorrows()).to.equal(0);
      expect(await testToken.balanceOf(user1.address)).to.equal(initialBalance - totalRepayment);
    });
    
    it("Should emit Repaid event", async function () {
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      
      await expect(lendingPool.connect(user1).repay(borrowAmount))
        .to.emit(lendingPool, "Repaid")
        .withArgs(user1.address, borrowAmount, interest);
    });
    
    it("Should handle partial repayment", async function () {
      const repayAmount = borrowAmount / 2n;
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (repayAmount * interestRate) / 10000n;
      
      await lendingPool.connect(user1).repay(repayAmount);
      
      expect(await lendingPool.borrows(user1.address)).to.equal(borrowAmount - repayAmount);
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(lendingPool.connect(user1).repay(0))
        .to.be.revertedWith("LendingPool: repay amount must be greater than zero");
    });
    
    it("Should revert if no outstanding borrow", async function () {
      await expect(lendingPool.connect(user2).repay(borrowAmount))
        .to.be.revertedWith("LendingPool: no outstanding borrow");
    });
    
    it("Should cap repayment at outstanding borrow amount", async function () {
      const excessRepay = borrowAmount * 2n;
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      const totalRepayment = borrowAmount + interest;
      
      // Approve excess amount
      await testToken.connect(user1).approve(await lendingPool.getAddress(), excessRepay + interest);
      
      // Initial pool balance
      const initialPoolBalance = await testToken.balanceOf(await lendingPool.getAddress());
      
      await lendingPool.connect(user1).repay(excessRepay);
      
      // Should only deduct the actual outstanding amount plus interest
      expect(await lendingPool.borrows(user1.address)).to.equal(0);
      expect(await testToken.balanceOf(await lendingPool.getAddress())).to.equal(initialPoolBalance + totalRepayment);
    });
  });
  
  describe("repayOnBehalf", function () {
    beforeEach(async function () {
      // User1 deposits and borrows
      await lendingPool.connect(user1).deposit(depositAmount);
      await lendingPool.connect(user1).borrow(borrowAmount);
      
      // CCIP receiver gets tokens and approves
      await testToken.transfer(ccipReceiver.address, depositAmount);
      await testToken.connect(ccipReceiver).approve(await lendingPool.getAddress(), depositAmount);
    });
    
    it("Should repay on behalf correctly", async function () {
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      
      await lendingPool.connect(ccipReceiver).repayOnBehalf(user1.address, borrowAmount);
      
      expect(await lendingPool.borrows(user1.address)).to.equal(0);
      expect(await lendingPool.totalBorrows()).to.equal(0);
    });
    
    it("Should emit RepaidOnBehalf event", async function () {
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      
      await expect(lendingPool.connect(ccipReceiver).repayOnBehalf(user1.address, borrowAmount))
        .to.emit(lendingPool, "RepaidOnBehalf")
        .withArgs(user1.address, ccipReceiver.address, borrowAmount, interest);
    });
    
    it("Should revert if caller is not CCIP receiver", async function () {
      await expect(lendingPool.connect(user2).repayOnBehalf(user1.address, borrowAmount))
        .to.be.revertedWith("LendingPool: only CCIP receiver can repay on behalf");
    });
    
    it("Should revert if amount is zero", async function () {
      await expect(lendingPool.connect(ccipReceiver).repayOnBehalf(user1.address, 0))
        .to.be.revertedWith("LendingPool: repay amount must be greater than zero");
    });
    
    it("Should revert if borrower address is zero", async function () {
      await expect(lendingPool.connect(ccipReceiver).repayOnBehalf(ethers.ZeroAddress, borrowAmount))
        .to.be.revertedWith("LendingPool: borrower cannot be zero address");
    });
    
    it("Should revert if no outstanding borrow", async function () {
      await expect(lendingPool.connect(ccipReceiver).repayOnBehalf(user2.address, borrowAmount))
        .to.be.revertedWith("LendingPool: no outstanding borrow");
    });
    
    it("Should cap repayment at outstanding borrow amount", async function () {
      const excessRepay = borrowAmount * 2n;
      const interestRate = await lendingPool.borrowInterestRate();
      const interest = (borrowAmount * interestRate) / 10000n;
      
      await lendingPool.connect(ccipReceiver).repayOnBehalf(user1.address, excessRepay);
      
      expect(await lendingPool.borrows(user1.address)).to.equal(0);
    });
  });
  
  describe("updateInterestRate", function () {
    it("Should update interest rate correctly", async function () {
      const newRate = 1000; // 10%
      await lendingPool.updateInterestRate(newRate);
      expect(await lendingPool.borrowInterestRate()).to.equal(newRate);
    });
    
    it("Should emit InterestRateUpdated event", async function () {
      const newRate = 1000; // 10%
      await expect(lendingPool.updateInterestRate(newRate))
        .to.emit(lendingPool, "InterestRateUpdated")
        .withArgs(newRate);
    });
    
    it("Should revert if caller is not owner", async function () {
      await expect(lendingPool.connect(user1).updateInterestRate(1000))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should revert if rate exceeds maximum", async function () {
      await expect(lendingPool.updateInterestRate(3001)) // > 30%
        .to.be.revertedWith("LendingPool: interest rate cannot exceed 30%");
    });
  });
  
  describe("getAvailableLiquidity", function () {
    it("Should return correct available liquidity", async function () {
      // Initial liquidity is 0
      expect(await lendingPool.getAvailableLiquidity()).to.equal(0);
      
      // After user1 deposits
      await lendingPool.connect(user1).deposit(depositAmount);
      expect(await lendingPool.getAvailableLiquidity()).to.equal(depositAmount);
      
      // After user1 borrows
      await lendingPool.connect(user1).borrow(borrowAmount);
      expect(await lendingPool.getAvailableLiquidity()).to.equal(depositAmount - borrowAmount);
    });
  });
  
  describe("getUserAccountData", function () {
    beforeEach(async function () {
      // User1 deposits and borrows
      await lendingPool.connect(user1).deposit(depositAmount);
      await lendingPool.connect(user1).borrow(borrowAmount);
    });
    
    it("Should return correct user account data", async function () {
      const userData = await lendingPool.getUserAccountData(user1.address);
      
      expect(userData[0]).to.equal(depositAmount); // depositBalance
      expect(userData[1]).to.equal(borrowAmount); // borrowBalance
      
      // availableToBorrow = depositBalance/2 - borrowBalance
      const expectedAvailable = depositAmount / 2n - borrowAmount;
      expect(userData[2]).to.equal(expectedAvailable);
    });
    
    it("Should handle user with no deposits or borrows", async function () {
      const userData = await lendingPool.getUserAccountData(user2.address);
      
      expect(userData[0]).to.equal(0); // depositBalance
      expect(userData[1]).to.equal(0); // borrowBalance
      expect(userData[2]).to.equal(0); // availableToBorrow
    });
    
    it("Should cap available to borrow at pool liquidity", async function () {
      // User1 has borrowAmount outstanding
      // User2 deposits and tries to get account data
      // The available liquidity is depositAmount - borrowAmount
      await lendingPool.connect(user2).deposit(depositAmount * 2n);
      
      const userData = await lendingPool.getUserAccountData(user2.address);
      const availableLiquidity = depositAmount - borrowAmount + depositAmount * 2n;
      const theoreticalMax = depositAmount * 2n / 2n; // 50% of user2's deposit
      
      // If theoretical max > available liquidity, should return available liquidity
      if (theoreticalMax > availableLiquidity) {
        expect(userData[2]).to.equal(availableLiquidity);
      } else {
        expect(userData[2]).to.equal(theoreticalMax);
      }
    });
  });
}); 