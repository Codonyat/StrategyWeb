import { useReadContract, useAccount, useBalance } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function currentLotteryPool() view returns (uint256)',
  'function lastLotteryDay() view returns (uint32)',
  'function getAllUnclaimedPrizes() view returns (address[7] lotteryWinners, uint112[7] lotteryAmounts, address[7] auctionWinners, uint112[7] auctionAmounts)',
  'function getMyClaimableAmount() view returns (uint256)',
  'function totalHolderBalance() view returns (uint112 olderValue, uint112 latestValue, uint32 lastUpdatedDay)',
  'function balanceOf(address) view returns (uint256)',
]);

export function useLotteryData() {
  const { address } = useAccount();

  // Get current lottery pool
  const { data: lotteryPool, error: poolError, isLoading: poolLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'currentLotteryPool',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get last lottery day
  const { data: lastLotteryDay, error: dayError, isLoading: dayLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'lastLotteryDay',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get all unclaimed prizes (7-day ring buffer)
  const { data: allPrizes, error: prizesError, isLoading: prizesLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getAllUnclaimedPrizes',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get user's claimable amount (only if connected)
  const { data: myClaimable, error: claimableError, isLoading: claimableLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getMyClaimableAmount',
    chainId: CONTRACT_CONFIG.chainId,
    account: address,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get total holder balance (excludes contracts)
  const { data: totalHolderBalance, error: holderBalanceError, isLoading: holderBalanceLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'totalHolderBalance',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get user balance (only if connected)
  const { data: userBalance, error: balanceError, isLoading: balanceLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Process data
  const currentPool = lotteryPool ? parseFloat(formatEther(lotteryPool)) : 0;

  // Extract latestValue from totalHolderBalance struct (excludes contracts)
  const totalWeight = totalHolderBalance && totalHolderBalance[1]
    ? parseFloat(formatEther(totalHolderBalance[1]))
    : 0;

  const balance = userBalance ? parseFloat(formatEther(userBalance)) : 0;
  const sharePercent = totalWeight > 0 && balance > 0 ? (balance / totalWeight) * 100 : 0;

  // Parse unclaimed prizes into history
  const lotteryHistory = [];
  if (allPrizes) {
    const [lotteryWinners, lotteryAmounts] = allPrizes;

    for (let i = 0; i < 7; i++) {
      const winner = lotteryWinners[i];
      const amount = lotteryAmounts[i];

      // Check if this slot has data (non-zero address means there's a prize)
      if (winner !== '0x0000000000000000000000000000000000000000') {
        const dayNumber = lastLotteryDay ? Number(lastLotteryDay) - i : 0;
        lotteryHistory.push({
          day: dayNumber,
          winner,
          amount: parseFloat(formatEther(amount)),
          status: 'unclaimed', // All prizes in the array are unclaimed
          isUserWinner: address && winner.toLowerCase() === address.toLowerCase(),
        });
      }
    }
  }

  // Calculate total unclaimed amount for connected user
  const userClaimable = myClaimable ? parseFloat(formatEther(myClaimable)) : 0;
  const hasUnclaimedPrizes = userClaimable > 0;

  const hasError = poolError || dayError || prizesError || holderBalanceError;
  const isLoading = poolLoading || dayLoading || prizesLoading || holderBalanceLoading;

  return {
    currentPool,
    lastLotteryDay: lastLotteryDay ? Number(lastLotteryDay) : 0,
    lotteryHistory,
    userBalance: balance,
    totalWeight,
    sharePercent,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
    hasError,
    error: poolError || dayError || prizesError || holderBalanceError,
  };
}
