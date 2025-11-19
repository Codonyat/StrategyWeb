import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CONTRACT_CONFIG } from './contract';

// Define custom Monad chains
export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Testnet Explorer', url: 'https://testnet.monadscan.com' },
  },
};

export const monadMainnet = {
  id: 143,
  name: 'Monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://explorer.monad.xyz' },
  },
};

// Get the current chain based on config
const currentChain = CONTRACT_CONFIG.chainId === 143 ? monadMainnet : monadTestnet;

// Create wagmi config
export const config = createConfig({
  chains: [currentChain],
  connectors: [
    injected(), // MetaMask, Coinbase Wallet, etc.
  ],
  transports: {
    [currentChain.id]: http(CONTRACT_CONFIG.rpcUrl),
  },
});
