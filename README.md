# LendFlow Smart Contracts

This repository contains Solidity smart contracts for a simplified lending platform called LendFlow that allows users to deposit tokens as collateral, borrow tokens, repay loans, and handle liquidations.

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
│   ├── mocks/           # Mock contracts for testing
│   │   ├── MockToken.sol      # Mock ERC20 token for testing
│   │   └── MockPriceFeed.sol  # Mock price feed for testing
│   ├── test/            # Test-specific contracts
│   │   └── MockERC20.sol      # Mock ERC20 for testing
│   └── LendingPool.sol  # Latest version of lending pool
├── deployments/         # Deployment information
├── frontend/            # Frontend application code
│   └── src/             # Frontend source code
├── scripts/
│   ├── deploy.js        # JavaScript deployment script
│   └── Deploy.sol       # Solidity deployment script
├── test/
│   ├── LendingPool.t.sol      # Tests for the lending pool
│   └── invariant/             # Invariant tests (more complex test scenarios)
└── .github/
    └── workflows/       # GitHub Actions CI/CD workflows
```

## Contracts Overview

1. **LendingPool.sol**: The main contract that implements lending functionality:
   - Deposit tokens as collateral
   - Withdraw tokens
   - Borrow tokens against collateral
   - Repay borrowed tokens
   - Liquidate undercollateralized positions
   - Interest rate and account management

2. **ILendingPool.sol**: Interface defining all functions and events in the LendingPool contract

3. **MockERC20.sol**: A simple ERC20 token for testing purposes:
   - Configurable decimals
   - Mint and burn functions for testing

4. **MockPriceFeed.sol**: A mock implementation of Chainlink's price feed interface:
   - Configurable price values
   - Compatible with Chainlink's AggregatorV3Interface

5. **Deploy.sol**: A deployment script that deploys and initializes all contracts

## Recent Changes

- **Ownable Constructor Updates**: Updated all contracts to use the latest OpenZeppelin Ownable constructor pattern (`Ownable(msg.sender)`)
- **MockPriceFeed Fix**: Renamed `updatePrice` function to ensure compatibility with the deployment script
- **Test Updates**: Updated test files to work with the new contract structures
- **CI Pipeline**: Added GitHub Actions workflow for continuous integration that runs tests automatically

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
# Run all tests
forge test

# Run only basic tests (excluding invariant tests)
forge test --match-path "test/*.sol"

# Format code (important for CI)
forge fmt
```

### Deploy

```bash
forge script scripts/Deploy.sol:Deploy --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## Running the Frontend

The project includes a frontend application built with React, Vite and ethers.js.

```bash
# Start a local Hardhat node
npm run dev

# In another terminal, start the frontend
cd frontend
npm run dev
```

## Frontend Deployment

The frontend can be deployed to GitHub Pages by following these steps:

1. Go to the frontend directory: `cd frontend`
2. Update the Vite config file (`vite.config.ts`) to include base path:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/LendFlow/'
   })
   ```
3. Install gh-pages: `npm install --save-dev gh-pages`
4. Add deployment scripts to package.json:
   ```json
   "scripts": {
     // other scripts...
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
5. Deploy: `npm run deploy`

Alternatively, the GitHub Actions workflow at `.github/workflows/frontend-deploy.yml` can automatically deploy your frontend whenever changes are pushed to the main branch. To enable this:

1. In your GitHub repository, go to **Settings > Pages**
2. Under **Build and deployment > Source**, select **GitHub Actions**

Once deployed, your frontend will be available at: `https://[your-username].github.io/LendFlow/`

## Testing Workflow

1. Deploy `Deploy` contract
2. Call `deployAll()` to set up everything
3. Note the returned addresses for the Token, PriceFeed, and LendingPool
4. Approve the LendingPool to spend your tokens: `token.approve(lendingPoolAddress, amount)`
5. Deposit tokens as collateral: `lendingPool.deposit(amount)`
6. Borrow tokens: `lendingPool.borrow(amount)`
7. Check your position: `lendingPool.getUserAccountData(yourAddress)`
8. To test liquidations:
   - From another account, call `lendingPool.liquidate(borrowerAddress)`

## Notes

- The LendingPool uses tokens as collateral and borrowed assets
- Liquidation occurs when a position's health factor falls below 80%
- The interest rate calculation is simplified for testing purposes
- Continuous Integration is set up to validate code formatting and run tests on each push
