import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_CONFIG } from '../config/contract';
import { useGlobalContractData } from './useGlobalContractData';
import { useSharedPrizeData } from './useSharedPrizeData';
import contractConstants from '../config/contract-constants.json';

// Lottery percent from contract (e.g., 20 = 20% to lottery, rest to auction)
const LOTTERY_PERCENT = Number(contractConstants.LOTTERY_PERCENT) / 100;
const AUCTION_PERCENT = 1 - LOTTERY_PERCENT;

export function useAuctionData() {
  const { address } = useAccount();

  // Use centralized global data (eliminates duplicate calls)
  const {
    backingRatio,
    currentDayNumber,
    auctionPool,
    currentBid,
    currentBidRaw,
    minBid,
    minBidRaw,
    currentBidder,
    auctionDay,
    feesPoolAmount,
    isMintingPeriod,
    isLastMintingDay,
    isAuctionActive,
    isAuctionStale,
    needsLotteryExecution,
    estimatedNextAuctionPool,
    hasPendingLotteryBeforeAuctions,
    isLoading: globalLoading,
    hasError: globalError,
    refetch: refetchGlobalData,
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
    // Use estimatedNextAuctionPool from global data (80% of FEES_POOL - auction gets 80%, lottery gets 20%)
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

  // Next lot is AUCTION_PERCENT of current accumulated fees (lottery gets LOTTERY_PERCENT)
  const nextLotAccumulating = feesPoolAmount * AUCTION_PERCENT;

  return {
    auctionPool,
    currentBid,
    currentBidRaw,
    minBid,
    minBidRaw,
    currentBidder,
    auctionDay,
    backingValue: calculations.backingValue,
    isUserLeading: calculations.isUserLeading,
    auctionHistory: calculations.auctionHistory,
    estimatedAuctionPool: calculations.estimatedAuctionPool,
    nextLotAccumulating,
    isMintingPeriod,
    isLastMintingDay,
    isAuctionActive,
    isAuctionStale,
    needsLotteryExecution,
    hasPendingLotteryBeforeAuctions,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
    hasError,
    error: hasError ? 'Error loading auction data' : null,
    refetch: refetchGlobalData,
  };
}
