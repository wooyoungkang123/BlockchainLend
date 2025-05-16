// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/LendingPool.sol";
import "../../contracts/test/MockERC20.sol";

/**
 * @title LendingPoolHandler
 * @notice Handler contract for invariant testing of the LendingPool
 */
contract LendingPoolHandler is Test {
    // Target contract instance
    LendingPool public lendingPool;
    MockERC20 public token;

    // Ghost variables to track internal state for invariant testing
    uint256 public ghost_totalDeposits;
    uint256 public ghost_totalBorrows;

    // Actor addresses
    address[] public actors;
    mapping(address => uint256) public actorTokenBalances;
    mapping(address => uint256) public depositBalances;
    mapping(address => uint256) public borrowBalances;

    // Constants
    uint256 public constant MAX_DEPOSIT = 1_000_000 ether;
    uint256 public constant MAX_ACTORS = 10;
    uint256 public constant INITIAL_SUPPLY = 10_000_000 ether;

    // Statistics
    uint256 public depositCount;
    uint256 public withdrawCount;
    uint256 public borrowCount;
    uint256 public repayCount;
    uint256 public crossChainRepayCount;

    // CCIP receiver
    address public ccipReceiver;

    constructor(LendingPool _lendingPool, MockERC20 _token) {
        lendingPool = _lendingPool;
        token = _token;

        // Set up CCIP receiver - this is now set by the test
        ccipReceiver = makeAddr("ccipReceiver");
        
        // Mint tokens to the CCIP receiver
        token.mint(ccipReceiver, INITIAL_SUPPLY);
        vm.prank(ccipReceiver);
        token.approve(address(lendingPool), type(uint256).max);

        // Set up initial actors
        for (uint256 i = 0; i < MAX_ACTORS; i++) {
            address actor = makeAddr(string(abi.encodePacked("actor", i)));
            actors.push(actor);

            // Give tokens to actors
            token.mint(actor, INITIAL_SUPPLY);
            actorTokenBalances[actor] = INITIAL_SUPPLY;

            // Approve lending pool to spend tokens
            vm.prank(actor);
            token.approve(address(lendingPool), type(uint256).max);
        }
    }

    // ==================== Actor Actions ====================

    /**
     * @notice Makes a deposit into the lending pool
     * @param actorIndex Index of the actor in the actors array
     * @param amount Amount to deposit
     */
    function deposit(uint256 actorIndex, uint256 amount) external {
        // Bound actor index
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        // Bound amount to reasonable limits
        amount = bound(amount, 1, MAX_DEPOSIT);

        address actor = actors[actorIndex];

        // Ensure actor has enough balance
        if (token.balanceOf(actor) < amount) {
            return;
        }

        // Execute deposit
        vm.startPrank(actor);
        lendingPool.deposit(amount);
        vm.stopPrank();

        // Update ghost variables
        depositBalances[actor] += amount;
        ghost_totalDeposits += amount;
        depositCount++;
    }

    /**
     * @notice Withdraws from the lending pool
     * @param actorIndex Index of the actor in the actors array
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 actorIndex, uint256 amount) external {
        // Bound actor index
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        address actor = actors[actorIndex];

        // Get current deposit balance from contract
        uint256 currentDeposit = lendingPool.deposits(actor);

        // Bound amount to actual deposit
        amount = bound(amount, 0, currentDeposit);

        // Skip if nothing to withdraw or not enough available liquidity
        if (amount == 0 || amount > lendingPool.getAvailableLiquidity()) {
            return;
        }

        // Ensure withdrawal respects collateral requirements
        uint256 currentBorrow = lendingPool.borrows(actor);
        if (currentBorrow > 0) {
            // Ensure 2:1 collateral ratio is maintained
            uint256 minimumDeposit = currentBorrow * 2;
            if (currentDeposit - amount < minimumDeposit) {
                // If withdrawal would violate collateral requirement, adjust amount
                if (currentDeposit <= minimumDeposit) {
                    return; // Cannot withdraw anything
                }
                amount = currentDeposit - minimumDeposit;
            }
        }

        // Execute withdraw
        vm.startPrank(actor);
        lendingPool.withdraw(amount);
        vm.stopPrank();

        // Update ghost variables
        depositBalances[actor] -= amount;
        ghost_totalDeposits -= amount;
        withdrawCount++;
    }

    /**
     * @notice Borrows from the lending pool
     * @param actorIndex Index of the actor in the actors array
     * @param amount Amount to borrow
     */
    function borrow(uint256 actorIndex, uint256 amount) external {
        // Bound actor index
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        address actor = actors[actorIndex];

        // Get current deposit and borrow balances
        uint256 currentDeposit = lendingPool.deposits(actor);
        uint256 currentBorrow = lendingPool.borrows(actor);

        // Calculate maximum borrowable amount (50% of deposit)
        uint256 maxBorrowable = currentDeposit / 2;

        // Adjust for existing borrows
        if (currentBorrow >= maxBorrowable) {
            return; // Already at or exceeding borrowing limit
        }
        maxBorrowable -= currentBorrow;

        // Bound amount to borrowable limit
        amount = bound(amount, 1, maxBorrowable);

        // Check available liquidity
        if (amount > lendingPool.getAvailableLiquidity()) {
            return; // Not enough liquidity in the pool
        }

        // Execute borrow
        vm.startPrank(actor);
        lendingPool.borrow(amount);
        vm.stopPrank();

        // Update ghost variables
        borrowBalances[actor] += amount;
        ghost_totalBorrows += amount;
        borrowCount++;
    }

    /**
     * @notice Repays a loan to the lending pool
     * @param actorIndex Index of the actor in the actors array
     * @param amount Amount to repay
     */
    function repay(uint256 actorIndex, uint256 amount) external {
        // Bound actor index
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        address actor = actors[actorIndex];

        // Get current borrow balance
        uint256 currentBorrow = lendingPool.borrows(actor);

        // Skip if nothing to repay
        if (currentBorrow == 0) {
            return;
        }

        // Bound amount to what's owed
        amount = bound(amount, 1, currentBorrow);

        // Check if actor has enough tokens to repay
        uint256 tokenBalance = token.balanceOf(actor);
        if (tokenBalance < amount) {
            // Adjust amount to available balance
            amount = tokenBalance;
            if (amount == 0) {
                return; // Cannot repay anything
            }
        }

        // Execute repay
        vm.startPrank(actor);
        lendingPool.repay(amount);
        vm.stopPrank();

        // Update ghost variables
        borrowBalances[actor] -= amount;
        ghost_totalBorrows -= amount;
        repayCount++;
    }

    /**
     * @notice Simulates a cross-chain repayment via CCIP
     * @param actorIndex Index of the actor (borrower) in the actors array
     * @param amount Amount to repay
     */
    function crossChainRepay(uint256 actorIndex, uint256 amount) external {
        // Bound actor index
        actorIndex = bound(actorIndex, 0, actors.length - 1);
        address borrower = actors[actorIndex];

        // Get current borrow balance
        uint256 currentBorrow = lendingPool.borrows(borrower);

        // Skip if nothing to repay
        if (currentBorrow == 0) {
            return;
        }

        // Bound amount to what's owed
        amount = bound(amount, 1, currentBorrow);

        // Check if CCIP receiver has enough tokens
        uint256 ccipBalance = token.balanceOf(ccipReceiver);
        if (ccipBalance < amount) {
            // Adjust or skip if not enough balance
            if (ccipBalance == 0) {
                return;
            }
            amount = ccipBalance;
        }

        // Execute cross-chain repayment
        vm.startPrank(ccipReceiver);
        lendingPool.repayOnBehalf(borrower, amount);
        vm.stopPrank();

        // Update ghost variables
        borrowBalances[borrower] -= amount;
        ghost_totalBorrows -= amount;
        crossChainRepayCount++;
    }

    // ==================== Admin Actions ====================

    /**
     * @notice Updates the interest rate of the lending pool
     * @param newRate New interest rate (bounded to 0-20%)
     */
    function updateInterestRate(uint256 newRate) external {
        // Bound rate to reasonable limits (0-20%)
        newRate = bound(newRate, 0, 20);

        // Update interest rate
        vm.prank(lendingPool.owner());
        lendingPool.updateInterestRate(newRate);
    }

    /**
     * @notice Updates the CCIP receiver address
     */
    function updateCCIPReceiver() external {
        address newReceiver = makeAddr("newCCIPReceiver");

        // Give tokens to new receiver
        token.mint(newReceiver, INITIAL_SUPPLY);
        vm.prank(newReceiver);
        token.approve(address(lendingPool), type(uint256).max);

        // Update CCIP receiver
        vm.prank(lendingPool.owner());
        lendingPool.setCCIPReceiver(newReceiver);

        // Update state
        ccipReceiver = newReceiver;
    }

    // ==================== Helper Functions ====================

    /**
     * @notice Calculates total deposits based on actor balances
     * @return sum Total deposits across all actors
     */
    function calculateTotalDeposits() external view returns (uint256 sum) {
        for (uint256 i = 0; i < actors.length; i++) {
            sum += lendingPool.deposits(actors[i]);
        }
        return sum;
    }

    /**
     * @notice Calculates total borrows based on actor balances
     * @return sum Total borrows across all actors
     */
    function calculateTotalBorrows() external view returns (uint256 sum) {
        for (uint256 i = 0; i < actors.length; i++) {
            sum += lendingPool.borrows(actors[i]);
        }
        return sum;
    }

    /**
     * @notice Verifies invariants directly
     * @return True if all invariants hold
     */
    function checkInvariants() external view returns (bool) {
        // Invariant 1: Sum of all deposits should match totalDeposits
        uint256 sumDeposits = 0;
        for (uint256 i = 0; i < actors.length; i++) {
            sumDeposits += lendingPool.deposits(actors[i]);
        }
        if (sumDeposits != lendingPool.totalDeposits()) {
            return false;
        }

        // Invariant 2: Sum of all borrows should match totalBorrows
        uint256 sumBorrows = 0;
        for (uint256 i = 0; i < actors.length; i++) {
            sumBorrows += lendingPool.borrows(actors[i]);
        }
        if (sumBorrows != lendingPool.totalBorrows()) {
            return false;
        }

        // Invariant 3: totalDeposits should be >= totalBorrows
        if (lendingPool.totalDeposits() < lendingPool.totalBorrows()) {
            return false;
        }

        // Invariant 4: Contract balance should equal totalDeposits - totalBorrows
        uint256 contractBalance = token.balanceOf(address(lendingPool));
        if (contractBalance != lendingPool.totalDeposits() - lendingPool.totalBorrows()) {
            return false;
        }

        // Invariant 5: No borrower can have borrow > deposit/2
        for (uint256 i = 0; i < actors.length; i++) {
            address actor = actors[i];
            uint256 deposit = lendingPool.deposits(actor);
            uint256 borrow = lendingPool.borrows(actor);

            if (borrow > 0 && borrow * 2 > deposit) {
                return false;
            }
        }

        return true;
    }

    /**
     * @notice Returns the number of actors
     * @return The number of actors
     */
    function getActorCount() external view returns (uint256) {
        return actors.length;
    }
}
