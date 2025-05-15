// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MinimalContract
 * @dev A minimal contract without external dependencies
 */
contract MinimalContract {
    uint256 private value;
    
    event ValueChanged(uint256 newValue);
    
    constructor(uint256 initialValue) {
        value = initialValue;
    }
    
    function setValue(uint256 newValue) public {
        value = newValue;
        emit ValueChanged(newValue);
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
} 