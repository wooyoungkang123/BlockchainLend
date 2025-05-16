# DeFi Lending Platform Frontend

This is the frontend application for the DeFi Lending Platform project. It allows users to lend and borrow tokens using ETH as collateral.

## Project Structure

The application follows a feature-based architecture to improve organization and maintainability:

```
src/
├── assets/               # Static assets like images and icons
├── components/           # Shared UI components
│   ├── common/           # Generic UI components
│   ├── layout/           # Layout components (Header, Footer, Layout)
│   └── ui/               # UI primitives
│
├── config/               # Configuration files
│
├── contracts/            # Smart contract ABIs and config
│
├── features/             # Feature-based modules
│   ├── borrowing/        # Borrowing feature components
│   ├── dashboard/        # Dashboard feature components 
│   ├── lending/          # Lending feature components
│   └── wallet/           # Wallet connection components
│
├── hooks/                # Custom React hooks
│   ├── contracts/        # Contract interaction hooks
│   ├── data/             # Data fetching and state hooks
│   └── wallet/           # Wallet-related hooks
│
├── lib/                  # Library setup and configuration
│
├── utils/                # Utility functions
│   ├── formatting/       # Formatting utilities
│   └── web3/             # Web3 utilities
│
├── App.css               # Global styles
├── App.tsx               # Main App component
├── index.css             # Base styles
├── main.tsx              # Entry point
└── Web3Provider.tsx      # Web3 provider setup
```

## Features

- Connect to Ethereum wallet via MetaMask
- Supply ETH as collateral
- Borrow USDC stablecoins against ETH collateral
- Repay USDC loans
- View position details and health factor
- Monitor market information

## Technology Stack

- React
- TypeScript
- Wagmi
- RainbowKit
- Ethers.js
- Vite

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open your browser at http://localhost:5173
