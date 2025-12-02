import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_CONFIG } from '../config/contract';
import { useGlobalContractData } from './useGlobalContractData';
import { useSharedPrizeData } from './useSharedPrizeData';

export function useAuctionData() {
  const { address } = useAccount();

  // Use centralized global data (eliminates duplicate calls)
  const {
    backingRatio,
    currentDayNumber,
    auctionPool,
    currentBid,
    minBid,
    currentBidder,
    auctionDay,
    feesPoolAmount,
    isMintingPeriod,
    isLastMintingDay,
    isAuctionActive,
    isAuctionStale,
    needsLotteryExecution,
    estimatedNextAuctionPool,
    isLoading: globalLoading,
    hasError: globalError,
  } = useGlobalContractData();

  // Use shared prize data (eliminates duplicate calls)
  const {
    auctionWinners,
    auctionAmounts,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading: prizeLoading,
    hasError: prizeError,
  } = useSharedPrizeData();

  // Memoized calculations
  const calculations = useMemo(() => {
    // Use estimatedNextAuctionPool from global data (50% of FEES_POOL)
    const estimatedAuctionPool = estimatedNextAuctionPool;

    // Calculate backing value (what the MONSTR is worth)
    const backingValue = auctionPool * backingRatio;

    // Check if user is leading
    const isUserLeading = address && currentBidder && currentBidder.toLowerCase() === address.toLowerCase();

    // Parse unclaimed prizes into history
    // GIGA uses 21 decimals
    const GIGA_DECIMALS = CONTRACT_CONFIG.strategyCoin.decimals;
    const auctionHistory = [];
    if (auctionWinners && auctionAmounts) {
      for (let i = 0; i < 7; i++) {
        const winner = auctionWinners[i];
        const amount = auctionAmounts[i];

        // Check if this slot has data (non-zero address means there's a prize)
        if (winner && winner !== '0x0000000000000000000000000000000000000000') {
          const dayNumber = currentDayNumber - i - 1; // Auction history is offset by 1 day
          auctionHistory.push({
            day: dayNumber,
            winner,
            amount: amount ? parseFloat(formatUnits(amount, GIGA_DECIMALS)) : 0,
            status: 'unclaimed', // All prizes in the array are unclaimed
            isUserWinner: address && winner && winner.toLowerCase() === address.toLowerCase(),
          });
        }
      }
    }

    return {
      backingValue,
      isUserLeading,
      auctionHistory,
      estimatedAuctionPool,
    };
  }, [auctionPool, backingRatio, address, currentBidder, auctionWinners, auctionAmounts, currentDayNumber, estimatedNextAuctionPool]);

  const hasError = globalError || prizeError;
  const isLoading = globalLoading || prizeLoading;

  return {
    auctionPool,
    currentBid,
    minBid,
    currentBidder,
    auctionDay,
    backingValue: calculations.backingValue,
    isUserLeading: calculations.isUserLeading,
    auctionHistory: calculations.auctionHistory,
    estimatedAuctionPool: calculations.estimatedAuctionPool,
    isMintingPeriod,
    isLastMintingDay,
    isAuctionActive,
    isAuctionStale,
    needsLotteryExecution,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
    hasError,
    error: hasError ? 'Error loading auction data' : null,
  };
}
