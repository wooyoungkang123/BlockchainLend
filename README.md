# LendFlow Smart Contracts

This repository contains Solidity smart contracts for a simplified lending platform called LendFlow that allows users to deposit ETH as collateral, borrow tokens, repay loans, and handle liquidations.

## Project Structure

```
project/
├── artifacts/           # Build artifacts
│   └── json/            # JSON artifacts
├── config/              # Configuration files
│   ├── .solhint.json    # Solidity linter configuration
│   ├── solhint.config.js # Linter JavaScript configuration
│   └── mcp.json         # Project configuration
├── contracts/
│   ├── core/            # Main contracts
│   │   └── LendingPool.sol    # Main lending pool implementation
│   ├── interfaces/      # Interfaces
│   │   └── ILendingPool.sol   # Interface for the lending pool
│   └── mocks/           # Mock contracts for testing
│       ├── MockToken.sol      # Mock ERC20 token for testing
│       └── MockPriceFeed.sol  # Mock price feed for testing
├── deployments/         # Deployment information
│   ├── deployments.json          # General deployments
│   └── upgradeable-deployments.json  # Upgradeable contract deployments
├── docs/                # Documentation
│   ├── guides/          # User guides and reference documentation
│   │   ├── DEPLOYMENT.md        # Deployment guide
│   │   ├── VERIFICATION.md      # Contract verification guide
│   │   └── ...                  # Other guides
│   └── reports/         # Test and audit reports
│       ├── security/            # Security audit reports
│       ├── slither-report.txt   # Slither analysis output
│       └── tests-summary.md     # Test results summary
├── frontend/            # Frontend application code (if applicable)
├── logs/                # Log files
│   ├── tests-auto.log   # Automated test logs
│   └── tests-unit.log   # Unit test logs
├── scripts/
│   ├── deploy.js        # JavaScript deployment script
│   ├── Deploy.sol       # Solidity deployment script
│   ├── foundry/         # Foundry-specific scripts
│   └── helpers/         # Helper scripts
│       └── config.js    # Configuration helpers
└── test/
    └── LendingPool.t.sol      # Tests for the lending pool
```

## Contracts Overview

1. **LendingPool.sol**: The main contract that implements lending functionality:
   - Deposit ETH as collateral
   - Withdraw ETH collateral
   - Borrow tokens against collateral
   - Repay borrowed tokens
   - Liquidate undercollateralized positions
   - Interest rate and account management

2. **ILendingPool.sol**: Interface defining all functions and events in the LendingPool contract

3. **MockToken.sol**: A simple ERC20 token for testing purposes:
   - Configurable decimals
   - Mint and burn functions for testing

4. **MockPriceFeed.sol**: A mock implementation of Chainlink's price feed interface:
   - Configurable price values
   - Compatible with Chainlink's AggregatorV3Interface

5. **Deploy.sol**: A deployment script that deploys and initializes all contracts

## Setup with Foundry

This project uses [Foundry](https://github.com/foundry-rs/foundry) for development, testing, and deployment.

### Prerequisites

1. Install Foundry:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. Install dependencies:
   ```bash
   forge install OpenZeppelin/openzeppelin-contracts
   forge install smartcontractkit/chainlink
   ```

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy

```bash
forge script scripts/Deploy.sol:Deploy --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## Setup for Testing Platform

These contracts are designed to be tested on a web-based Contract Tester platform. The imports reference OpenZeppelin and Chainlink contracts that would need to be provided by the testing environment.

### Testing Steps

1. Deploy the `Deploy` contract from the scripts directory
2. Call the `deployAll()` function to deploy all contracts and initialize them
3. Interact with the LendingPool contract to test functionality:
   - Deposit ETH using `deposit()` (send ETH along with the transaction)
   - Borrow tokens using `borrow(amount)`
   - Repay loans using `repay(amount)` (requires approval first)
   - Check account data using `getUserAccountData(address)`
   - Test liquidations by changing the ETH price with `changeEthPrice(newPrice)` on the Deploy contract

## Testing Workflow

1. Deploy `Deploy` contract
2. Call `deployAll()` to set up everything
3. Take note of the returned addresses for the Token, PriceFeed, and LendingPool
4. Approve the LendingPool to spend your tokens: `token.approve(lendingPoolAddress, amount)`
5. Deposit ETH as collateral: `lendingPool.deposit()` with ETH value
6. Borrow tokens: `lendingPool.borrow(amount)`
7. Check your position: `lendingPool.getUserAccountData(yourAddress)`
8. To test liquidations:
   - Lower ETH price: `deploy.changeEthPrice(lowerPrice)`
   - From another account, call `lendingPool.liquidate(borrowerAddress, amount)`

## Notes

- The LendingPool uses ETH as collateral and ERC20 tokens (mocked USDC) as the borrowed asset
- Liquidation occurs when a position's health factor falls below 100% (collateral value * 0.8 < borrowed value)
- Liquidators receive a 10% bonus on the collateral they seize
- The interest rate calculation is simplified for testing purposes
