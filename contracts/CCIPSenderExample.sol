// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";

/**
 * @title CCIPSenderExample
 * @dev A simple contract to demonstrate sending tokens and messages using Chainlink CCIP
 */
contract CCIPSenderExample is Ownable(msg.sender) {
    using SafeERC20 for IERC20;

    // Chainlink CCIP Router interface
    IRouterClient public immutable router;

    // LINK token address for paying fees
    address public immutable linkToken;

    // Fee payment options
    enum PayFeesIn {
        Native,
        LINK
    }

    // Events
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        address token,
        uint256 amount,
        address feeToken,
        uint256 fees
    );

    /**
     * @dev Constructor sets the router address and LINK token address
     * @param _router Address of the Chainlink CCIP Router
     * @param _linkToken Address of the LINK token used for fees
     */
    constructor(address _router, address _linkToken) {
        require(_router != address(0), "CCIPSenderExample: router cannot be zero address");
        require(_linkToken != address(0), "CCIPSenderExample: LINK token cannot be zero address");
        router = IRouterClient(_router);
        linkToken = _linkToken;
    }

    /**
     * @dev Send tokens through CCIP and pay fees in LINK
     * @param _destinationChainSelector The chain selector of the destination chain
     * @param _receiver The address of the receiver on the destination chain
     * @param _token The address of the token to send
     * @param _amount The amount of tokens to send
     * @param _borrower The address of the borrower being repaid for
     * @return messageId The ID of the CCIP message
     */
    function sendTokensPayLINK(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount,
        address _borrower
    ) external onlyOwner returns (bytes32 messageId) {
        // Create an EVM to EVM message with token transfer
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({token: _token, amount: _amount});

        // Encode borrower address as message data
        bytes memory data = abi.encode(_borrower, bytes(""));

        // Create CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000})),
            feeToken: linkToken
        });

        // Transfer tokens from sender to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Approve router to spend tokens
        IERC20(_token).approve(address(router), _amount);

        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(_destinationChainSelector, message);

        // Ensure the contract has enough LINK tokens to pay the fee
        require(IERC20(linkToken).balanceOf(address(this)) >= fees, "CCIPSenderExample: insufficient LINK balance");

        // Approve router to spend LINK
        IERC20(linkToken).approve(address(router), fees);

        // Send the CCIP message through the router and store the returned message ID
        messageId = router.ccipSend(_destinationChainSelector, message);

        // Emit the event
        emit MessageSent(messageId, _destinationChainSelector, _receiver, _token, _amount, linkToken, fees);

        return messageId;
    }

    /**
     * @dev Send tokens through CCIP and pay fees in native gas token
     * @param _destinationChainSelector The chain selector of the destination chain
     * @param _receiver The address of the receiver on the destination chain
     * @param _token The address of the token to send
     * @param _amount The amount of tokens to send
     * @param _borrower The address of the borrower being repaid for
     * @return messageId The ID of the CCIP message
     */
    function sendTokensPayNative(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount,
        address _borrower
    ) external payable onlyOwner returns (bytes32 messageId) {
        // Create an EVM to EVM message with token transfer
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({token: _token, amount: _amount});

        // Encode borrower address as message data
        bytes memory data = abi.encode(_borrower, bytes(""));

        // Create CCIP message
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver),
            data: data,
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000})),
            feeToken: address(0) // Indicates native payment
        });

        // Transfer tokens from sender to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Approve router to spend tokens
        IERC20(_token).approve(address(router), _amount);

        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(_destinationChainSelector, message);

        // Ensure enough native token is supplied to pay the fee
        require(msg.value >= fees, "CCIPSenderExample: insufficient native token for fees");

        // Send the CCIP message through the router and store the returned message ID
        messageId = router.ccipSend{value: fees}(_destinationChainSelector, message);

        // Refund any excess payment
        uint256 refund = msg.value - fees;
        if (refund > 0) {
            (bool sent,) = payable(msg.sender).call{value: refund}("");
            require(sent, "CCIPSenderExample: failed to refund excess payment");
        }

        // Emit the event
        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _receiver,
            _token,
            _amount,
            address(0), // Indicates native payment
            fees
        );

        return messageId;
    }

    /**
     * @dev Withdraw tokens from the contract
     * @param _token The token to withdraw
     * @param _amount The amount to withdraw
     */
    function withdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    /**
     * @dev Withdraw native token from the contract
     * @param _amount The amount to withdraw
     */
    function withdrawNative(uint256 _amount) external onlyOwner {
        (bool sent,) = payable(msg.sender).call{value: _amount}("");
        require(sent, "CCIPSenderExample: failed to withdraw native token");
    }

    /**
     * @dev Receive function to allow contract to receive native tokens
     */
    receive() external payable {}
}
