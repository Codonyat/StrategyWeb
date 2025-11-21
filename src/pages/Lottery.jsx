import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import './Lottery.css';

export default function Lottery() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Mock data - replace with real contract data
  const lotteryData = {
    currentRound: 156,
    snapshotIn: '12:34:56',
    drawIn: '18:45:23',
    prizePool: '12.5',
    userBalance: '1500',
    userWeight: '1500',
    totalWeight: '150000',
    weightPercent: '1.0',
    estimatedOdds: '1 in 100',
    hasUnclaimedPrizes: true,
    unclaimedAmount: '0.5',
  };

  const recentWinners = [
    { round: 155, winner: '0x1234...5678', prize: '10.2', timeAgo: '1 hour ago' },
    { round: 154, winner: '0xabcd...ef01', prize: '8.9', timeAgo: '26 hours ago' },
    { round: 153, winner: '0x9876...4321', prize: '11.5', timeAgo: '2 days ago' },
    { round: 152, winner: '0xdef0...1234', prize: '9.3', timeAgo: '3 days ago' },
    { round: 151, winner: '0x5555...6666', prize: '12.1', timeAgo: '4 days ago' },
  ];

  const pastWinners = [
    { round: 150, winner: '0x1111...2222', prize: '13.4' },
    { round: 149, winner: '0x3333...4444', prize: '9.8' },
    { round: 148, winner: '0x5555...6666', prize: '11.2' },
    { round: 147, winner: '0x7777...8888', prize: '10.5' },
  ];

  const handleClaim = () => {
    console.log('Claiming prizes');
  };

  return (
    <div className="lottery-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-wrapper">
          <p className="hero-subtitle">
            Automatic daily lottery weighted by token balance
          </p>

          <div className="hero-content-grid">
            {/* Left Side - Lottery Card */}
            <div className="hero-left">
              <div className="lottery-card">
                <div className="lottery-header">
                  <div className="lottery-title">
                    <h2>Current Lottery</h2>
                    <span className="round-badge">Round {lotteryData.currentRound}</span>
                  </div>
                  <span className="status-chip active">Active</span>
                </div>

                <div className="timers-section">
                  <div className="timer-block">
                    <div className="timer-value">{lotteryData.snapshotIn}</div>
                    <div className="timer-label">Snapshot in</div>
                  </div>
                  <div className="timer-block">
                    <div className="timer-value">{lotteryData.drawIn}</div>
                    <div className="timer-label">Draw in</div>
                  </div>
                </div>

                <div className="lottery-details">
                  <div className="detail-row">
                    <span className="detail-label">Prize pool</span>
                    <span className="detail-value highlight">{lotteryData.prizePool} MONSTR</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total weight</span>
                    <span className="detail-value">{lotteryData.totalWeight}</span>
                  </div>
                  {address && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Your balance</span>
                        <span className="detail-value">{lotteryData.userBalance} MONSTR</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Your weight</span>
                        <span className="detail-value">{lotteryData.userWeight} ({lotteryData.weightPercent}%)</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Estimated odds</span>
                        <span className="detail-value">{lotteryData.estimatedOdds}</span>
                      </div>
                    </>
                  )}
                </div>

                {address ? (
                  lotteryData.hasUnclaimedPrizes ? (
                    <div className="claim-section">
                      <div className="unclaimed-info">
                        <span className="unclaimed-icon">🎉</span>
                        <div>
                          <div className="unclaimed-title">Unclaimed prizes</div>
                          <div className="unclaimed-amount">{lotteryData.unclaimedAmount} MONSTR</div>
                        </div>
                      </div>
                      <button className="action-btn claim-btn" onClick={handleClaim}>
                        <span className="action-line">Claim Prizes</span>
                      </button>
                    </div>
                  ) : null
                ) : (
                  <button className="action-btn connect-btn" onClick={openConnectModal}>
                    <span className="action-line">Connect Wallet</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Side - Recent Winners */}
            <div className="hero-right">
              <div className="winners-list">
                {recentWinners.map((winner, index) => (
                  <div key={winner.round} className={`winner-row ${index >= 3 ? 'fade' : ''}`}>
                    <span className="winner-indicator"></span>
                    <span className="winner-type">WIN</span>
                    <span className="winner-address">{winner.winner}</span>
                    <span className="winner-time">{winner.timeAgo}</span>
                    <span className="winner-prize">{winner.prize} MONSTR</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Past Winners Section */}
      <section className="history-section">
        <div className="history-content">
          <h2 className="section-title">Lottery history</h2>
          <div className="history-grid">
            {pastWinners.map((winner) => (
              <div key={winner.round} className="history-card" tabIndex="0">
                <div className="card-number">{winner.round}</div>
                <div className="card-content">
                  <h3 className="card-title">Round {winner.round}</h3>
                  <p className="card-description">
                    Winner: <strong className="mono">{winner.winner}</strong>
                  </p>
                  <p className="card-description">
                    Prize: <strong>{winner.prize} MONSTR</strong>
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
