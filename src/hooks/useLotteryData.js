import { useMemo } from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS, PSEUDO_DAY_SECONDS } from '../config/contract';
import { useGlobalContractData } from './useGlobalContractData';
import { useSharedPrizeData } from './useSharedPrizeData';
import contractConstants from '../config/contract-constants.json';

// Standardized polling interval: 30 seconds
const POLLING_INTERVAL = 30000;

// Minting period constants
const DEPLOYMENT_TIME = Number(contractConstants.deploymentTime);
const MINTING_PERIOD = Number(contractConstants.MINTING_PERIOD);
const MINTING_END_TIME = DEPLOYMENT_TIME + MINTING_PERIOD;
const LOTTERY_GAP_SECONDS = 60; // 1 minute gap before lottery can execute

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function lastLotteryDay() view returns (uint32)',
  'function totalHolderBalance() view returns (uint112 olderValue, uint112 latestValue, uint32 lastUpdatedDay)',
  'function balanceOf(address) view returns (uint256)',
]);

export function useLotteryData() {
  const { address } = useAccount();

  // Use centralized global data (eliminates duplicate calls)
  const { feesPoolAmount, needsLotteryExecution, currentDayNumber, refetch: refetchGlobalData } = useGlobalContractData();

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
    // The share depends on when the NEXT draw will execute, not current time
    // Next draw happens at: deploymentTime + ((currentDay + 1) * PSEUDO_DAY_SECONDS) + 60
    const nextDrawTime = DEPLOYMENT_TIME + ((currentDayNumber + 1) * PSEUDO_DAY_SECONDS) + LOTTERY_GAP_SECONDS;
    const nextDrawDuringMinting = nextDrawTime <= MINTING_END_TIME;

    // During minting period: 100% of fees go to lottery
    // After minting period: 50% to lottery, 50% to auction
    const lotteryShare = nextDrawDuringMinting ? 1.0 : 0.5;
    const currentPool = feesPoolAmount * lotteryShare;

    // Extract latestValue from totalHolderBalance struct (excludes contracts)
    // GIGA uses 21 decimals
    const GIGA_DECIMALS = CONTRACT_CONFIG.strategyCoin.decimals;
    const totalWeight = totalHolderBalance && totalHolderBalance[1]
      ? parseFloat(formatUnits(totalHolderBalance[1], GIGA_DECIMALS))
      : 0;

    const balance = userBalance ? parseFloat(formatUnits(userBalance, GIGA_DECIMALS)) : 0;
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
            amount: amount ? parseFloat(formatUnits(amount, GIGA_DECIMALS)) : 0,
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
  }, [feesPoolAmount, currentDayNumber, totalHolderBalance, userBalance, lotteryWinners, lotteryAmounts, lastLotteryDay, address]);

  const hasError = dayError || holderBalanceError || balanceError || prizeError;
  const isLoading = dayLoading || holderBalanceLoading || balanceLoading || prizeLoading;

  // The pending draw is for the previous day (currentDayNumber - 1)
  const pendingDrawDay = currentDayNumber > 0 ? currentDayNumber - 1 : 0;

  return {
    currentPool: calculations.currentPool,
    lastLotteryDay: lastLotteryDay ? Number(lastLotteryDay) : 0,
    lotteryHistory: calculations.lotteryHistory,
    userBalance: calculations.balance,
    totalWeight: calculations.totalWeight,
    sharePercent: calculations.sharePercent,
    userClaimable,
    hasUnclaimedPrizes,
    needsLotteryExecution,
    pendingDrawDay,
    isLoading,
    hasError,
    error: dayError || holderBalanceError || balanceError,
    refetch: refetchGlobalData,
  };
}
