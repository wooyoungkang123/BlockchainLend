// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationOracle
 * @dev Contract to maintain user reputation scores from GitHub data
 * Uses a pull-based pattern where updates are triggered by authorized oracles
 */
contract ReputationOracle is Ownable(msg.sender) {
    // Reputation score for each GitHub username
    mapping(string => uint256) private githubScores;

    // Map GitHub usernames to Ethereum addresses
    mapping(string => address) private githubToAddress;

    // Map Ethereum addresses to GitHub usernames
    mapping(address => string) private addressToGithub;

    // Timestamp of last update for each GitHub username
    mapping(string => uint256) private lastUpdated;

    // Addresses authorized to update reputation scores
    mapping(address => bool) private authorizedOracles;

    // Minimum score to be considered reputable
    uint256 public minimumReputationScore = 50;

    // Events
    event ScoreUpdated(string indexed githubUsername, uint256 score, uint256 timestamp);
    event GithubAccountLinked(address indexed userAddress, string githubUsername);
    event GithubAccountUnlinked(address indexed userAddress, string githubUsername);
    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);
    event MinimumScoreUpdated(uint256 newMinimumScore);

    /**
     * @dev Constructor sets the deployer as the initial owner and authorized oracle
     */
    constructor() {
        _authorizeOracle(msg.sender);
    }

    // Modifier to check if the caller is an authorized oracle
    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "ReputationOracle: caller is not an authorized oracle");
        _;
    }

    /**
     * @dev Authorize an address to update reputation scores
     * @param oracle Address to authorize
     */
    function authorizeOracle(address oracle) external onlyOwner {
        _authorizeOracle(oracle);
    }

    /**
     * @dev Internal function to authorize an oracle
     */
    function _authorizeOracle(address oracle) private {
        require(oracle != address(0), "ReputationOracle: oracle address cannot be zero");
        require(!authorizedOracles[oracle], "ReputationOracle: oracle already authorized");

        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }

    /**
     * @dev Revoke an oracle's authorization
     * @param oracle Address to revoke
     */
    function revokeOracle(address oracle) external onlyOwner {
        require(authorizedOracles[oracle], "ReputationOracle: oracle not authorized");
        require(oracle != owner(), "ReputationOracle: cannot revoke owner as oracle");

        authorizedOracles[oracle] = false;
        emit OracleRevoked(oracle);
    }

    /**
     * @dev Update the reputation score for a GitHub username
     * @param githubUsername The GitHub username
     * @param score The new reputation score
     */
    function updateScore(string calldata githubUsername, uint256 score) external onlyOracle {
        require(bytes(githubUsername).length > 0, "ReputationOracle: github username cannot be empty");

        githubScores[githubUsername] = score;
        lastUpdated[githubUsername] = block.timestamp;

        emit ScoreUpdated(githubUsername, score, block.timestamp);
    }

    /**
     * @dev Batch update reputation scores for multiple GitHub usernames
     * @param githubUsernames Array of GitHub usernames
     * @param scores Array of reputation scores
     */
    function batchUpdateScores(string[] calldata githubUsernames, uint256[] calldata scores) external onlyOracle {
        require(githubUsernames.length == scores.length, "ReputationOracle: arrays length mismatch");

        for (uint256 i = 0; i < githubUsernames.length; i++) {
            require(bytes(githubUsernames[i]).length > 0, "ReputationOracle: github username cannot be empty");

            githubScores[githubUsernames[i]] = scores[i];
            lastUpdated[githubUsernames[i]] = block.timestamp;

            emit ScoreUpdated(githubUsernames[i], scores[i], block.timestamp);
        }
    }

    /**
     * @dev Link a GitHub username to an Ethereum address
     * @param userAddress Ethereum address to link
     * @param githubUsername GitHub username to link
     */
    function linkGithubAccount(address userAddress, string calldata githubUsername) external onlyOwner {
        require(userAddress != address(0), "ReputationOracle: user address cannot be zero");
        require(bytes(githubUsername).length > 0, "ReputationOracle: github username cannot be empty");
        require(bytes(addressToGithub[userAddress]).length == 0, "ReputationOracle: address already linked");
        require(githubToAddress[githubUsername] == address(0), "ReputationOracle: github username already linked");

        addressToGithub[userAddress] = githubUsername;
        githubToAddress[githubUsername] = userAddress;

        emit GithubAccountLinked(userAddress, githubUsername);
    }

    /**
     * @dev Allow users to link their own GitHub account
     * @param githubUsername GitHub username to link
     */
    function linkMyGithubAccount(string calldata githubUsername) external {
        require(bytes(githubUsername).length > 0, "ReputationOracle: github username cannot be empty");
        require(bytes(addressToGithub[msg.sender]).length == 0, "ReputationOracle: address already linked");
        require(githubToAddress[githubUsername] == address(0), "ReputationOracle: github username already linked");

        addressToGithub[msg.sender] = githubUsername;
        githubToAddress[githubUsername] = msg.sender;

        emit GithubAccountLinked(msg.sender, githubUsername);
    }

    /**
     * @dev Unlink a GitHub username from an Ethereum address
     * @param userAddress Ethereum address to unlink
     */
    function unlinkGithubAccount(address userAddress) external onlyOwner {
        string memory githubUsername = addressToGithub[userAddress];
        require(bytes(githubUsername).length > 0, "ReputationOracle: no github account linked");

        delete githubToAddress[githubUsername];
        delete addressToGithub[userAddress];

        emit GithubAccountUnlinked(userAddress, githubUsername);
    }

    /**
     * @dev Allow users to unlink their own GitHub account
     */
    function unlinkMyGithubAccount() external {
        string memory githubUsername = addressToGithub[msg.sender];
        require(bytes(githubUsername).length > 0, "ReputationOracle: no github account linked");

        delete githubToAddress[githubUsername];
        delete addressToGithub[msg.sender];

        emit GithubAccountUnlinked(msg.sender, githubUsername);
    }

    /**
     * @dev Update the minimum reputation score required
     * @param newMinimumScore New minimum score
     */
    function updateMinimumScore(uint256 newMinimumScore) external onlyOwner {
        minimumReputationScore = newMinimumScore;
        emit MinimumScoreUpdated(newMinimumScore);
    }

    /**
     * @dev Check if a GitHub username has sufficient reputation
     * @param githubUsername GitHub username to check
     * @return true if the user has sufficient reputation
     */
    function hasReputationByGithub(string calldata githubUsername) external view returns (bool) {
        return githubScores[githubUsername] >= minimumReputationScore;
    }

    /**
     * @dev Check if an Ethereum address has sufficient reputation via linked GitHub account
     * @param userAddress Ethereum address to check
     * @return true if the address has sufficient reputation
     */
    function hasReputation(address userAddress) external view returns (bool) {
        string memory githubUsername = addressToGithub[userAddress];
        if (bytes(githubUsername).length == 0) {
            return false;
        }
        return githubScores[githubUsername] >= minimumReputationScore;
    }

    /**
     * @dev Get the reputation score for a GitHub username
     * @param githubUsername GitHub username to check
     * @return score Reputation score
     * @return timestamp Last update timestamp
     */
    function getScoreByGithub(string calldata githubUsername)
        external
        view
        returns (uint256 score, uint256 timestamp)
    {
        return (githubScores[githubUsername], lastUpdated[githubUsername]);
    }

    /**
     * @dev Get the reputation score for an Ethereum address via linked GitHub account
     * @param userAddress Ethereum address to check
     * @return score Reputation score
     * @return timestamp Last update timestamp
     * @return githubUsername GitHub username
     */
    function getScore(address userAddress)
        external
        view
        returns (uint256 score, uint256 timestamp, string memory githubUsername)
    {
        githubUsername = addressToGithub[userAddress];
        score = githubScores[githubUsername];
        timestamp = lastUpdated[githubUsername];
    }

    /**
     * @dev Check if an address is an authorized oracle
     * @param oracle Address to check
     * @return true if the address is an authorized oracle
     */
    function isOracle(address oracle) external view returns (bool) {
        return authorizedOracles[oracle];
    }

    /**
     * @dev Get the GitHub username linked to an Ethereum address
     * @param userAddress Ethereum address to check
     * @return GitHub username
     */
    function getGithubUsername(address userAddress) external view returns (string memory) {
        return addressToGithub[userAddress];
    }

    /**
     * @dev Get the Ethereum address linked to a GitHub username
     * @param githubUsername GitHub username to check
     * @return Ethereum address
     */
    function getAddress(string calldata githubUsername) external view returns (address) {
        return githubToAddress[githubUsername];
    }
}
