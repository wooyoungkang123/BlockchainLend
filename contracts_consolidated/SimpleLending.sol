// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleLending
 * @dev A simplified lending pool without external dependencies for testing
 */
contract SimpleLending {
    // Owner of the contract
    address public owner;
    
    // Simple token representation
    mapping(address => uint256) public tokenBalances;
    string public tokenName = "USD Coin";
    string public tokenSymbol = "USDC";
    uint8 public tokenDecimals = 6;
    
    // ETH Price mock
    int256 public ethPrice = 2000 * 10**8; // $2000 with 8 decimals
    
    // Pool parameters
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80%
    uint256 public borrowInterestRate = 500; // 5.00% annually
    uint256 public lastInterestUpdateTime;
    
    // User balances
    mapping(address => uint256) public depositBalances; // ETH collateral in wei
    mapping(address => uint256) public borrowBalances; // Token borrowed in wei
    
    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event TokenMinted(address indexed to, uint256 amount);
    event PriceChanged(int256 newPrice);
    
    constructor() {
        owner = msg.sender;
        lastInterestUpdateTime = block.timestamp;
        
        // Mint initial supply to owner
        _mint(msg.sender, 1000000 * 10**6);
        
        // Mint tokens to the contract itself
        _mint(address(this), 100000 * 10**6);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    function _mint(address to, uint256 amount) internal {
        tokenBalances[to] += amount;
        emit TokenMinted(to, amount);
    }
    
    function mintTokens(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    function changeEthPrice(int256 newPrice) external onlyOwner {
        ethPrice = newPrice;
        emit PriceChanged(newPrice);
    }
    
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        depositBalances[msg.sender] += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than 0");
        require(depositBalances[msg.sender] >= amount, "Insufficient balance");
        
        // Check health factor if has borrows
        if (borrowBalances[msg.sender] > 0) {
            uint256 collateralValue = getCollateralValue(msg.sender);
            uint256 withdrawValue = getEthUsdValue(amount);
            uint256 remainingValue = collateralValue - withdrawValue;
            uint256 requiredValue = borrowBalances[msg.sender] * 100 / LIQUIDATION_THRESHOLD;
            
            require(remainingValue >= requiredValue, "Would violate health factor");
        }
        
        depositBalances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit Withdraw(msg.sender, amount);
    }
    
    function borrow(uint256 amount) external {
        require(amount > 0, "Borrow amount must be greater than 0");
        
        // Check borrowing capacity
        uint256 maxBorrowAmount = getCollateralValue(msg.sender) * LIQUIDATION_THRESHOLD / 100;
        require(borrowBalances[msg.sender] + amount <= maxBorrowAmount, "Insufficient collateral");
        
        // Convert to token units (scale down by 12 decimals)
        // This is because ETH values are in wei (18 decimals) and tokens have 6 decimals
        uint256 tokenAmount = amount / 10**12;
        require(tokenAmount > 0, "Borrow amount too small");
        
        // Check contract has enough tokens
        require(tokenBalances[address(this)] >= tokenAmount, "Insufficient tokens in pool");
        
        // Update balances
        borrowBalances[msg.sender] += amount;
        tokenBalances[address(this)] -= tokenAmount;
        tokenBalances[msg.sender] += tokenAmount;
        
        emit Borrow(msg.sender, amount);
    }
    
    function repay(uint256 amount) external {
        require(amount > 0, "Repay amount must be greater than 0");
        require(borrowBalances[msg.sender] > 0, "No outstanding borrow");
        
        // Convert to token units
        uint256 tokenAmount = amount / 10**12;
        require(tokenAmount > 0, "Repay amount too small");
        
        require(tokenBalances[msg.sender] >= tokenAmount, "Insufficient token balance");
        
        uint256 repayAmount = amount > borrowBalances[msg.sender] ? borrowBalances[msg.sender] : amount;
        uint256 repayTokenAmount = repayAmount / 10**12;
        
        // Update balances
        borrowBalances[msg.sender] -= repayAmount;
        tokenBalances[msg.sender] -= repayTokenAmount;
        tokenBalances[address(this)] += repayTokenAmount;
        
        emit Repay(msg.sender, repayAmount);
    }
    
    function getCollateralValue(address user) public view returns (uint256) {
        return getEthUsdValue(depositBalances[user]);
    }
    
    function getEthUsdValue(uint256 ethAmount) public view returns (uint256) {
        if (ethAmount == 0) return 0;
        return (ethAmount * uint256(ethPrice)) / 10**8;
    }
    
    function getTokenBalance(address user) external view returns (uint256) {
        return tokenBalances[user];
    }
    
    function getDepositBalance(address user) external view returns (uint256) {
        return depositBalances[user];
    }
    
    function getBorrowBalance(address user) external view returns (uint256) {
        return borrowBalances[user];
    }
    
    function getUserHealthFactor(address user) external view returns (uint256) {
        if (borrowBalances[user] == 0) return type(uint256).max;
        return (getCollateralValue(user) * 100) / borrowBalances[user];
    }
} 