import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { io } from 'socket.io-client';
import { GET_RECENT_TRANSACTIONS, subgraphClient } from '../config/graphql';

// WebSocket server URL - set in .env for production
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

/**
 * Hook for real-time transaction updates via WebSocket
 * Falls back to subgraph polling if WebSocket is unavailable
 *
 * @param {number} limit - Maximum number of transactions to keep
 * @returns {Object} { transactions, connected, error, loading }
 */
export function useRealtimeTransactions(limit = 10) {
  const [wsTransactions, setWsTransactions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [wsError, setWsError] = useState(null);
  const [wsLoading, setWsLoading] = useState(true);
  const socketRef = useRef(null);

  // Fallback: Apollo/subgraph polling (only active when WebSocket fails)
  const shouldUseFallback = !SOCKET_URL || wsError;
  const { data: subgraphData, loading: subgraphLoading } = useQuery(GET_RECENT_TRANSACTIONS, {
    client: subgraphClient,
    variables: { limit },
    pollInterval: shouldUseFallback ? 10000 : 0, // Poll every 10s only when fallback is active
    fetchPolicy: 'cache-and-network',
    skip: !shouldUseFallback, // Skip query when WebSocket is working
  });

  useEffect(() => {
    // Don't connect if no URL configured - use fallback
    if (!SOCKET_URL) {
      setWsLoading(false);
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
      setWsLoading(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
      setWsError('Unable to connect to real-time server');
      setWsLoading(false);
    });

    // Initial batch of recent transactions
    socket.on('recentTransactions', (txs) => {
      console.log('[WS] Received initial transactions:', txs.length);
      setWsTransactions(txs.slice(0, limit));
    });

    // Real-time new transaction
    socket.on('newTransaction', (tx) => {
      console.log('[WS] New transaction:', tx.type, tx.user?.slice(0, 8));
      setWsTransactions(prev => {
        // Add new transaction, remove duplicates, keep limit
        const updated = [tx, ...prev.filter(t => t.id !== tx.id)];
        return updated.slice(0, limit);
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('[WS] Cleaning up socket connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [limit]);

  // Use WebSocket data if connected, otherwise fall back to subgraph
  const transactions = connected && wsTransactions.length > 0
    ? wsTransactions
    : (subgraphData?.transactions || []);

  const loading = shouldUseFallback ? subgraphLoading : wsLoading;

  return {
    transactions,
    connected,
    error: wsError,
    loading,
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
