const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createPublicClient, webSocket, parseAbiItem } = require('viem');

const app = express();
const server = http.createServer(app);

// Parse CORS origins from environment
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

// Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,  // Send ping every 25s
  pingTimeout: 60000,   // Wait 60s for pong before disconnect
});

// Contract configuration
const CONTRACT_ADDRESS = '0x4edF071a7dEe52fBE663DF7873994725ba91Cdc7';
const FEES_POOL = '0x00000000000fee50000000AdD2E5500000000000';

// Alchemy WebSocket URL
const ALCHEMY_WSS = process.env.ALCHEMY_WSS_URL;

if (!ALCHEMY_WSS) {
  console.error('ERROR: ALCHEMY_WSS_URL environment variable is required');
  process.exit(1);
}

// Event ABIs
const EVENTS = {
  Minted: parseAbiItem('event Minted(address indexed to, uint256 monAmount, uint256 stratAmount, uint256 fee)'),
  Redeemed: parseAbiItem('event Redeemed(address indexed from, uint256 stratAmount, uint256 monAmount, uint256 fee)'),
  Transfer: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
  LotteryWon: parseAbiItem('event LotteryWon(address indexed winner, uint256 amount, uint256 day)'),
  AuctionWon: parseAbiItem('event AuctionWon(address indexed winner, uint256 stratAmount, uint256 monPaid, uint256 day)'),
  BidPlaced: parseAbiItem('event BidPlaced(address indexed bidder, uint256 amount, uint256 day)'),
};

// In-memory cache of recent transactions
let recentTransactions = [];
const MAX_TRANSACTIONS = 50;

// Track txHashes from Minted/Redeemed to avoid duplicate fee entries
// (Mints and redeems already include fee info, so we skip their Transfer events)
const mintRedeemTxHashes = new Set();
const TX_HASH_TTL = 60000; // Clear after 60s to prevent memory growth

// Viem client and cleanup functions
let client = null;
let unwatchFunctions = [];

/**
 * Setup WebSocket connection to Alchemy and watch for contract events
 */
function setupWebSocket() {
  console.log('Connecting to Alchemy WebSocket...');

  try {
    client = createPublicClient({
      transport: webSocket(ALCHEMY_WSS, {
        reconnect: {
          attempts: 10,
          delay: 1000,
        },
        keepAlive: {
          interval: 30_000, // Heartbeat every 30 seconds (Alchemy best practice)
        },
      }),
    });

    // Watch Minted events
    const unwatchMint = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: [EVENTS.Minted],
      eventName: 'Minted',
      onLogs: (logs) => handleMintedEvents(logs),
      onError: (error) => console.error('Minted watch error:', error),
    });
    unwatchFunctions.push(unwatchMint);

    // Watch Redeemed events
    const unwatchRedeem = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: [EVENTS.Redeemed],
      eventName: 'Redeemed',
      onLogs: (logs) => handleRedeemedEvents(logs),
      onError: (error) => console.error('Redeemed watch error:', error),
    });
    unwatchFunctions.push(unwatchRedeem);

    // Watch Transfer events to FEES_POOL only
    const unwatchTransfer = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: [EVENTS.Transfer],
      eventName: 'Transfer',
      args: { to: FEES_POOL },
      onLogs: (logs) => handleFeeTransferEvents(logs),
      onError: (error) => console.error('Transfer watch error:', error),
    });
    unwatchFunctions.push(unwatchTransfer);

    // Watch LotteryWon events
    const unwatchLottery = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: [EVENTS.LotteryWon],
      eventName: 'LotteryWon',
      onLogs: (logs) => handleLotteryWonEvents(logs),
      onError: (error) => console.error('LotteryWon watch error:', error),
    });
    unwatchFunctions.push(unwatchLottery);

    // Watch AuctionWon events
    const unwatchAuction = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: [EVENTS.AuctionWon],
      eventName: 'AuctionWon',
      onLogs: (logs) => handleAuctionWonEvents(logs),
      onError: (error) => console.error('AuctionWon watch error:', error),
    });
    unwatchFunctions.push(unwatchAuction);

    // Watch BidPlaced events
    const unwatchBid = client.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: [EVENTS.BidPlaced],
      eventName: 'BidPlaced',
      onLogs: (logs) => handleBidPlacedEvents(logs),
      onError: (error) => console.error('BidPlaced watch error:', error),
    });
    unwatchFunctions.push(unwatchBid);

    console.log('WebSocket connected - watching for contract events');
  } catch (error) {
    console.error('Failed to setup WebSocket:', error);
    // Retry after 5 seconds
    setTimeout(setupWebSocket, 5000);
  }
}

/**
 * Event Handlers
 */
function handleMintedEvents(logs) {
  logs.forEach(log => {
    const txHash = log.transactionHash;
    const timestamp = Math.floor(Date.now() / 1000);

    // Track this txHash to skip duplicate Transfer event
    mintRedeemTxHashes.add(txHash);
    setTimeout(() => mintRedeemTxHashes.delete(txHash), TX_HASH_TTL);

    // Emit MINT transaction
    addTransaction({
      id: `${txHash}-${log.logIndex}`,
      type: 'MINT',
      user: log.args.to,
      monAmount: log.args.monAmount.toString(),
      stratAmount: log.args.stratAmount.toString(),
      fee: log.args.fee.toString(),
      timestamp,
      txHash,
    });

    // Emit FEE transaction (if fee > 0)
    if (log.args.fee > 0n) {
      addTransaction({
        id: `${txHash}-${log.logIndex}-fee`,
        type: 'TRANSFER',
        user: log.args.to,
        monAmount: '0',
        stratAmount: log.args.fee.toString(),
        fee: '0',
        timestamp,
        txHash,
      });
    }
  });
}

function handleRedeemedEvents(logs) {
  logs.forEach(log => {
    const txHash = log.transactionHash;
    const timestamp = Math.floor(Date.now() / 1000);

    // Track this txHash to skip duplicate Transfer event
    mintRedeemTxHashes.add(txHash);
    setTimeout(() => mintRedeemTxHashes.delete(txHash), TX_HASH_TTL);

    // Emit REDEEM transaction
    addTransaction({
      id: `${txHash}-${log.logIndex}`,
      type: 'REDEEM',
      user: log.args.from,
      monAmount: log.args.monAmount.toString(),
      stratAmount: log.args.stratAmount.toString(),
      fee: log.args.fee.toString(),
      timestamp,
      txHash,
    });

    // Emit FEE transaction (if fee > 0)
    if (log.args.fee > 0n) {
      addTransaction({
        id: `${txHash}-${log.logIndex}-fee`,
        type: 'TRANSFER',
        user: log.args.from,
        monAmount: '0',
        stratAmount: log.args.fee.toString(),
        fee: '0',
        timestamp,
        txHash,
      });
    }
  });
}

function handleFeeTransferEvents(logs) {
  logs.forEach(log => {
    const txHash = log.transactionHash;

    // Skip if this Transfer is from a Mint/Redeem (already handled)
    if (mintRedeemTxHashes.has(txHash)) {
      console.log('[WS] Skipping duplicate fee transfer for mint/redeem:', txHash.slice(0, 10));
      return;
    }

    // This is a fee from a regular transfer (not mint/redeem)
    addTransaction({
      id: `${txHash}-${log.logIndex}`,
      type: 'TRANSFER',
      user: log.args.from,
      monAmount: '0',
      stratAmount: log.args.value.toString(),
      fee: '0',
      timestamp: Math.floor(Date.now() / 1000),
      txHash,
    });
  });
}

function handleLotteryWonEvents(logs) {
  logs.forEach(log => {
    const event = {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'LOTTERY_WON',
      winner: log.args.winner,
      amount: log.args.amount.toString(),
      day: log.args.day.toString(),
      timestamp: Math.floor(Date.now() / 1000),
      txHash: log.transactionHash,
    };
    io.emit('lotteryWon', event);
    console.log('Lottery won:', event.winner.slice(0, 10), 'Day:', event.day);
  });
}

function handleAuctionWonEvents(logs) {
  logs.forEach(log => {
    const event = {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'AUCTION_WON',
      winner: log.args.winner,
      stratAmount: log.args.stratAmount.toString(),
      monPaid: log.args.monPaid.toString(),
      day: log.args.day.toString(),
      timestamp: Math.floor(Date.now() / 1000),
      txHash: log.transactionHash,
    };
    io.emit('auctionWon', event);
    console.log('Auction won:', event.winner.slice(0, 10), 'Day:', event.day);
  });
}

function handleBidPlacedEvents(logs) {
  logs.forEach(log => {
    const event = {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: 'BID_PLACED',
      bidder: log.args.bidder,
      amount: log.args.amount.toString(),
      day: log.args.day.toString(),
      timestamp: Math.floor(Date.now() / 1000),
      txHash: log.transactionHash,
    };
    io.emit('bidPlaced', event);
    console.log('Bid placed:', event.bidder.slice(0, 10), 'Amount:', event.amount);
  });
}

/**
 * Add transaction to cache and broadcast to clients
 */
function addTransaction(tx) {
  // Avoid duplicates
  if (recentTransactions.some(t => t.id === tx.id)) {
    return;
  }

  // Add to front of array
  recentTransactions.unshift(tx);

  // Keep only MAX_TRANSACTIONS
  if (recentTransactions.length > MAX_TRANSACTIONS) {
    recentTransactions = recentTransactions.slice(0, MAX_TRANSACTIONS);
  }

  // Broadcast to all connected clients
  io.emit('newTransaction', tx);
  console.log('New transaction:', tx.type, tx.user.slice(0, 10));
}

/**
 * Socket.io connection handling
 */
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, '| Total:', io.engine.clientsCount);

  // Send recent transactions on connect
  socket.emit('recentTransactions', recentTransactions.slice(0, 10));

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, '| Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error);
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connections: io.engine.clientsCount,
    cachedTransactions: recentTransactions.length,
    uptime: process.uptime(),
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Strategy WebSocket Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      websocket: 'ws://[host]/',
    },
  });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Allowed origins:', allowedOrigins);
  setupWebSocket();
});

/**
 * Graceful shutdown
 */
function cleanup() {
  console.log('Shutting down...');

  // Unwatch all events
  unwatchFunctions.forEach(unwatch => {
    try {
      unwatch();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });

  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit after 10s
  setTimeout(() => {
    console.log('Forcing exit');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
