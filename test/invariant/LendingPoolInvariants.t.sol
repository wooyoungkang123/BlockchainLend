// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/LendingPool.sol";
import "../../contracts/test/MockERC20.sol";
import "./LendingPoolHandler.sol";

/**
 * @title LendingPoolInvariants
 * @notice Entry point for invariant testing of the LendingPool contract
 */
contract LendingPoolInvariants is Test {
    // Contracts
    LendingPool public lendingPool;
    MockERC20 public token;
    LendingPoolHandler public handler;
    
    function setUp() public {
        // Deploy token
        token = new MockERC20("Test Token", "TEST");
        
        // Deploy lending pool
        lendingPool = new LendingPool(address(token));
        
        // Deploy handler
        handler = new LendingPoolHandler(lendingPool, token);
        
        // Target the handler for invariant testing
        bytes4[] memory selectors = new bytes4[](6);
        selectors[0] = LendingPoolHandler.deposit.selector;
        selectors[1] = LendingPoolHandler.withdraw.selector;
        selectors[2] = LendingPoolHandler.borrow.selector;
        selectors[3] = LendingPoolHandler.repay.selector;
        selectors[4] = LendingPoolHandler.crossChainRepay.selector;
        selectors[5] = LendingPoolHandler.updateInterestRate.selector;
        
        targetSelector(FuzzSelector({
            addr: address(handler),
            selectors: selectors
        }));
        
        // Exclude functions to avoid unwanted calls
        excludeContract(address(lendingPool));
        excludeContract(address(token));
    }
    
    /**
     * @notice Invariant: Total deposits should always be >= total borrows
     */
    function invariant_poolSolvency() public {
        uint256 totalDeposits = lendingPool.totalDeposits();
        uint256 totalBorrows = lendingPool.totalBorrows();
        
        assertGe(totalDeposits, totalBorrows, "Pool insolvency: totalDeposits < totalBorrows");
    }
    
    /**
     * @notice Invariant: Contract token balance should match totalDeposits - totalBorrows
     */
    function invariant_tokenBalance() public {
        uint256 contractBalance = token.balanceOf(address(lendingPool));
        uint256 expectedBalance = lendingPool.totalDeposits() - lendingPool.totalBorrows();
        
        assertEq(contractBalance, expectedBalance, "Contract balance mismatch");
    }
    
    /**
     * @notice Invariant: Sum of all deposits should match totalDeposits
     */
    function invariant_depositSum() public {
        uint256 sumDeposits = handler.calculateTotalDeposits();
        uint256 totalDeposits = lendingPool.totalDeposits();
        
        assertEq(sumDeposits, totalDeposits, "Deposit sum mismatch");
    }
    
    /**
     * @notice Invariant: Sum of all borrows should match totalBorrows
     */
    function invariant_borrowSum() public {
        uint256 sumBorrows = handler.calculateTotalBorrows();
        uint256 totalBorrows = lendingPool.totalBorrows();
        
        assertEq(sumBorrows, totalBorrows, "Borrow sum mismatch");
    }
    
    /**
     * @notice Invariant: Ghost values should match contract state
     */
    function invariant_ghostVarsMatch() public {
        assertEq(
            handler.ghost_totalDeposits(), 
            lendingPool.totalDeposits(),
            "Ghost total deposits mismatch"
        );
        
        assertEq(
            handler.ghost_totalBorrows(), 
            lendingPool.totalBorrows(),
            "Ghost total borrows mismatch"
        );
    }
    
    /**
     * @notice Invariant: No borrower can have borrow > deposit/2
     */
    function invariant_borrowLimit() public {
        for (uint256 i = 0; i < handler.actors.length; i++) {
            address actor = handler.actors(i);
            uint256 deposit = lendingPool.depositBalances(actor);
            uint256 borrow = lendingPool.borrowBalances(actor);
            
            if (deposit > 0) {
                assertLe(borrow * 2, deposit, "User borrowed more than 50% of deposit");
            } else {
                assertEq(borrow, 0, "User borrowed without deposit");
            }
        }
    }
    
    /**
     * @notice Invariant: Direct check using handler's utility function
     */
    function invariant_directCheck() public {
        assertTrue(handler.checkInvariants(), "Direct invariant check failed");
    }
    
    /**
     * @notice Display statistics after fuzz testing
     */
    function invariant_callSummary() public view {
        console.log("------- Call Summary -------");
        console.log("Deposits:", handler.depositCount());
        console.log("Withdrawals:", handler.withdrawCount());
        console.log("Borrows:", handler.borrowCount());
        console.log("Repayments:", handler.repayCount());
        console.log("Cross-chain repayments:", handler.crossChainRepayCount());
        console.log("----------------------------");
    }
} 