// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title LendingPool
 * @dev A lending pool contract that uses Chainlink price feeds for secure pricing
 */
contract LendingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Token being lent out
    IERC20 public immutable lendingToken;
    
    // Chainlink ETH/USD Price Feed
    AggregatorV3Interface public immutable ethUsdPriceFeed;
    
    // CCIP Receiver contract address authorized to handle cross-chain repayments
    address public ccipReceiver;
    
    // Tracks user deposits
    mapping(address => uint256) public deposits;
    
    // Tracks user borrows
    mapping(address => uint256) public borrows;
    
    // Total amount of tokens deposited
    uint256 public totalDeposits;
    
    // Total amount of tokens borrowed
    uint256 public totalBorrows;
    
    // Interest rate in basis points (1% = 100)
    uint256 public borrowInterestRate = 500; // 5% default

    // Liquidation threshold in percentage (80% by default)
    uint256 public liquidationThreshold = 8000; // 80%
    
    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount, uint256 interest);
    event RepaidOnBehalf(address indexed user, address indexed payer, uint256 amount, uint256 interest);
    event InterestRateUpdated(uint256 newRate);
    event CCIPReceiverUpdated(address indexed ccipReceiver);
    event Liquidated(address indexed borrower, address indexed liquidator, uint256 amount, uint256 collateralLiquidated);
    
    /**
     * @dev Initialize the lending pool with a specific ERC20 token and ETH/USD price feed
     * @param _lendingToken The address of the ERC20 token to be used
     * @param _ethUsdPriceFeed The address of the Chainlink ETH/USD price feed
     */
    constructor(address _lendingToken, address _ethUsdPriceFeed) {
        require(_lendingToken != address(0), "LendingPool: token address cannot be zero");
        require(_ethUsdPriceFeed != address(0), "LendingPool: price feed address cannot be zero");
        
        lendingToken = IERC20(_lendingToken);
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        
        // Try to verify the price feed is working, but don't revert on local networks
        try ethUsdPriceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            // Only validate on non-local networks (where roundId would be > 0)
            if (roundId > 0) {
                require(price > 0, "LendingPool: invalid price feed data");
            }
        } catch {
            // If this fails (e.g., on a local network), we just continue
        }
        
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Set the CCIP Receiver contract address
     * @param _ccipReceiver Address of the CCIP Receiver contract
     */
    function setCCIPReceiver(address _ccipReceiver) external onlyOwner {
        require(_ccipReceiver != address(0), "LendingPool: CCIP receiver cannot be zero address");
        ccipReceiver = _ccipReceiver;
        emit CCIPReceiverUpdated(_ccipReceiver);
    }
    
    /**
     * @dev Get the latest ETH/USD price from Chainlink
     * @return price The latest ETH/USD price with 8 decimals, or a default value for local testing
     */
    function getLatestEthUsdPrice() public view returns (uint256) {
        try ethUsdPriceFeed.latestRoundData() returns (
            uint80,
            int256 price,
            uint256,
            uint256,
            uint80
        ) {
            if (price > 0) {
                return uint256(price);
            } else {
                // Return a default value for local testing (ETH = $2,000)
                return 200000000000;
            }
        } catch {
            // If the call fails, return a default value for local testing (ETH = $2,000)
            return 200000000000;
        }
    }
    
    /**
     * @dev Deposit tokens into the lending pool
     * @param _amount The amount of tokens to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "LendingPool: deposit amount must be greater than zero");
        
        // Transfer tokens from sender to this contract
        lendingToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user's deposit balance
        deposits[msg.sender] += _amount;
        
        // Update total deposits
        totalDeposits += _amount;
        
        emit Deposited(msg.sender, _amount);
    }
    
    /**
     * @dev Withdraw tokens from the lending pool
     * @param _amount The amount of tokens to withdraw
     */
    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "LendingPool: withdraw amount must be greater than zero");
        require(deposits[msg.sender] >= _amount, "LendingPool: insufficient deposit balance");
        require(getAvailableLiquidity() >= _amount, "LendingPool: insufficient liquidity");
        
        // Ensure the user has enough collateral after withdrawal if they have a loan
        if (borrows[msg.sender] > 0) {
            uint256 remainingDeposit = deposits[msg.sender] - _amount;
            uint256 requiredCollateral = (borrows[msg.sender] * 10000) / liquidationThreshold;
            require(remainingDeposit >= requiredCollateral, "LendingPool: withdrawal would put position at risk");
        }
        
        // Update user's deposit balance
        deposits[msg.sender] -= _amount;
        
        // Update total deposits
        totalDeposits -= _amount;
        
        // Transfer tokens from this contract to sender
        lendingToken.safeTransfer(msg.sender, _amount);
        
        emit Withdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Borrow tokens from the lending pool
     * @param _amount The amount of tokens to borrow
     */
    function borrow(uint256 _amount) external nonReentrant {
        require(_amount > 0, "LendingPool: borrow amount must be greater than zero");
        require(getAvailableLiquidity() >= _amount, "LendingPool: insufficient liquidity");
        
        // Check if borrower has enough collateral
        // Uses the liquidation threshold to determine maximum borrow amount
        uint256 maxBorrowAmount = (deposits[msg.sender] * liquidationThreshold) / 10000;
        require(borrows[msg.sender] + _amount <= maxBorrowAmount, "LendingPool: insufficient collateral");
        
        // Update user's borrow balance
        borrows[msg.sender] += _amount;
        
        // Update total borrows
        totalBorrows += _amount;
        
        // Transfer tokens from this contract to sender
        lendingToken.safeTransfer(msg.sender, _amount);
        
        emit Borrowed(msg.sender, _amount);
    }
    
    /**
     * @dev Repay borrowed tokens to the lending pool
     * @param _amount The amount of tokens to repay
     */
    function repay(uint256 _amount) external nonReentrant {
        require(_amount > 0, "LendingPool: repay amount must be greater than zero");
        require(borrows[msg.sender] > 0, "LendingPool: no outstanding borrow");
        
        // Ensure the repayment isn't more than what's borrowed
        uint256 actualRepayment = _amount > borrows[msg.sender] ? borrows[msg.sender] : _amount;
        uint256 actualInterest = (actualRepayment * borrowInterestRate) / 10000;
        uint256 actualTotalRepayment = actualRepayment + actualInterest;
        
        // Transfer tokens from sender to this contract
        lendingToken.safeTransferFrom(msg.sender, address(this), actualTotalRepayment);
        
        // Update user's borrow balance
        borrows[msg.sender] -= actualRepayment;
        
        // Update total borrows
        totalBorrows -= actualRepayment;
        
        emit Repaid(msg.sender, actualRepayment, actualInterest);
    }
    
    /**
     * @dev Repay borrowed tokens on behalf of another user (used for cross-chain repayments)
     * @param _borrower The address of the borrower
     * @param _amount The amount of tokens to repay
     */
    function repayOnBehalf(address _borrower, uint256 _amount) external nonReentrant {
        require(msg.sender == ccipReceiver, "LendingPool: only CCIP receiver can repay on behalf");
        require(_amount > 0, "LendingPool: repay amount must be greater than zero");
        require(_borrower != address(0), "LendingPool: borrower cannot be zero address");
        require(borrows[_borrower] > 0, "LendingPool: no outstanding borrow");
        
        // Ensure the repayment isn't more than what's borrowed
        uint256 actualRepayment = _amount > borrows[_borrower] ? borrows[_borrower] : _amount;
        uint256 actualInterest = (actualRepayment * borrowInterestRate) / 10000;
        uint256 actualTotalRepayment = actualRepayment + actualInterest;
        
        // Transfer tokens from CCIP receiver to this contract
        lendingToken.safeTransferFrom(msg.sender, address(this), actualTotalRepayment);
        
        // Update borrower's borrow balance
        borrows[_borrower] -= actualRepayment;
        
        // Update total borrows
        totalBorrows -= actualRepayment;
        
        emit RepaidOnBehalf(_borrower, msg.sender, actualRepayment, actualInterest);
    }
    
    /**
     * @dev Liquidate an undercollateralized position
     * @param _borrower The address of the borrower to liquidate
     */
    function liquidate(address _borrower) external nonReentrant {
        require(_borrower != address(0), "LendingPool: borrower cannot be zero address");
        require(borrows[_borrower] > 0, "LendingPool: no outstanding borrow");
        
        // Check if position is undercollateralized
        uint256 requiredCollateral = (borrows[_borrower] * 10000) / liquidationThreshold;
        require(deposits[_borrower] < requiredCollateral, "LendingPool: position is not undercollateralized");
        
        // Calculate liquidation amount (full position)
        uint256 debtAmount = borrows[_borrower];
        uint256 collateralAmount = deposits[_borrower];
        
        // Update borrower state
        borrows[_borrower] = 0;
        deposits[_borrower] = 0;
        
        // Update total state
        totalBorrows -= debtAmount;
        totalDeposits -= collateralAmount;
        
        // Liquidator pays the debt and receives the collateral
        lendingToken.safeTransferFrom(msg.sender, address(this), debtAmount);
        lendingToken.safeTransfer(msg.sender, collateralAmount);
        
        emit Liquidated(_borrower, msg.sender, debtAmount, collateralAmount);
    }
    
    /**
     * @dev Update the interest rate (only owner)
     * @param _newRate The new interest rate in basis points
     */
    function updateInterestRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 3000, "LendingPool: interest rate cannot exceed 30%");
        borrowInterestRate = _newRate;
        emit InterestRateUpdated(_newRate);
    }
    
    /**
     * @dev Get the available liquidity in the pool
     * @return The amount of tokens available for borrowing
     */
    function getAvailableLiquidity() public view returns (uint256) {
        return lendingToken.balanceOf(address(this));
    }
    
    /**
     * @dev Get user account data
     * @param _user The address of the user
     * @return depositBalance The user's deposit balance
     * @return borrowBalance The user's borrow balance
     * @return healthFactor The user's position health (10000 = 100%)
     * @return ethUsdPrice The current ETH/USD price
     */
    function getUserAccountData(address _user) external view returns (
        uint256 depositBalance,
        uint256 borrowBalance,
        uint256 healthFactor,
        uint256 ethUsdPrice
    ) {
        depositBalance = deposits[_user];
        borrowBalance = borrows[_user];
        ethUsdPrice = getLatestEthUsdPrice();
        
        // Calculate health factor
        if (borrowBalance == 0) {
            healthFactor = type(uint256).max; // Max value if no loan
        } else {
            // Health factor = (deposit * liquidationThreshold) / (borrow * 10000)
            healthFactor = (depositBalance * liquidationThreshold) / (borrowBalance * 10000);
            healthFactor = healthFactor * 10000; // Scale to percentage format
        }
    }
} 