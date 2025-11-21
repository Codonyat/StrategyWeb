import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import './Auctions.css';

export default function Auctions() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [bidAmount, setBidAmount] = useState('');

  // Mock data - replace with real contract data
  const currentAuction = {
    round: 12,
    timeRemaining: '05:34:12',
    currentBidder: '0x1234...5678',
    currentBid: '1.5',
    minBid: '1.65',
    monstrAmount: '125.5',
    isActive: true,
  };

  const recentBids = [
    { wallet: '0x1234...5678', amount: '1.5', timeAgo: '2 min ago' },
    { wallet: '0xabcd...ef01', amount: '1.4', timeAgo: '5 min ago' },
    { wallet: '0x9876...4321', amount: '1.3', timeAgo: '12 min ago' },
    { wallet: '0xdef0...1234', amount: '1.2', timeAgo: '18 min ago' },
    { wallet: '0x5555...6666', amount: '1.1', timeAgo: '25 min ago' },
  ];

  const pastAuctions = [
    { round: 11, winner: '0xaaa...bbb', winningBid: '2.1', monstrAmount: '118.3' },
    { round: 10, winner: '0xccc...ddd', winningBid: '1.8', monstrAmount: '112.7' },
    { round: 9, winner: '0xeee...fff', winningBid: '2.5', monstrAmount: '125.9' },
    { round: 8, winner: '0x111...222', winningBid: '1.9', monstrAmount: '108.2' },
  ];

  const handleSetMinBid = () => {
    setBidAmount(currentAuction.minBid);
  };

  const handlePlaceBid = () => {
    // Implement bid logic
    console.log('Placing bid:', bidAmount);
  };

  return (
    <div className="auctions-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-wrapper">
          <p className="hero-subtitle">
            Bid WMON to win MONSTR tokens from daily fees
          </p>

          <div className="hero-content-grid">
            {/* Left Side - Auction Card */}
            <div className="hero-left">
              <div className="auction-card">
                <div className="auction-header">
                  <div className="auction-title">
                    <h2>Current Auction</h2>
                    <span className="round-badge">Round {currentAuction.round}</span>
                  </div>
                  <span className={`status-chip ${currentAuction.isActive ? 'active' : 'inactive'}`}>
                    {currentAuction.isActive ? 'Active' : 'Ended'}
                  </span>
                </div>

                <div className="timer-section">
                  <div className="timer-value">{currentAuction.timeRemaining}</div>
                  <div className="timer-label">Time remaining</div>
                </div>

                <div className="auction-details">
                  <div className="detail-row">
                    <span className="detail-label">Prize</span>
                    <span className="detail-value">{currentAuction.monstrAmount} MONSTR</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current bidder</span>
                    <span className="detail-value mono">{currentAuction.currentBidder}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current bid</span>
                    <span className="detail-value">{currentAuction.currentBid} WMON</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Minimum bid</span>
                    <span className="detail-value highlight">{currentAuction.minBid} WMON</span>
                  </div>
                </div>

                {address ? (
                  <div className="bidding-section">
                    <div className="input-wrapper">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="0.0"
                        className="bid-input"
                        step="0.01"
                      />
                      <span className="token-symbol">WMON</span>
                    </div>
                    <div className="bid-helpers">
                      <button onClick={handleSetMinBid} className="helper-btn">
                        MIN ({currentAuction.minBid})
                      </button>
                    </div>
                    <button
                      className="action-btn bid-btn"
                      onClick={handlePlaceBid}
                      disabled={!bidAmount || parseFloat(bidAmount) < parseFloat(currentAuction.minBid)}
                    >
                      <span className="action-line">Place Bid</span>
                    </button>
                  </div>
                ) : (
                  <button className="action-btn connect-btn" onClick={openConnectModal}>
                    <span className="action-line">Connect Wallet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Side - Recent Bids */}
            <div className="hero-right">
              <div className="bids-list">
                {recentBids.map((bid, index) => (
                  <div key={index} className={`bid-row ${index >= 3 ? 'fade' : ''}`}>
                    <span className="bid-indicator"></span>
                    <span className="bid-type">BID</span>
                    <span className="bid-address">{bid.wallet}</span>
                    <span className="bid-time">{bid.timeAgo}</span>
                    <span className="bid-amount">{bid.amount} WMON</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Past Auctions Section */}
      <section className="history-section">
        <div className="history-content">
          <h2 className="section-title">Auction history</h2>
          <div className="history-grid">
            {pastAuctions.map((auction) => (
              <div key={auction.round} className="history-card" tabIndex="0">
                <div className="card-number">{auction.round}</div>
                <div className="card-content">
                  <h3 className="card-title">Round {auction.round}</h3>
                  <p className="card-description">
                    Winner: <strong className="mono">{auction.winner}</strong>
                  </p>
                  <p className="card-description">
                    Bid: <strong>{auction.winningBid} WMON</strong> for <strong>{auction.monstrAmount} MONSTR</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
