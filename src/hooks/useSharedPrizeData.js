import { useMemo } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';

// Standardized polling interval: 30 seconds
const POLLING_INTERVAL = 30000;

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function getAllUnclaimedPrizes() view returns (address[7] lotteryWinners, uint112[7] lotteryAmounts, address[7] auctionWinners, uint112[7] auctionAmounts)',
  'function getMyClaimableAmount() view returns (uint256)',
]);

/**
 * Centralized hook for prize data (both lottery and auction).
 * Eliminates duplicate calls to getAllUnclaimedPrizes() and getMyClaimableAmount().
 * Used by useLotteryData, useAuctionData, and DataStrip.
 */
export function useSharedPrizeData() {
  const { address } = useAccount();

  // Get all unclaimed prizes (7-day ring buffer for both lottery and auction)
  const { data: allPrizes, error: prizesError, isLoading: prizesLoading, refetch: refetchPrizes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getAllUnclaimedPrizes',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get user's total claimable amount (only if connected)
  const { data: myClaimable, error: claimableError, isLoading: claimableLoading, refetch: refetchClaimable } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getMyClaimableAmount',
    chainId: CONTRACT_CONFIG.chainId,
    account: address,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Memoized calculations
  const calculations = useMemo(() => {
    // GIGA uses 21 decimals
    const GIGA_DECIMALS = CONTRACT_CONFIG.strategyCoin.decimals;
    const userClaimable = myClaimable ? parseFloat(formatUnits(myClaimable, GIGA_DECIMALS)) : 0;
    const hasUnclaimedPrizes = userClaimable > 0;

    // Extract arrays from allPrizes
    const lotteryWinners = allPrizes ? allPrizes[0] : [];
    const lotteryAmounts = allPrizes ? allPrizes[1] : [];
    const auctionWinners = allPrizes ? allPrizes[2] : [];
    const auctionAmounts = allPrizes ? allPrizes[3] : [];

    return {
      userClaimable,
      hasUnclaimedPrizes,
      lotteryWinners,
      lotteryAmounts,
      auctionWinners,
      auctionAmounts,
    };
  }, [myClaimable, allPrizes, address]);

  // Manual refetch function for both queries (useful after claim)
  const refetch = async () => {
    await Promise.all([refetchPrizes(), address ? refetchClaimable() : Promise.resolve()]);
  };

  const hasError = prizesError || claimableError;
  const isLoading = prizesLoading || claimableLoading;

  // Debug logging for errors
  if (typeof window !== 'undefined' && hasError) {
    console.error('Shared Prize Data Errors:', {
      contractAddress: CONTRACT_ADDRESS,
      chainId: CONTRACT_CONFIG.chainId,
      errors: {
        prizes: prizesError?.message,
        claimable: claimableError?.message,
      },
    });
  }

  return {
    // Raw data
    allPrizes,
    myClaimable,

    // Calculated values
    ...calculations,

    // Manual refetch
    refetch,

    // Status
    isLoading,
    hasError,
    error: hasError ? (prizesError || claimableError) : null,
  };
}
