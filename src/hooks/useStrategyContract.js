import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';

export function useStrategyContract() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Mint MONSTR by depositing MON
   * @param {string} amount - Amount of MON to deposit (in ether units, e.g., "1.0")
   */
  const mint = async (amount) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const value = parseEther(amount);

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'mint',
      value, // Amount of MON to send
    });
  };

  /**
   * Burn MONSTR to withdraw MON
   * @param {string} amount - Amount of MONSTR to burn (in ether units, e.g., "100.0")
   */
  const burn = async (amount) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const tokenAmount = parseEther(amount);

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'redeem',
      args: [tokenAmount],
    });
  };

  /**
   * Execute the daily lottery
   */
  const executeLottery = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'executeLottery',
    });
  };

  /**
   * Claim prizes (lottery and/or auction winnings)
   */
  const claim = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'claim',
    });
  };

  /**
   * Place a bid in the current auction
   * @param {string} amount - Bid amount in WMON (in ether units)
   */
  const bid = async (amount) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const bidAmount = parseEther(amount);

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'bid',
      args: [bidAmount],
    });
  };

  return {
    // Transaction functions
    mint,
    burn,
    executeLottery,
    claim,
    bid,

    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
