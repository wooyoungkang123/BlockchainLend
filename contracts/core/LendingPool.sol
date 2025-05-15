// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "../../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";

/**
 * @title LendingPool
 * @dev A lending pool contract that allows users to deposit ETH as collateral, 
 * borrow tokens, repay loans, and handle liquidations.
 */
contract LendingPool is ILendingPool, ReentrancyGuard, Ownable {
    IERC20 public lendingToken;
    AggregatorV3Interface public ethUsdPriceFeed;
    
    // Pool parameters
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80% (collateral value must be at least 125% of borrowed value)
    uint256 public borrowInterestRate = 500; // 5.00% annually
    uint256 public lastInterestUpdateTime;
    
    // User balances and state
    mapping(address => uint256) public depositBalances; // ETH collateral in wei
    mapping(address => uint256) public borrowBalances; // USDC borrowed in wei
    
    constructor(address _lendingToken, address _ethUsdPriceFeed) Ownable(msg.sender) {
        require(_lendingToken != address(0), "LendingPool: lending token cannot be zero address");
        require(_ethUsdPriceFeed != address(0), "LendingPool: price feed cannot be zero address");
        
        lendingToken = IERC20(_lendingToken);
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        lastInterestUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Deposit ETH as collateral
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "LendingPool: deposit amount must be greater than 0");
        
        depositBalances[msg.sender] += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw ETH collateral
     * @param amount Amount of ETH to withdraw in wei
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: withdraw amount must be greater than 0");
        require(depositBalances[msg.sender] >= amount, "LendingPool: insufficient balance");
        
        // Check if withdrawal would violate health factor
        updateInterest();
        uint256 newCollateralValue = getCollateralValue(msg.sender) - getEthUsdValue(amount);
        uint256 borrowValue = borrowBalances[msg.sender];
        require(
            borrowValue == 0 || 
            (newCollateralValue * LIQUIDATION_THRESHOLD / 100) >= borrowValue,
            "LendingPool: withdrawal would violate health factor"
        );
        
        depositBalances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "LendingPool: ETH transfer failed");
        
        emit Withdraw(msg.sender, amount);
    }
    
    /**
     * @dev Borrow tokens against collateral
     * @param amount Amount of tokens to borrow in wei
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: borrow amount must be greater than 0");
        
        updateInterest();
        
        // Calculate max borrow amount
        uint256 maxBorrowAmount = getCollateralValue(msg.sender) * LIQUIDATION_THRESHOLD / 100;
        uint256 currentBorrowed = borrowBalances[msg.sender];
        
        require(currentBorrowed + amount <= maxBorrowAmount, "LendingPool: insufficient collateral");
        require(lendingToken.balanceOf(address(this)) >= amount, "LendingPool: insufficient lending tokens in pool");
        
        borrowBalances[msg.sender] += amount;
        
        bool success = lendingToken.transfer(msg.sender, amount);
        require(success, "LendingPool: token transfer failed");
        
        emit Borrow(msg.sender, amount);
    }
    
    /**
     * @dev Repay borrowed tokens
     * @param amount Amount of tokens to repay in wei
     */
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: repay amount must be greater than 0");
        require(borrowBalances[msg.sender] > 0, "LendingPool: no outstanding borrow");
        
        updateInterest();
        
        uint256 repayAmount = amount > borrowBalances[msg.sender] ? borrowBalances[msg.sender] : amount;
        
        borrowBalances[msg.sender] -= repayAmount;
        
        bool success = lendingToken.transferFrom(msg.sender, address(this), repayAmount);
        require(success, "LendingPool: token transfer failed");
        
        emit Repay(msg.sender, repayAmount);
    }
    
    /**
     * @dev Liquidate an undercollateralized position
     * @param borrower Address of the borrower to liquidate
     * @param amount Amount of debt to repay and liquidate
     */
    function liquidate(address borrower, uint256 amount) external nonReentrant {
        require(borrower != address(0), "LendingPool: borrower cannot be zero address");
        require(amount > 0, "LendingPool: liquidation amount must be greater than 0");
        require(borrowBalances[borrower] > 0, "LendingPool: borrower has no debt");
        
        updateInterest();
        
        // Check if position is liquidatable
        uint256 collateralValue = getCollateralValue(borrower);
        uint256 borrowValue = borrowBalances[borrower];
        require(
            (collateralValue * LIQUIDATION_THRESHOLD / 100) < borrowValue,
            "LendingPool: position not liquidatable"
        );
        
        // Calculate liquidation amount
        uint256 liquidationAmount = amount > borrowBalances[borrower] ? borrowBalances[borrower] : amount;
        
        // Calculate ETH to seize (plus 10% bonus)
        uint256 ethUsdPrice = getLatestEthUsdPrice();
        uint256 ethToSeize = (liquidationAmount * 110 / 100) * 1e18 / ethUsdPrice;
        
        require(ethToSeize <= depositBalances[borrower], "LendingPool: insufficient collateral to liquidate");
        
        // Update balances
        borrowBalances[borrower] -= liquidationAmount;
        depositBalances[borrower] -= ethToSeize;
        depositBalances[msg.sender] += ethToSeize;
        
        // Transfer tokens from liquidator to pool
        bool success = lendingToken.transferFrom(msg.sender, address(this), liquidationAmount);
        require(success, "LendingPool: token transfer failed");
        
        emit Liquidate(msg.sender, borrower, liquidationAmount);
    }
    
    /**
     * @dev Update interest for all borrowers
     * This is simplified and would be more complex in a real implementation
     */
    function updateInterest() public {
        uint256 timeElapsed = block.timestamp - lastInterestUpdateTime;
        if (timeElapsed > 0) {
            // This is simplified - in a real implementation, we would update each user's interest individually
            lastInterestUpdateTime = block.timestamp;
        }
    }
    
    /**
     * @dev Get user account data
     * @param user Address of the user
     * @return collateralEth User's collateral in ETH (wei)
     * @return borrowAmount User's borrowed amount in tokens (wei)
     * @return healthFactor User's health factor (scaled by 100)
     */
    function getUserAccountData(address user) external view returns (uint256 collateralEth, uint256 borrowAmount, uint256 healthFactor) {
        collateralEth = depositBalances[user];
        borrowAmount = borrowBalances[user];
        
        if (borrowAmount == 0) {
            healthFactor = type(uint256).max; // Max value if no borrows
        } else {
            uint256 collateralValue = getCollateralValue(user);
            healthFactor = collateralValue * 100 / borrowAmount;
        }
    }
    
    /**
     * @dev Get the USD value of a user's ETH collateral
     * @param user Address of the user
     * @return USD value of collateral (scaled by 1e18)
     */
    function getCollateralValue(address user) public view returns (uint256) {
        return getEthUsdValue(depositBalances[user]);
    }
    
    /**
     * @dev Convert ETH amount to USD value using price feed
     * @param ethAmount Amount of ETH in wei
     * @return USD value (scaled by 1e18)
     */
    function getEthUsdValue(uint256 ethAmount) public view returns (uint256) {
        if (ethAmount == 0) return 0;
        
        uint256 ethUsdPrice = getLatestEthUsdPrice();
        return ethAmount * ethUsdPrice / 1e18;
    }
    
    /**
     * @dev Get the latest ETH/USD price from Chainlink
     * @return ETH/USD price (scaled by 1e8)
     */
    function getLatestEthUsdPrice() public view returns (uint256) {
        (, int256 price, , , ) = ethUsdPriceFeed.latestRoundData();
        require(price > 0, "LendingPool: invalid ETH price");
        
        // Convert price to 18 decimals (Chainlink returns 8 decimals)
        return uint256(price) * 1e10;
    }
    
    /**
     * @dev Set a new interest rate
     * @param newInterestRate New annual interest rate (scaled by 100)
     */
    function setInterestRate(uint256 newInterestRate) external onlyOwner {
        updateInterest(); // Apply current interest before changing rate
        borrowInterestRate = newInterestRate;
    }
    
    /**
     * @dev Administrative function to withdraw tokens from the pool
     * @param amount Amount of tokens to withdraw
     */
    function adminWithdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "LendingPool: amount must be greater than 0");
        
        uint256 availableTokens = lendingToken.balanceOf(address(this));
        require(amount <= availableTokens, "LendingPool: insufficient tokens");
        
        bool success = lendingToken.transfer(owner(), amount);
        require(success, "LendingPool: token transfer failed");
    }
    
    /**
     * @dev Return total deposits in the pool
     */
    function totalDeposits() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Return total borrows from the pool
     */
    function totalBorrows() external view returns (uint256) {
        // This would be implemented to track the sum of all borrows
        // Simplified version for demo purposes
        return lendingToken.totalSupply() - lendingToken.balanceOf(address(this));
    }
} 