import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

console.log('[GRAPHQL] Loading graphql config...');

// Subgraph endpoint from environment variables
const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

console.log('[GRAPHQL] SUBGRAPH_URL:', SUBGRAPH_URL);

if (!SUBGRAPH_URL) {
  console.warn('VITE_SUBGRAPH_URL is not set. Subgraph queries will fail.');
}

console.log('[GRAPHQL] Creating ApolloClient...');

// Create HttpLink explicitly (required in Apollo Client v4)
const httpLink = new HttpLink({
  uri: SUBGRAPH_URL,
});

export const subgraphClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
console.log('[GRAPHQL] ApolloClient created:', subgraphClient);

// GraphQL Queries

/**
 * Get recent mint/burn transactions for the landing page activity feed
 * Returns the last 10 transactions ordered by timestamp (most recent first)
 * Note: Subgraph stores "redeem" type, but UI displays it as "burn"
 */
export const GET_RECENT_TRANSACTIONS = gql`
  query GetRecentTransactions($limit: Int = 10) {
    transactions(
      first: $limit
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      type
      user
      monAmount
      stratAmount
      fee
      timestamp
      txHash
    }
  }
`;

/**
 * Get recent lottery prizes with claim status
 * Returns the last 7 lottery prizes ordered by day (most recent first)
 */
export const GET_RECENT_LOTTERY_PRIZES = gql`
  query GetRecentLotteryPrizes($limit: Int = 7) {
    lotteryPrizes(
      first: $limit
      orderBy: day
      orderDirection: desc
    ) {
      id
      day
      winner
      amount
      claimed
      claimTimestamp
      expired
      expiryTimestamp
      timestamp
      txHash
    }
  }
`;

/**
 * Get recent auction prizes with claim status
 * Returns the last 7 auction prizes ordered by day (most recent first)
 */
export const GET_RECENT_AUCTION_PRIZES = gql`
  query GetRecentAuctionPrizes($limit: Int = 7) {
    auctionPrizes(
      first: $limit
      orderBy: day
      orderDirection: desc
    ) {
      id
      day
      winner
      stratAmount
      monPaid
      claimed
      claimTimestamp
      expired
      expiryTimestamp
      timestamp
      txHash
      bidCount
    }
  }
`;

/**
 * Get user-specific prizes (both lottery and auction)
 * Returns all prizes won by a specific user
 */
export const GET_USER_PRIZES = gql`
  query GetUserPrizes($userAddress: Bytes!) {
    user(id: $userAddress) {
      id
      totalLotteryWinnings
      totalAuctionWinnings
      totalAuctionSpent
      lotteryWinCount
      auctionWinCount

      lotteryWins(orderBy: day, orderDirection: desc) {
        id
        day
        amount
        claimed
        claimTimestamp
        expired
        timestamp
        txHash
      }

      auctionWins(orderBy: day, orderDirection: desc) {
        id
        day
        stratAmount
        monPaid
        claimed
        claimTimestamp
        expired
        timestamp
        txHash
      }
    }
  }
`;

/**
 * Get protocol-wide statistics
 * Returns aggregate data about the protocol
 */
export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocolStats(id: "protocol-stats") {
      totalLotteryPrizes
      totalAuctionPrizes
      totalLotteryClaimed
      totalAuctionClaimed
      totalLotteryExpired
      totalAuctionExpired
      lotteryCount
      auctionCount
      totalBids
    }
  }
`;
