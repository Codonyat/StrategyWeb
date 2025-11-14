import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../config/contract';

/**
 * Get a provider (for read-only operations)
 */
export const getProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  }
  // Fallback to configured RPC if no wallet is connected
  return new ethers.JsonRpcProvider(CONTRACT_CONFIG.rpcUrl);
};

/**
 * Get a signer (for transactions that require user signature)
 */
export const getSigner = async () => {
  if (typeof window.ethereum !== 'undefined') {
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  }
  throw new Error('No wallet detected');
};

/**
 * Request account access from user's wallet
 */
export const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask or another Web3 wallet');
  }
};

/**
 * Get contract instance
 * @param {string} contractAddress - The contract address
 * @param {Array} abi - The contract ABI
 * @param {boolean} needsSigner - Whether the contract needs a signer (for write operations)
 */
export const getContract = async (contractAddress, abi, needsSigner = false) => {
  if (needsSigner) {
    const signer = await getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
  } else {
    const provider = getProvider();
    return new ethers.Contract(contractAddress, abi, provider);
  }
};
