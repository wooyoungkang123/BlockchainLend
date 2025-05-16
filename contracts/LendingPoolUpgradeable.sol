// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title LendingPoolUpgradeable
 * @dev An upgradeable lending pool contract that allows users to deposit and borrow ERC20 tokens
 */
contract LendingPoolUpgradeable is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Token being lent out
    IERC20Upgradeable public lendingToken;

    // Tracks user deposits
    mapping(address => uint256) public deposits;

    // Tracks user borrows
    mapping(address => uint256) public borrows;

    // Total amount of tokens deposited
    uint256 public totalDeposits;

    // Total amount of tokens borrowed
    uint256 public totalBorrows;

    // Interest rate in basis points (1% = 100)
    uint256 public borrowInterestRate;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount, uint256 interest);
    event InterestRateUpdated(uint256 newRate);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the lending pool with a specific ERC20 token
     * @param _lendingToken The address of the ERC20 token to be used
     */
    function initialize(address _lendingToken) external initializer {
        require(_lendingToken != address(0), "LendingPoolUpgradeable: token address cannot be zero");

        __ReentrancyGuard_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        lendingToken = IERC20Upgradeable(_lendingToken);
        borrowInterestRate = 500; // Default 5%
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Deposit tokens into the lending pool
     * @param _amount The amount of tokens to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "LendingPoolUpgradeable: deposit amount must be greater than zero");

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
        require(_amount > 0, "LendingPoolUpgradeable: withdraw amount must be greater than zero");
        require(deposits[msg.sender] >= _amount, "LendingPoolUpgradeable: insufficient deposit balance");
        require(getAvailableLiquidity() >= _amount, "LendingPoolUpgradeable: insufficient liquidity");

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
        require(_amount > 0, "LendingPoolUpgradeable: borrow amount must be greater than zero");
        require(getAvailableLiquidity() >= _amount, "LendingPoolUpgradeable: insufficient liquidity");

        // Check if borrower has enough collateral
        require(deposits[msg.sender] >= _amount * 2, "LendingPoolUpgradeable: insufficient collateral");

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
        require(_amount > 0, "LendingPoolUpgradeable: repay amount must be greater than zero");
        require(borrows[msg.sender] > 0, "LendingPoolUpgradeable: no outstanding borrow");

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
     * @dev Update the interest rate (only owner)
     * @param _newRate The new interest rate in basis points
     */
    function updateInterestRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 3000, "LendingPoolUpgradeable: interest rate cannot exceed 30%");
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
     * @return availableToBorrow The amount the user can borrow
     */
    function getUserAccountData(address _user)
        external
        view
        returns (uint256 depositBalance, uint256 borrowBalance, uint256 availableToBorrow)
    {
        depositBalance = deposits[_user];
        borrowBalance = borrows[_user];

        // User can borrow up to 50% of their deposit
        availableToBorrow = depositBalance / 2 > borrowBalance ? depositBalance / 2 - borrowBalance : 0;

        // Limit by available liquidity
        uint256 availableLiquidity = getAvailableLiquidity();
        if (availableToBorrow > availableLiquidity) {
            availableToBorrow = availableLiquidity;
        }
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
