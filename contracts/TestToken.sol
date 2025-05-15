// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @dev A simple ERC20 token for testing purposes
 */
contract TestToken is ERC20, Ownable {
    /**
     * @dev Sets the values for name and symbol, and mints initial supply to the deployer
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals());
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Allows the owner to mint new tokens
     * @param to The address that will receive the minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Function to give tokens to users for testing
     * @param amount The amount of tokens to request
     */
    function faucet(uint256 amount) external {
        require(amount <= 1000 * 10**decimals(), "TestToken: amount too large");
        _mint(msg.sender, amount);
    }
} 