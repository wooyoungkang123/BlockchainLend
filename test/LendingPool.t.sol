// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/core/LendingPool.sol";
import "../contracts/mocks/MockToken.sol";
import "../contracts/mocks/MockPriceFeed.sol";
import "../scripts/Deploy.sol";

contract LendingPoolTest is Test {
    // Contracts
    Deploy public deploy;
    LendingPool public lendingPool;
    MockToken public token;
    MockPriceFeed public priceFeed;
    
    // Test addresses
    address public deployer = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    
    // Test constants
    uint256 public constant ETH_AMOUNT = 1 ether;
    uint256 public constant BORROW_AMOUNT = 1000 * 10**6; // 1000 USDC
    int256 public constant ETH_PRICE = 2000 * 10**8;      // $2000 per ETH
    int256 public constant ETH_PRICE_CRASH = 1000 * 10**8; // $1000 per ETH (price crash)
    
    function setUp() public {
        vm.startPrank(deployer);
        
        // Deploy all contracts
        deploy = new Deploy();
        (address tokenAddr, address priceFeedAddr, address lendingPoolAddr) = deploy.deployAll();
        
        // Get contract instances
        token = MockToken(tokenAddr);
        priceFeed = MockPriceFeed(priceFeedAddr);
        lendingPool = LendingPool(lendingPoolAddr);
        
        // Set up user1 with tokens
        token.mint(user1, BORROW_AMOUNT * 10);
        
        vm.stopPrank();
    }
    
    function testDeposit() public {
        vm.startPrank(user1);
        vm.deal(user1, ETH_AMOUNT);
        
        // Deposit ETH
        lendingPool.deposit{value: ETH_AMOUNT}();
        
        // Check deposit balance
        assertEq(lendingPool.depositBalances(user1), ETH_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testBorrowAndRepay() public {
        vm.startPrank(user1);
        vm.deal(user1, ETH_AMOUNT);
        
        // Deposit ETH
        lendingPool.deposit{value: ETH_AMOUNT}();
        
        // Approve and borrow tokens
        token.approve(address(lendingPool), BORROW_AMOUNT);
        lendingPool.borrow(BORROW_AMOUNT);
        
        // Check borrow balance and token balance
        assertEq(lendingPool.borrowBalances(user1), BORROW_AMOUNT);
        assertEq(token.balanceOf(user1), BORROW_AMOUNT * 10 + BORROW_AMOUNT);
        
        // Repay loan
        token.approve(address(lendingPool), BORROW_AMOUNT);
        lendingPool.repay(BORROW_AMOUNT);
        
        // Check that loan is repaid
        assertEq(lendingPool.borrowBalances(user1), 0);
        
        vm.stopPrank();
    }
    
    function testLiquidation() public {
        // User1 deposits collateral and borrows
        vm.startPrank(user1);
        vm.deal(user1, ETH_AMOUNT);
        
        lendingPool.deposit{value: ETH_AMOUNT}();
        token.approve(address(lendingPool), BORROW_AMOUNT);
        lendingPool.borrow(BORROW_AMOUNT);
        
        vm.stopPrank();
        
        // Crash ETH price to make the position liquidatable
        vm.startPrank(deployer);
        deploy.changeEthPrice(ETH_PRICE_CRASH);
        vm.stopPrank();
        
        // User2 liquidates user1's position
        vm.startPrank(user2);
        vm.deal(user2, ETH_AMOUNT);
        
        // User2 needs tokens to repay user1's loan
        token.mint(user2, BORROW_AMOUNT);
        token.approve(address(lendingPool), BORROW_AMOUNT);
        
        // Check that position is liquidatable
        (uint256 collateral, uint256 borrowed, uint256 health) = lendingPool.getUserAccountData(user1);
        assertLt(health, 100);
        
        // Liquidate
        lendingPool.liquidate(user1, BORROW_AMOUNT);
        
        // Check that liquidation worked
        assertEq(lendingPool.borrowBalances(user1), 0);
        assertGt(lendingPool.depositBalances(user2), 0);
        
        vm.stopPrank();
    }
    
    function testWithdraw() public {
        vm.startPrank(user1);
        vm.deal(user1, ETH_AMOUNT);
        
        // Deposit ETH
        lendingPool.deposit{value: ETH_AMOUNT}();
        
        // Withdraw half
        uint256 balanceBefore = address(user1).balance;
        lendingPool.withdraw(ETH_AMOUNT / 2);
        uint256 balanceAfter = address(user1).balance;
        
        // Check balances
        assertEq(balanceAfter - balanceBefore, ETH_AMOUNT / 2);
        assertEq(lendingPool.depositBalances(user1), ETH_AMOUNT / 2);
        
        vm.stopPrank();
    }
    
    function testHealthFactor() public {
        vm.startPrank(user1);
        vm.deal(user1, ETH_AMOUNT);
        
        // Deposit ETH
        lendingPool.deposit{value: ETH_AMOUNT}();
        
        // Get health factor before borrowing (should be max uint)
        (,, uint256 healthBefore) = lendingPool.getUserAccountData(user1);
        assertEq(healthBefore, type(uint256).max);
        
        // Borrow tokens
        token.approve(address(lendingPool), BORROW_AMOUNT);
        lendingPool.borrow(BORROW_AMOUNT);
        
        // Get health factor after borrowing
        (,, uint256 healthAfter) = lendingPool.getUserAccountData(user1);
        
        // Health factor should be around 200 (2000 * 1 ETH / 1000 USDC)
        assertGt(healthAfter, 190);
        assertLt(healthAfter, 210);
        
        vm.stopPrank();
    }
} 