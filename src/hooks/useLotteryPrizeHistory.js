import { useQuery } from '@apollo/client/react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { GET_RECENT_LOTTERY_PRIZES, subgraphClient } from '../config/graphql';

/**
 * Hook to fetch recent lottery prizes from the subgraph
 * Used for the Lottery page history section
 *
 * @param {number} limit - Number of prizes to fetch (default: 7)
 * @param {number} pollInterval - How often to refetch data in ms (default: 30000 = 30 seconds)
 * @returns {Object} { lotteryHistory, loading, error }
 */
export function useLotteryPrizeHistory(limit = 7, pollInterval = 30000) {
  const { address } = useAccount();

  const { data, loading, error, refetch } = useQuery(GET_RECENT_LOTTERY_PRIZES, {
    client: subgraphClient,
    variables: { limit },
    pollInterval, // Auto-refresh
    fetchPolicy: 'cache-and-network', // Show cached data first, then update
  });

  // Format lottery prizes data for the UI
  const lotteryHistory = (data?.lotteryPrizes || []).map(prize => {
    const isUserWinner = address && prize.winner?.toLowerCase() === address.toLowerCase();

    // Determine status
    let status = 'unclaimed';
    if (prize.claimed) {
      status = 'claimed';
    } else if (prize.expired) {
      status = 'expired';
    }

    return {
      day: parseInt(prize.day || '0'),
      winner: prize.winner || '0x0000000000000000000000000000000000000000',
      amount: prize.amount ? parseFloat(formatEther(BigInt(prize.amount))) : 0,
      status,
      claimed: prize.claimed,
      claimTimestamp: prize.claimTimestamp ? parseInt(prize.claimTimestamp) : null,
      expired: prize.expired,
      expiryTimestamp: prize.expiryTimestamp ? parseInt(prize.expiryTimestamp) : null,
      timestamp: parseInt(prize.timestamp || '0'),
      txHash: prize.txHash,
      isUserWinner,
    };
  });

  return {
    lotteryHistory,
    loading,
    error,
    refetch,
  };
}
