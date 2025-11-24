import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// WebSocket server URL - set in .env for production
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';

/**
 * Hook for real-time transaction updates via WebSocket
 * Falls back gracefully if WebSocket is unavailable
 *
 * @param {number} limit - Maximum number of transactions to keep
 * @returns {Object} { transactions, connected, error, loading }
 */
export function useRealtimeTransactions(limit = 10) {
  const [transactions, setTransactions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    // Don't connect if no URL configured
    if (!SOCKET_URL) {
      setLoading(false);
      setError('WebSocket URL not configured');
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
      setError(null);
      setLoading(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
      setError('Unable to connect to real-time server');
      setLoading(false);
    });

    // Initial batch of recent transactions
    socket.on('recentTransactions', (txs) => {
      console.log('[WS] Received initial transactions:', txs.length);
      setTransactions(txs.slice(0, limit));
    });

    // Real-time new transaction
    socket.on('newTransaction', (tx) => {
      console.log('[WS] New transaction:', tx.type, tx.user?.slice(0, 8));
      setTransactions(prev => {
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

  return {
    transactions,
    connected,
    error,
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
