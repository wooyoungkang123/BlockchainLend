// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

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
    function getUserAccountData(address user)
        external
        view
        returns (uint256 collateralEth, uint256 borrowAmount, uint256 healthFactor);
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
