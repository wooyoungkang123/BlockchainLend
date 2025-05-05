// Contract deployment configuration
import { sepolia } from "wagmi/chains";
import type { Address } from "viem";

// Deployed contract info
export const LENDING_POOL_ADDRESS: Address = "0x39b908E85Fca1cf6f3AB8dAfD11b674cAD7B0d7c";
export const LENDING_TOKEN_ADDRESS: Address = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
export const ETH_USD_PRICE_FEED: Address = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

// Sepolia deployed chain
export const DEPLOYED_CHAIN = sepolia;

// Default transaction settings
export const DEFAULT_TX_SETTINGS = {
  gasLimit: 3000000n,
};

export type ContractConfig = {
  address: Address;
  chainId: number;
  tokenAddress: Address;
  priceFeed: Address;
  deploymentBlock: number;
};

export const LENDING_POOL_CONFIG: ContractConfig = {
  address: LENDING_POOL_ADDRESS,
  chainId: sepolia.id,
  tokenAddress: LENDING_TOKEN_ADDRESS,
  priceFeed: ETH_USD_PRICE_FEED,
  deploymentBlock: 8261832, // Block number of deployment for event filtering
}; 