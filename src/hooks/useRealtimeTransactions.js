import { useEffect, useState, useRef, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { io } from 'socket.io-client';
import { GET_RECENT_TRANSACTIONS, subgraphClient } from '../config/graphql';

// WebSocket server URL - set in .env for production
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

/**
 * Hook for real-time transaction updates via WebSocket
 * - Always loads initial data from subgraph (complete history)
 * - WebSocket pushes new transactions on top (real-time)
 * - Falls back to subgraph polling if WebSocket unavailable
 *
 * @param {number} limit - Maximum number of transactions to keep
 * @returns {Object} { transactions, connected, error, loading }
 */
export function useRealtimeTransactions(limit = 10) {
  // Real-time transactions from WebSocket (only NEW ones after page load)
  const [realtimeTransactions, setRealtimeTransactions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [wsError, setWsError] = useState(null);
  const socketRef = useRef(null);

  // Always fetch initial data from subgraph
  const { data: subgraphData, loading: subgraphLoading } = useQuery(GET_RECENT_TRANSACTIONS, {
    client: subgraphClient,
    variables: { limit },
    // Poll only if WebSocket is not connected (as backup)
    pollInterval: connected ? 0 : 30000,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    // Don't connect if no URL configured
    if (!SOCKET_URL) {
      setWsError('WebSocket URL not configured');
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected to real-time server');
      setConnected(true);
      setWsError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
      setWsError('Unable to connect to real-time server');
    });

    // Ignore initial batch from server - we use subgraph instead
    socket.on('recentTransactions', (txs) => {
      console.log('[WS] Ignoring server cache, using subgraph for initial data');
    });

    // Real-time new transaction - add to top with animation
    socket.on('newTransaction', (tx) => {
      console.log('[WS] New transaction:', tx.type, tx.user?.slice(0, 8));

      setRealtimeTransactions(prev => {
        // Mark as new for animation
        const newTx = { ...tx, isNew: true };
        // Add to front, remove duplicates
        const updated = [newTx, ...prev.filter(t => t.id !== tx.id)];
        // Keep reasonable limit for memory
        return updated.slice(0, 50);
      });

      // Remove isNew flag after animation completes (2s)
      setTimeout(() => {
        setRealtimeTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, isNew: false } : t)
        );
      }, 2000);
    });

    // Cleanup on unmount
    return () => {
      console.log('[WS] Cleaning up socket connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Merge: real-time transactions on top, then subgraph data
  // Deduplicate by id, keep limit
  const transactions = useMemo(() => {
    const subgraphTxs = subgraphData?.transactions || [];

    // Combine real-time (new) + subgraph (historical)
    const combined = [...realtimeTransactions];

    // Add subgraph transactions that aren't already in real-time list
    for (const tx of subgraphTxs) {
      if (!combined.some(t => t.id === tx.id)) {
        combined.push(tx);
      }
    }

    // Sort by timestamp descending and limit
    return combined
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      .slice(0, limit);
  }, [realtimeTransactions, subgraphData, limit]);

  return {
    transactions,
    connected,
    error: wsError,
    loading: subgraphLoading,
  };
}

/**
 * Hook for real-time lottery events
 * @returns {Object} { lastLotteryWin, connected }
 */
export function useRealtimeLottery() {
  const [lastLotteryWin, setLastLotteryWin] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!SOCKET_URL) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('lotteryWon', (event) => {
      console.log('[WS] Lottery won:', event);
      setLastLotteryWin(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { lastLotteryWin, connected };
}

/**
 * Hook for real-time auction events (bids and wins)
 * @returns {Object} { lastBid, lastAuctionWin, connected }
 */
export function useRealtimeAuction() {
  const [lastBid, setLastBid] = useState(null);
  const [lastAuctionWin, setLastAuctionWin] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!SOCKET_URL) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('bidPlaced', (event) => {
      console.log('[WS] Bid placed:', event);
      setLastBid(event);
    });

    socket.on('auctionWon', (event) => {
      console.log('[WS] Auction won:', event);
      setLastAuctionWin(event);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { lastBid, lastAuctionWin, connected };
}
