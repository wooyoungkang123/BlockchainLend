// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/LendingPool.sol";
import "../contracts/test/MockERC20.sol";
import "../contracts/mocks/MockPriceFeed.sol";

contract LendingPoolTest is Test {
    // Contracts
    LendingPool public lendingPool;
    MockERC20 public token;
    MockPriceFeed public priceFeed;

    // Test addresses
    address public deployer;
    address public user1 = address(2);
    address public user2 = address(3);

    // Test constants
    uint256 public constant DEPOSIT_AMOUNT = 1000 * 10**6; // 1000 USDC
    uint256 public constant BORROW_AMOUNT = 500 * 10**6; // 500 USDC
    int256 public constant ETH_PRICE = 2000 * 10**8; // $2000 per ETH
    int256 public constant ETH_PRICE_CRASH = 1000 * 10**8; // $1000 per ETH (price crash)

    function setUp() public {
        deployer = address(this);

        // Deploy contracts
        token = new MockERC20("Test Token", "TEST");
        priceFeed = new MockPriceFeed(ETH_PRICE, 8);
        lendingPool = new LendingPool(address(token), address(priceFeed));

        // Set up users with tokens
        token.mint(user1, DEPOSIT_AMOUNT * 10);
        token.mint(user2, DEPOSIT_AMOUNT * 10);
        token.mint(address(lendingPool), DEPOSIT_AMOUNT * 20); // Add liquidity to the pool

        vm.prank(user1);
        token.approve(address(lendingPool), type(uint256).max);

        vm.prank(user2);
        token.approve(address(lendingPool), type(uint256).max);
    }

    function testDeposit() public {
        vm.startPrank(user1);

        // Deposit tokens
        lendingPool.deposit(DEPOSIT_AMOUNT);

        // Check deposit balance
        assertEq(lendingPool.deposits(user1), DEPOSIT_AMOUNT);
        assertEq(lendingPool.totalDeposits(), DEPOSIT_AMOUNT);

        vm.stopPrank();
    }

    function testBorrowAndRepay() public {
        vm.startPrank(user1);

        // Deposit tokens
        lendingPool.deposit(DEPOSIT_AMOUNT);

        // Borrow tokens (up to 50% of deposit)
        lendingPool.borrow(BORROW_AMOUNT);

        // Check borrow balance and token balance
        assertEq(lendingPool.borrows(user1), BORROW_AMOUNT);
        assertEq(lendingPool.totalBorrows(), BORROW_AMOUNT);
        assertEq(token.balanceOf(user1), DEPOSIT_AMOUNT * 10 - DEPOSIT_AMOUNT + BORROW_AMOUNT);

        // Repay loan
        token.approve(address(lendingPool), BORROW_AMOUNT * 2); // Include interest
        lendingPool.repay(BORROW_AMOUNT);

        // Check that loan is repaid
        assertEq(lendingPool.borrows(user1), 0);
        assertEq(lendingPool.totalBorrows(), 0);

        vm.stopPrank();
    }

    function testLiquidation() public {
        // User1 deposits and borrows almost maximum
        vm.startPrank(user1);
        lendingPool.deposit(DEPOSIT_AMOUNT);
        uint256 maxBorrow = (DEPOSIT_AMOUNT * 7900) / 10000; // Just below 80% of deposit (liquidation threshold)
        lendingPool.borrow(maxBorrow);
        vm.stopPrank();
        
        // Manually make the position undercollateralized by reducing deposits
        vm.store(
            address(lendingPool),
            keccak256(abi.encode(user1, uint256(3))), // deposits mapping slot
            bytes32(uint256(maxBorrow * 10000 / 8100)) // Make it just below the threshold
        );

        // User2 liquidates user1's position
        vm.startPrank(user2);
        lendingPool.liquidate(user1);

        // Check that user1's position is liquidated
        assertEq(lendingPool.deposits(user1), 0);
        assertEq(lendingPool.borrows(user1), 0);

        vm.stopPrank();
    }

    function testWithdraw() public {
        vm.startPrank(user1);

        // Deposit tokens
        lendingPool.deposit(DEPOSIT_AMOUNT);

        // Withdraw half
        uint256 balanceBefore = token.balanceOf(user1);
        lendingPool.withdraw(DEPOSIT_AMOUNT / 2);
        uint256 balanceAfter = token.balanceOf(user1);

        // Check balances
        assertEq(balanceAfter - balanceBefore, DEPOSIT_AMOUNT / 2);
        assertEq(lendingPool.deposits(user1), DEPOSIT_AMOUNT / 2);
        assertEq(lendingPool.totalDeposits(), DEPOSIT_AMOUNT / 2);

        vm.stopPrank();
    }

    function testHealthFactor() public {
        vm.startPrank(user1);

        // Deposit tokens
        lendingPool.deposit(DEPOSIT_AMOUNT);

        // Get health factor before borrowing
        (uint256 depositBalance, uint256 borrowBalance, uint256 healthBefore,) = lendingPool.getUserAccountData(user1);
        assertEq(depositBalance, DEPOSIT_AMOUNT);
        assertEq(borrowBalance, 0);
        assertGt(healthBefore, 0);

        // Borrow tokens
        lendingPool.borrow(BORROW_AMOUNT);

        // Get health factor after borrowing
        (,, uint256 healthAfter,) = lendingPool.getUserAccountData(user1);

        // Health factor should be good
        assertGt(healthAfter, 0);
        
        vm.stopPrank();
    }
}
