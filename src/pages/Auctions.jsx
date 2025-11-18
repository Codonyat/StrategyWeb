import { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { theme } from '../config/contract';
import './Auctions.css';

export default function Auctions() {
  const { isConnected } = useWallet();
  const [bidAmount, setBidAmount] = useState('');

  // Mock data - replace with real contract data
  const currentAuction = {
    round: 12,
    timeRemaining: '05:34:12',
    currentLeader: '0x1234...5678',
    leadingBid: '1.5',
    minBid: '1.65',
    isLive: true,
  };

  const recentBids = [
    { wallet: '0x1234...5678', amount: '1.5', timeAgo: '2m ago' },
    { wallet: '0xabcd...ef01', amount: '1.4', timeAgo: '5m ago' },
    { wallet: '0x9876...4321', amount: '1.3', timeAgo: '12m ago' },
  ];

  const pastAuctions = [
    { id: 11, winner: '0xaaa...bbb', amount: '2.1', bidders: 8 },
    { id: 10, winner: '0xccc...ddd', amount: '1.8', bidders: 6 },
    { id: 9, winner: '0xeee...fff', amount: '2.5', bidders: 12 },
  ];

  const handleSetMinBid = () => {
    setBidAmount(currentAuction.minBid);
  };

  return (
    <div className="auctions-page">
      <div className="page-container">
        {/* Page Header */}
        <section className="page-header">
          <div className="header-top">
            <h1 className="page-title">Auctions</h1>
            <span className={`status-badge ${currentAuction.isLive ? 'live' : 'cooldown'}`}>
              {currentAuction.isLive ? 'Live' : 'Cooldown'}
            </span>
          </div>
          <p className="page-subtitle">
            Bid {theme.nativeCoin.symbol} to win {theme.strategyCoin.symbol} tokens
          </p>
        </section>

        {/* Current Auction Area */}
        <section className="current-auction-area">
          <div className="auction-grid">
            {/* Current Auction Panel */}
            <div className="auction-panel">
              <div className="panel-header">
                <h2>Current Auction</h2>
                <span className="round-label">Round {currentAuction.round}</span>
              </div>

              {/* Countdown Timer */}
              <div className="timer-section">
                <div className="timer">{currentAuction.timeRemaining}</div>
                <p className="timer-label">Time remaining</p>
              </div>

              {/* Leader Info */}
              <div className="leader-info">
                <div className="info-row">
                  <span className="info-label">Current leader</span>
                  <span className="info-value mono">{currentAuction.currentLeader}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Leading bid</span>
                  <span className="info-value">
                    {currentAuction.leadingBid} {theme.nativeCoin.symbol}
                  </span>
                </div>
              </div>

              {/* Bidding Area */}
              <div className="bidding-area">
                {isConnected ? (
                  <>
                    <div className="info-row">
                      <span className="info-label">Your current bid</span>
                      <span className="info-value">No active bid</span>
                    </div>

                    <div className="bid-input-group">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter bid amount"
                        className="bid-input"
                        step="0.01"
                      />
                      <span className="input-suffix">{theme.nativeCoin.symbol}</span>
                    </div>

                    <div className="bid-helpers">
                      <button onClick={handleSetMinBid} className="helper-btn">
                        Min bid ({currentAuction.minBid})
                      </button>
                    </div>

                    <button className="btn btn-primary btn-full">Place bid</button>

                    <p className="auction-rules">
                      Minimum bid: {currentAuction.minBid} {theme.nativeCoin.symbol} (10% above current)
                    </p>
                  </>
                ) : (
                  <div className="connect-prompt">
                    <p>Connect wallet to place a bid</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bids Panel */}
            <div className="bids-panel">
              <h3 className="panel-title">Recent Bids</h3>
              <div className="bids-list">
                {recentBids.map((bid, index) => (
                  <div key={index} className="bid-row">
                    <span className="bid-wallet mono">{bid.wallet}</span>
                    <span className="bid-amount">
                      {bid.amount} {theme.nativeCoin.symbol}
                    </span>
                    <span className="bid-time">{bid.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Past Auctions */}
        <section className="past-auctions">
          <h2 className="section-title">Past Auctions</h2>
          <div className="auctions-table">
            <div className="table-header">
              <span>Round</span>
              <span>Winner</span>
              <span>Amount</span>
              <span>Bidders</span>
            </div>
            {pastAuctions.map((auction) => (
              <div key={auction.id} className="table-row">
                <span>#{auction.id}</span>
                <span className="mono">{auction.winner}</span>
                <span>
                  {auction.amount} {theme.nativeCoin.symbol}
                </span>
                <span>{auction.bidders}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
