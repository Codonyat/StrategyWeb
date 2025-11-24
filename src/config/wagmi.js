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

// Get public RPC URL for wallet chain definition
const publicRpcUrl = CONTRACT_CONFIG.chainId === 143
  ? 'https://rpc.monad.xyz'
  : 'https://testnet-rpc.monad.xyz';

// Define custom Monad chain based on environment config
const currentChain = {
  id: CONTRACT_CONFIG.chainId,
  name: CONTRACT_CONFIG.chainName,
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [publicRpcUrl] },
  },
  blockExplorers: {
    default: {
      name: `${CONTRACT_CONFIG.chainName} Explorer`,
      url: CONTRACT_CONFIG.explorerUrl
    },
  },
};

// Create wagmi config with RainbowKit and custom wallet list
// Use the API proxy for RPC calls to keep the RPC URL private
export const config = getDefaultConfig({
  appName: 'MONSTR Strategy',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [currentChain],
  transports: {
    [currentChain.id]: http('/api/rpc'),
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
