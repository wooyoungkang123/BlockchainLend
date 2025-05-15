// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";

/**
 * @title ILendingPool
 * @dev Interface for the LendingPool contract
 */
interface ILendingPool {
    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event Liquidate(address indexed liquidator, address indexed borrower, uint256 amount);
    
    // View functions
    function lendingToken() external view returns (IERC20);
    function ethUsdPriceFeed() external view returns (AggregatorV3Interface);
    function LIQUIDATION_THRESHOLD() external view returns (uint256);
    function borrowInterestRate() external view returns (uint256);
    function lastInterestUpdateTime() external view returns (uint256);
    function depositBalances(address user) external view returns (uint256);
    function borrowBalances(address user) external view returns (uint256);
    
    // Core functions
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
    function liquidate(address borrower, uint256 amount) external;
    
    // Utility functions
    function updateInterest() external;
    function getUserAccountData(address user) external view returns (uint256 collateralEth, uint256 borrowAmount, uint256 healthFactor);
    function getCollateralValue(address user) external view returns (uint256);
    function getEthUsdValue(uint256 ethAmount) external view returns (uint256);
    function getLatestEthUsdPrice() external view returns (uint256);
    
    // Admin functions
    function setInterestRate(uint256 newInterestRate) external;
    function adminWithdrawTokens(uint256 amount) external;
    
    // Stats functions
    function totalDeposits() external view returns (uint256);
    function totalBorrows() external view returns (uint256);
}

/**
 * @title MockPriceFeed
 * @dev A mock implementation of Chainlink's AggregatorV3Interface for testing
 */
contract MockPriceFeed is AggregatorV3Interface, Ownable {
    int256 private _price;
    uint8 private _decimals;
    string private _description;
    uint256 private _version;
    
    // Mock round data
    uint80 private _roundId;
    uint256 private _updatedAt;
    
    constructor(int256 initialPrice, uint8 decimalsValue) Ownable(msg.sender) {
        _price = initialPrice;
        _decimals = decimalsValue;
        _description = "Mock ETH / USD Price Feed";
        _version = 1;
        _roundId = 1;
        _updatedAt = block.timestamp;
    }
    
    function setPrice(int256 newPrice) external onlyOwner {
        _price = newPrice;
        _roundId += 1;
        _updatedAt = block.timestamp;
    }
    
    function decimals() external view override returns (uint8) {
        return _decimals;
    }
    
    function description() external view override returns (string memory) {
        return _description;
    }
    
    function version() external view override returns (uint256) {
        return _version;
    }
    
    function getRoundData(uint80 roundId) external view override returns (
        uint80 id,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        require(roundId <= _roundId, "Round not complete");
        
        return (
            roundId,
            _price,
            _updatedAt,
            _updatedAt,
            roundId
        );
    }
    
    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            _roundId,
            _price,
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }
}

/**
 * @title MockToken
 * @dev A simple ERC20 token for testing the LendingPool contract
 */
contract MockToken is ERC20, Ownable {
    uint8 private _decimals;

    constructor(string memory name, string memory symbol, uint8 decimalsValue) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {
        _decimals = decimalsValue;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}

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
        
        // Only check health factor if user has outstanding borrows
        if (borrowBalances[msg.sender] > 0) {
            // Calculate new collateral value after withdrawal
            uint256 collateralValueBefore = getCollateralValue(msg.sender);
            uint256 withdrawValueUsd = getEthUsdValue(amount);
            uint256 collateralValueAfter = collateralValueBefore - withdrawValueUsd;
            
            // Check if remaining collateral maintains required health factor
            uint256 requiredCollateral = borrowBalances[msg.sender] * 100 / LIQUIDATION_THRESHOLD;
            require(
                collateralValueAfter >= requiredCollateral,
                "LendingPool: withdrawal would violate health factor"
            );
        }
        
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
        
        // Check if this would exceed the user's borrow limit
        require(
            currentBorrowed + amount <= maxBorrowAmount, 
            "LendingPool: insufficient collateral"
        );
        
        // Check if the pool has enough tokens
        require(
            lendingToken.balanceOf(address(this)) >= amount, 
            "LendingPool: insufficient lending tokens in pool"
        );
        
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
        uint256 minCollateralRequired = borrowValue * 100 / LIQUIDATION_THRESHOLD;
        
        // Position is liquidatable if collateral falls below the required threshold
        require(
            collateralValue < minCollateralRequired,
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

/**
 * @title Deploy
 * @dev A simple script to deploy and initialize all contracts
 */
contract Deploy {
    // Test deployment values
    int256 public constant INITIAL_ETH_PRICE = 2000 * 10**8; // $2000 with 8 decimals for price feed
    uint256 public constant INITIAL_TOKEN_SUPPLY = 1000000 * 10**6; // 1,000,000 USDC with 6 decimals
    
    // Deployed contract addresses
    MockToken public token;
    MockPriceFeed public priceFeed;
    LendingPool public lendingPool;
    
    // Events for tracking deployment
    event TokenDeployed(address tokenAddress);
    event PriceFeedDeployed(address priceFeedAddress);
    event LendingPoolDeployed(address lendingPoolAddress);
    
    function deployAll() external returns (address, address, address) {
        // Deploy MockToken (USDC with 6 decimals)
        token = new MockToken("USD Coin", "USDC", 6);
        emit TokenDeployed(address(token));
        
        // Deploy MockPriceFeed
        priceFeed = new MockPriceFeed(INITIAL_ETH_PRICE, 8); // 8 decimals for Chainlink compatibility
        emit PriceFeedDeployed(address(priceFeed));
        
        // Deploy LendingPool
        lendingPool = new LendingPool(address(token), address(priceFeed));
        emit LendingPoolDeployed(address(lendingPool));
        
        // Initialize: Mint initial tokens to deployer
        token.mint(msg.sender, INITIAL_TOKEN_SUPPLY);
        
        // Initialize: Transfer some tokens to the lending pool
        token.mint(address(lendingPool), INITIAL_TOKEN_SUPPLY / 10);
        
        return (address(token), address(priceFeed), address(lendingPool));
    }
    
    // Helper function to change ETH price (for testing liquidations)
    function changeEthPrice(int256 newEthPrice) external {
        require(address(priceFeed) != address(0), "PriceFeed not deployed");
        priceFeed.setPrice(newEthPrice);
    }
    
    // Helper function to mint more tokens
    function mintTokens(address to, uint256 amount) external {
        require(address(token) != address(0), "Token not deployed");
        token.mint(to, amount);
    }
} 