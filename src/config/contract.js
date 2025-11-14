import { STRATEGY_ABI } from './abi';

// Contract configuration using environment variables
// Set these in your .env file:
// VITE_CONTRACT_ADDRESS=0x...
// VITE_RPC_URL=https://...

export const CONTRACT_CONFIG = {
  // Contract address from environment variable
  address: import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',

  // RPC URL from environment variable
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc.ankr.com/eth',

  // Network configuration
  // Monad Mainnet: chainId 143
  // Monad Testnet: chainId 10143
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || '10143'),
  chainName: import.meta.env.VITE_CHAIN_NAME || 'Monad Testnet',

  // Contract ABI
  abi: STRATEGY_ABI
};
