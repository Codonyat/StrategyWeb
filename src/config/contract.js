import { STRATEGY_ABI } from './abi';

// All configuration indexed by chain ID
const NETWORK_CONFIGS = {
  143: {
    // Network info
    chainName: 'Monad',
    rpcUrl: 'https://rpc.monad.xyz',
    explorerUrl: 'https://explorer.monad.xyz',

    // Token info
    strategyCoin: {
      symbol: 'MONSTR',
      name: 'MONSTR',
      logo: '/coins/143/monstr.png',
      logoSmall: '/coins/143/monstr-icon.png',
    },
    nativeCoin: {
      symbol: 'MON',
      name: 'MON',
      logo: '/coins/143/mon.png',
      logoSmall: '/coins/143/mon-icon.png',
    },
    wrappedCoin: {
      symbol: 'WMON',
      name: 'WMON',
      logo: '/coins/143/mon.png',
      logoSmall: '/coins/143/mon-icon.png',
    },

    // Colors
    colors: {
      background: '#0a0a0a',
      backgroundLight: '#1a1a1a',
      backgroundCard: '#151515',
      primaryAccent: '#6366f1',
      primaryAccentHover: '#4f46e5',
      primaryAccentLight: '#818cf8',
      secondaryAccent: '#8b5cf6',
      secondaryAccentHover: '#7c3aed',
      secondaryAccentLight: '#a78bfa',
      textPrimary: '#ffffff',
      textSecondary: '#a0a0a0',
      textMuted: '#606060',
      border: '#2a2a2a',
      borderLight: '#3a3a3a',
      borderHover: '#4a4a4a',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },

    // External links
    links: {
      docs: '#',
      repository: '#',
      twitter: '#',
      discord: '#',
    },

    // Treasury address
    treasury: '0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A',
  },
  10143: {
    // Network info
    chainName: 'Monad Testnet',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    explorerUrl: 'https://testnet.monadscan.com/',

    // Token info
    strategyCoin: {
      symbol: 'MONSTR',
      name: 'MONSTR',
      logo: '/coins/143/monstr.png',
      logoSmall: '/coins/143/monstr-icon.png',
    },
    nativeCoin: {
      symbol: 'MON',
      name: 'MON',
      logo: '/coins/143/mon.png',
      logoSmall: '/coins/143/mon-icon.png',
    },
    wrappedCoin: {
      symbol: 'WMON',
      name: 'WMON',
      logo: '/coins/143/mon.png',
      logoSmall: '/coins/143/mon-icon.png',
    },

    // Colors
    colors: {
      background: '#0a0a0a',
      backgroundLight: '#1a1a1a',
      backgroundCard: '#151515',
      primaryAccent: '#6366f1',
      primaryAccentHover: '#4f46e5',
      primaryAccentLight: '#818cf8',
      secondaryAccent: '#8b5cf6',
      secondaryAccentHover: '#7c3aed',
      secondaryAccentLight: '#a78bfa',
      textPrimary: '#ffffff',
      textSecondary: '#a0a0a0',
      textMuted: '#606060',
      border: '#2a2a2a',
      borderLight: '#3a3a3a',
      borderHover: '#4a4a4a',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },

    // External links
    links: {
      docs: '#',
      repository: '#',
      twitter: '#',
      discord: '#',
    },

    // Treasury address
    treasury: '0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A',
  }
};

// Get chain ID from environment variable
const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '10143');

// Get network configuration for the current chain ID
const config = NETWORK_CONFIGS[chainId] || NETWORK_CONFIGS[10143];

// Contract configuration using environment variables
// Set these in your .env file:
// VITE_CONTRACT_ADDRESS=0x...
// VITE_RPC_URL=https://... (optional, will use network default)
// VITE_CHAIN_ID=10143 (or 143 for mainnet)

export const CONTRACT_CONFIG = {
  // Contract address from environment variable
  address: import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',

  // RPC URL from environment variable, fallback to network default
  rpcUrl: import.meta.env.VITE_RPC_URL || config.rpcUrl,

  // Contract ABI
  abi: STRATEGY_ABI,

  // Chain ID
  chainId,

  // Spread all network config
  ...config
};

// Export as 'theme' for backward compatibility
export const theme = CONTRACT_CONFIG;

// Export contract address separately for convenience
export const CONTRACT_ADDRESS = CONTRACT_CONFIG.address;
