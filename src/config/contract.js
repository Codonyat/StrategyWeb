import { STRATEGY_ABI } from './abi';

// Validate required environment variables
const requiredEnvVars = {
  VITE_CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS,
  VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
  VITE_CHAIN_NAME: import.meta.env.VITE_CHAIN_NAME,
  VITE_EXPLORER_URL: import.meta.env.VITE_EXPLORER_URL,
  VITE_TREASURY_ADDRESS: import.meta.env.VITE_TREASURY_ADDRESS,
};

// Check for missing or invalid environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value.trim() === '')
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('[CONTRACT] VALIDATION ERROR: Missing environment variables:', missingVars);
  throw new Error(
    `Missing or invalid required environment variables:\n${missingVars.join('\n')}\n\n` +
    `Please check your .env file and ensure all required variables are set.\n` +
    `See .env.example for reference.`
  );
}

// Validate contract address format
if (!/^0x[a-fA-F0-9]{40}$/.test(requiredEnvVars.VITE_CONTRACT_ADDRESS)) {
  throw new Error(
    `Invalid VITE_CONTRACT_ADDRESS: ${requiredEnvVars.VITE_CONTRACT_ADDRESS}\n` +
    `Must be a valid Ethereum address (0x followed by 40 hex characters)`
  );
}

// Validate treasury address format
if (!/^0x[a-fA-F0-9]{40}$/.test(requiredEnvVars.VITE_TREASURY_ADDRESS)) {
  throw new Error(
    `Invalid VITE_TREASURY_ADDRESS: ${requiredEnvVars.VITE_TREASURY_ADDRESS}\n` +
    `Must be a valid Ethereum address (0x followed by 40 hex characters)`
  );
}

// Validate chain ID is a number
const chainId = parseInt(requiredEnvVars.VITE_CHAIN_ID);
if (isNaN(chainId) || chainId <= 0) {
  throw new Error(
    `Invalid VITE_CHAIN_ID: ${requiredEnvVars.VITE_CHAIN_ID}\n` +
    `Must be a positive integer`
  );
}

// Validate explorer URL
try {
  new URL(requiredEnvVars.VITE_EXPLORER_URL);
} catch (e) {
  throw new Error(`Invalid VITE_EXPLORER_URL: ${requiredEnvVars.VITE_EXPLORER_URL}\nMust be a valid URL`);
}

// Contract configuration
export const CONTRACT_CONFIG = {
  // Contract address
  address: requiredEnvVars.VITE_CONTRACT_ADDRESS,

  // Contract ABI
  abi: STRATEGY_ABI,

  // Chain configuration
  chainId,
  chainName: requiredEnvVars.VITE_CHAIN_NAME,
  rpcUrl: '/api/rpc', // Proxied through Vercel serverless function
  explorerUrl: requiredEnvVars.VITE_EXPLORER_URL,

  // Treasury address
  treasury: requiredEnvVars.VITE_TREASURY_ADDRESS,

  // Token configuration
  strategyCoin: {
    symbol: 'GIGA',
    name: 'Giga Strategy',
  },
  nativeCoin: {
    symbol: 'MEGA',
    name: 'MegaETH',
  },
  wrappedCoin: {
    symbol: 'WMEGA',
    name: 'Wrapped MEGA',
  },

  // External links (optional)
  links: {
    docs: import.meta.env.VITE_LINK_DOCS || '#',
    repository: import.meta.env.VITE_LINK_REPOSITORY || '#',
    twitter: import.meta.env.VITE_LINK_TWITTER || '#',
    telegram: import.meta.env.VITE_LINK_TELEGRAM || '#',
  },
};

// Export contract address separately for convenience
export const CONTRACT_ADDRESS = CONTRACT_CONFIG.address;

// Day duration based on network
// Testnet (10143): 15 minutes = 900 seconds
// Mainnet (143): 25 hours = 90000 seconds
export const PSEUDO_DAY_SECONDS = chainId === 10143 ? 900 : 90000;
