import { useQuery } from '@apollo/client/react';
import { GET_RECENT_TRANSACTIONS, subgraphClient } from '../config/graphql';

/**
 * Hook to fetch recent transactions from the subgraph
 * Used for the Landing page activity feed
 * Transaction types: MINT, REDEEM (displayed as "BURN"), TRANSFER (displayed as "FEE")
 * Note: TRANSFER transactions are fee collections sent to the fee pool
 *
 * @param {number} limit - Number of transactions to fetch (default: 10)
 * @param {number} pollInterval - How often to refetch data in ms (default: 10000 = 10 seconds)
 * @returns {Object} { transactions, loading, error }
 */
export function useRecentTransactions(limit = 10, pollInterval = 10000) {
  const { data, loading, error } = useQuery(GET_RECENT_TRANSACTIONS, {
    client: subgraphClient,
    variables: { limit },
    pollInterval, // Auto-refresh for real-time updates
    fetchPolicy: 'cache-and-network', // Show cached data first, then update
  });

  return {
    transactions: data?.transactions || [],
    loading,
    error,
  };
}
