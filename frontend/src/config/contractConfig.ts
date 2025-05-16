// Contract configurations for different networks
interface ContractConfig {
  network: string;
  chainId: number;
  tokenContract: {
    address: string;
  };
  lendingPoolContract: {
    address: string;
  };
  priceFeedContract?: {
    address: string;
  };
}

// Local development configuration (using Hardhat local node)
const localConfig: ContractConfig = {
  network: "hardhat",
  chainId: 31337,
  tokenContract: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  },
  lendingPoolContract: {
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  },
  priceFeedContract: {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }
};

// Sepolia testnet configuration - fill this in once deployed to Sepolia
const sepoliaConfig: ContractConfig = {
  network: "sepolia",
  chainId: 11155111,
  tokenContract: {
    address: "" // Will be filled after deployment to testnet
  },
  lendingPoolContract: {
    address: "" // Will be filled after deployment to testnet
  }
};

// Get the appropriate configuration based on environment or chainId
export function getContractConfig(chainId?: number): ContractConfig {
  // Use localhost by default for development
  if (!chainId) {
    return localConfig;
  }

  // Return config based on chainId
  switch (chainId) {
    case 31337: // Hardhat local
      return localConfig;
    case 11155111: // Sepolia
      return sepoliaConfig;
    default:
      console.warn(`No configuration found for chainId ${chainId}, using local config`);
      return localConfig;
  }
}

// Default export for easy imports
export default getContractConfig; 