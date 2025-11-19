import { http } from 'wagmi';
import { CONTRACT_CONFIG } from './contract';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  trustWallet,
  rabbyWallet,
  phantomWallet,
  coinbaseWallet,
  okxWallet,
  coin98Wallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';

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

// Create wagmi config with RainbowKit and custom wallet list
export const config = getDefaultConfig({
  appName: 'MONSTR Strategy',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [currentChain],
  transports: {
    [currentChain.id]: http(CONTRACT_CONFIG.rpcUrl),
  },
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        phantomWallet,
        rabbyWallet,
        trustWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: 'More Wallets',
      wallets: [
        okxWallet,
        coin98Wallet,
        ledgerWallet,
      ],
    },
  ],
});
