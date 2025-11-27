import { useMemo } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { useGlobalContractData } from './useGlobalContractData';
import { useSharedPrizeData } from './useSharedPrizeData';

// Standardized polling interval: 30 seconds
const POLLING_INTERVAL = 30000;

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function lastLotteryDay() view returns (uint32)',
  'function totalHolderBalance() view returns (uint112 olderValue, uint112 latestValue, uint32 lastUpdatedDay)',
  'function balanceOf(address) view returns (uint256)',
]);

export function useLotteryData() {
  const { address } = useAccount();

  // Use centralized global data (eliminates duplicate calls)
  const { feesPoolAmount } = useGlobalContractData();

  // Use shared prize data (eliminates duplicate calls)
  const {
    lotteryWinners,
    lotteryAmounts,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading: prizeLoading,
    hasError: prizeError,
  } = useSharedPrizeData();

  // Get last lottery day (lottery-specific)
  const { data: lastLotteryDay, error: dayError, isLoading: dayLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'lastLotteryDay',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get total holder balance (excludes contracts) - lottery-specific
  const { data: totalHolderBalance, error: holderBalanceError, isLoading: holderBalanceLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'totalHolderBalance',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get user balance (only if connected) - lottery-specific
  const { data: userBalance, error: balanceError, isLoading: balanceLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Memoized calculations
  const calculations = useMemo(() => {
    // Calculate lottery's share of fees pool
    // Fees are split 50/50 between lottery and auction at the end of each day
    // Even during minting period, show 50% since that's what lottery will receive
    const currentPool = feesPoolAmount * 0.5;

    // Extract latestValue from totalHolderBalance struct (excludes contracts)
    const totalWeight = totalHolderBalance && totalHolderBalance[1]
      ? parseFloat(formatEther(totalHolderBalance[1]))
      : 0;

    const balance = userBalance ? parseFloat(formatEther(userBalance)) : 0;
    const sharePercent = totalWeight > 0 && balance > 0 ? (balance / totalWeight) * 100 : 0;

    // Parse unclaimed prizes into history
    const lotteryHistory = [];
    if (lotteryWinners && lotteryAmounts) {
      for (let i = 0; i < 7; i++) {
        const winner = lotteryWinners[i];
        const amount = lotteryAmounts[i];

        // Check if this slot has data (non-zero address means there's a prize)
        if (winner && winner !== '0x0000000000000000000000000000000000000000') {
          const dayNumber = lastLotteryDay ? Number(lastLotteryDay) - i : 0;
          lotteryHistory.push({
            day: dayNumber,
            winner,
            amount: amount ? parseFloat(formatEther(amount)) : 0,
            status: 'unclaimed', // All prizes in the array are unclaimed
            isUserWinner: address && winner && winner.toLowerCase() === address.toLowerCase(),
          });
        }
      }
    }

    return {
      currentPool,
      balance,
      totalWeight,
      sharePercent,
      lotteryHistory,
    };
  }, [feesPoolAmount, totalHolderBalance, userBalance, lotteryWinners, lotteryAmounts, lastLotteryDay, address]);

  const hasError = dayError || holderBalanceError || balanceError || prizeError;
  const isLoading = dayLoading || holderBalanceLoading || balanceLoading || prizeLoading;

  return {
    currentPool: calculations.currentPool,
    lastLotteryDay: lastLotteryDay ? Number(lastLotteryDay) : 0,
    lotteryHistory: calculations.lotteryHistory,
    userBalance: calculations.balance,
    totalWeight: calculations.totalWeight,
    sharePercent: calculations.sharePercent,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
    hasError,
    error: dayError || holderBalanceError || balanceError,
  };
}
