// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MockToken} from "../contracts/mocks/MockToken.sol";
import {MockPriceFeed} from "../contracts/mocks/MockPriceFeed.sol";
import {LendingPool} from "../contracts/core/LendingPool.sol";

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
        priceFeed.updatePrice(newEthPrice);
    }
    
    // Helper function to mint more tokens
    function mintTokens(address to, uint256 amount) external {
        require(address(token) != address(0), "Token not deployed");
        token.mint(to, amount);
    }
} 