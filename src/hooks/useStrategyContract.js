import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';

// Token decimals
const GIGA_DECIMALS = CONTRACT_CONFIG.strategyCoin.decimals; // 21
const MEGA_DECIMALS = CONTRACT_CONFIG.nativeCoin.decimals;   // 18

export function useStrategyContract() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isReceiptSuccess, isError: isReceiptError, error: confirmError, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Transaction succeeded only if receipt was fetched AND status is 'success'
  const isSuccess = isReceiptSuccess && receipt?.status === 'success';
  // Transaction failed if receipt fetch failed OR transaction reverted
  const isConfirmError = isReceiptError || (isReceiptSuccess && receipt?.status === 'reverted');

  /**
   * Mint GIGA by depositing MEGA (ERC20)
   * NOTE: Requires prior approval of MEGA tokens to the contract
   * @param {string} amount - Amount of MEGA to deposit (in ether units, e.g., "1.0")
   */
  const mint = async (amount) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // MEGA uses 18 decimals
    const collateralAmount = parseUnits(amount, MEGA_DECIMALS);

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'mint',
      args: [collateralAmount], // No value - ERC20 transfer via safeTransferFrom
    });
  };

  /**
   * Burn GIGA to withdraw MEGA
   * @param {string} amount - Amount of GIGA to burn (in display units, e.g., "100.0")
   */
  const burn = async (amount) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // GIGA uses 21 decimals
    const tokenAmount = parseUnits(amount, GIGA_DECIMALS);

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
   * Place a bid in the current auction using MEGA (ERC20)
   * NOTE: Requires prior approval of MEGA tokens to the contract
   * @param {string} amount - Bid amount (in ether units)
   */
  const bid = async (amount) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    // MEGA uses 18 decimals
    const bidAmount = parseUnits(amount, MEGA_DECIMALS);

    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_CONFIG.abi,
      functionName: 'bid',
      args: [bidAmount],
      // No value - ERC20 transfer via safeTransferFrom
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
    isConfirmError,
    error,
    confirmError,
    hash,
    reset,
  };
}
