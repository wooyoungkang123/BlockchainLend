// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockLendingPool
 * @notice Mock implementation of a LendingPool for testing CCIP receiver
 */
contract MockLendingPool {
    using SafeERC20 for IERC20;

    // Events
    event Repaid(address indexed borrower, uint256 amount);
    event RepaidOnBehalf(address indexed payer, address indexed borrower, uint256 amount);

    // State variables
    address public ccipReceiver;
    bool public failRepayments;

    // Mappings
    mapping(address => uint256) public borrowBalances;

    // Modifiers
    modifier onlyCCIPReceiver() {
        require(msg.sender == ccipReceiver, "Only CCIP Receiver can call");
        _;
    }

    // Constructor
    constructor() {
        failRepayments = false;
    }

    // Function to set CCIP receiver
    function setCCIPReceiver(address _ccipReceiver) external {
        require(_ccipReceiver != address(0), "CCIP Receiver cannot be zero address");
        ccipReceiver = _ccipReceiver;
    }

    // Test helper to set repayment to fail
    function setFailRepayments(bool _shouldFail) external {
        failRepayments = _shouldFail;
    }

    // Test helper to set borrow balances
    function setBorrowBalance(address borrower, uint256 amount) external {
        borrowBalances[borrower] = amount;
    }

    // Mock repay function
    function repay(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(borrowBalances[msg.sender] >= amount, "No outstanding borrows");

        borrowBalances[msg.sender] -= amount;
        emit Repaid(msg.sender, amount);

        // Actually transfer tokens from sender to this contract
        // This is simplified for testing
    }

    // Mock repayOnBehalf function for CCIP receiver
    function repayOnBehalf(address borrower, address token, uint256 amount) external onlyCCIPReceiver {
        require(!failRepayments, "Repayment failing as configured for testing");
        require(amount > 0, "Amount must be greater than 0");
        require(borrowBalances[borrower] >= amount, "No outstanding borrows");

        borrowBalances[borrower] -= amount;
        emit RepaidOnBehalf(msg.sender, borrower, amount);

        // Transfer tokens from CCIP receiver to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    // Mock function to calculate interest
    function calculateInterest(uint256 principal) external pure returns (uint256) {
        // For testing, return 5% of principal as interest
        return principal * 5 / 100;
    }
}
