// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts/src/v0.8/ccip/applications/CCIPReceiver.sol";

/**
 * @title CCIPReceiver
 * @dev A contract for receiving and processing cross-chain repayments using Chainlink CCIP
 * This contract extends the Chainlink CCIP receiver to handle loan repayments coming from other chains
 */
contract LoanCCIPReceiver is CCIPReceiver, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // LendingPool address 
    address public lendingPool;
    
    // Mapping of source chain to allowed source address
    mapping(uint64 => mapping(address => bool)) public whitelistedSources;
    
    // Events
    event CCIPRepaymentReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        address borrower,
        address token,
        uint256 amount
    );
    
    event RepaymentProcessed(
        bytes32 indexed messageId,
        address borrower,
        address token,
        uint256 amount,
        bool success
    );

    /**
     * @dev Constructor initializes the contract with a router and lending pool
     * @param _router The Chainlink CCIP router address
     * @param _lendingPool The address of the LendingPool contract
     */
    constructor(address _router, address _lendingPool) CCIPReceiver(_router) {
        require(_lendingPool != address(0), "LoanCCIPReceiver: lending pool cannot be zero address");
        lendingPool = _lendingPool;
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Sets the lending pool address
     * @param _lendingPool The new lending pool address
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "LoanCCIPReceiver: lending pool cannot be zero address");
        lendingPool = _lendingPool;
    }
    
    /**
     * @dev Add a trusted source for cross-chain messages
     * @param _sourceChainSelector The chain selector of the source chain
     * @param _sourceAddress The address on the source chain that's allowed to send messages
     */
    function addTrustedSource(uint64 _sourceChainSelector, address _sourceAddress) external onlyOwner {
        require(_sourceAddress != address(0), "LoanCCIPReceiver: source address cannot be zero address");
        whitelistedSources[_sourceChainSelector][_sourceAddress] = true;
    }
    
    /**
     * @dev Remove a trusted source for cross-chain messages
     * @param _sourceChainSelector The chain selector of the source chain
     * @param _sourceAddress The address on the source chain that's being removed
     */
    function removeTrustedSource(uint64 _sourceChainSelector, address _sourceAddress) external onlyOwner {
        whitelistedSources[_sourceChainSelector][_sourceAddress] = false;
    }
    
    /**
     * @dev Override of the CCIPReceiver's _ccipReceive function to handle incoming CCIP messages
     * @param message The CCIP message containing tokens and data
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override nonReentrant {
        // Verify the sender is whitelisted
        require(
            whitelistedSources[message.sourceChainSelector][abi.decode(message.sender, (address))],
            "LoanCCIPReceiver: sender not whitelisted"
        );
        
        // Decode the message data
        (address borrower, bytes memory repaymentData) = abi.decode(message.data, (address, bytes));
        
        // Check if any tokens were received
        if (message.destTokenAmounts.length > 0) {
            for (uint256 i = 0; i < message.destTokenAmounts.length; i++) {
                address token = message.destTokenAmounts[i].token;
                uint256 amount = message.destTokenAmounts[i].amount;
                
                // Emit an event for the received repayment
                emit CCIPRepaymentReceived(
                    message.messageId,
                    message.sourceChainSelector,
                    abi.decode(message.sender, (address)),
                    borrower,
                    token,
                    amount
                );
                
                // Process the repayment
                bool success = _processRepayment(message.messageId, borrower, token, amount, repaymentData);
                
                emit RepaymentProcessed(
                    message.messageId,
                    borrower,
                    token,
                    amount,
                    success
                );
            }
        }
    }
    
    /**
     * @dev Process a repayment by forwarding tokens to the lending pool
     * @param messageId The CCIP message ID
     * @param borrower The address of the borrower repaying the loan
     * @param token The token being repaid
     * @param amount The amount being repaid
     * @param repaymentData Additional data related to the repayment
     * @return success Whether the repayment was successfully processed
     */
    function _processRepayment(
        bytes32 messageId,
        address borrower,
        address token,
        uint256 amount,
        bytes memory repaymentData
    ) internal returns (bool success) {
        try this._executeRepay(borrower, token, amount, repaymentData) {
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Executes the repayment by approving and calling the lending pool
     * This function is separated to ensure errors can be caught and handled
     * @param borrower The address of the borrower repaying the loan
     * @param token The token being repaid
     * @param amount The amount being repaid
     * @param repaymentData Additional data related to the repayment
     */
    function _executeRepay(
        address borrower,
        address token,
        uint256 amount,
        bytes memory repaymentData
    ) external {
        require(msg.sender == address(this), "LoanCCIPReceiver: only self-call allowed");
        
        // Approve lending pool to spend the tokens
        IERC20(token).safeApprove(lendingPool, amount);
        
        // Call the repay function on the lending pool
        // Format of call depends on the lending pool's interface
        // For example with our LendingPool:
        (bool success, ) = lendingPool.call(
            abi.encodeWithSignature("repayOnBehalf(address,uint256)", borrower, amount)
        );
        
        // Revert if the call failed
        require(success, "LoanCCIPReceiver: repayment failed");
    }
    
    /**
     * @dev Emergency function to withdraw tokens from the contract if they get stuck
     * @param token The token to withdraw
     * @param to The address to send the tokens to
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }
    
    /**
     * @dev Emergency function to withdraw native tokens from the contract
     * @param to The address to send the tokens to
     * @param amount The amount to withdraw
     */
    function emergencyWithdrawETH(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient ETH balance");
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
} 