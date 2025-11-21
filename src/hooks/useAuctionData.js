import { useReadContract, useAccount } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { useProtocolStats } from './useProtocolStats';

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function currentAuction() view returns (address currentBidder, uint96 currentBid, uint96 minBid, uint112 monstrAmount, uint8 auctionDay)',
  'function getAllUnclaimedPrizes() view returns (address[7] lotteryWinners, uint112[7] lotteryAmounts, address[7] auctionWinners, uint112[7] auctionAmounts)',
  'function getMyClaimableAmount() view returns (uint256)',
]);

export function useAuctionData() {
  const { address } = useAccount();
  const { backingRatio, currentDay } = useProtocolStats();

  // Get current auction data
  const { data: currentAuction, error: auctionError, isLoading: auctionLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'currentAuction',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 30000, // Refetch every 30 seconds
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

  // Process current auction data
  const auctionPool = currentAuction && currentAuction[3] ? parseFloat(formatEther(currentAuction[3])) : 0;
  const currentBid = currentAuction && currentAuction[1] ? parseFloat(formatEther(currentAuction[1])) : 0;
  const minBid = currentAuction && currentAuction[2] ? parseFloat(formatEther(currentAuction[2])) : 0;
  const currentBidder = currentAuction ? currentAuction[0] : null;
  const auctionDay = currentAuction && currentAuction[4] !== undefined ? Number(currentAuction[4]) : 0;

  // Calculate backing value (what the MONSTR is worth)
  const backingValue = auctionPool * backingRatio;

  // Check if user is leading
  const isUserLeading = address && currentBidder && currentBidder.toLowerCase() === address.toLowerCase();

  // Parse unclaimed prizes into history
  const auctionHistory = [];
  if (allPrizes) {
    const [, , auctionWinners, auctionAmounts] = allPrizes;

    for (let i = 0; i < 7; i++) {
      const winner = auctionWinners[i];
      const amount = auctionAmounts[i];

      // Check if this slot has data (non-zero address means there's a prize)
      if (winner !== '0x0000000000000000000000000000000000000000') {
        const dayNumber = currentDay - i - 1; // Auction history is offset by 1 day
        auctionHistory.push({
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

  const hasError = auctionError || prizesError;
  const isLoading = auctionLoading || prizesLoading;

  return {
    auctionPool,
    currentBid,
    minBid,
    currentBidder,
    auctionDay,
    backingValue,
    isUserLeading,
    auctionHistory,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
    hasError,
    error: auctionError || prizesError,
  };
}
