import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { StatusChip } from '../components/StatusChip';
import { DisplayFormattedNumber } from '../components/DisplayFormattedNumber';
import { BidModal } from '../components/BidModal';
import { useAuctionData } from '../hooks/useAuctionData';
import { useAuctionCountdown } from '../hooks/useAuctionCountdown';
import { CONTRACT_ADDRESS } from '../config/contract';
import { STRATEGY_ABI } from '../config/abi';
import './Auctions.css';

export default function Auctions() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [claimStatus, setClaimStatus] = useState('idle'); // idle, claiming, success, error
  const [showBidModal, setShowBidModal] = useState(false);

  const {
    auctionPool,
    currentBid,
    minBid,
    currentBidder,
    auctionDay,
    backingValue,
    isUserLeading,
    auctionHistory,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
  } = useAuctionData();

  const { timeRemaining } = useAuctionCountdown();

  // Determine if there are any bids yet
  const hasBids = currentBid > 0 && currentBidder && currentBidder !== '0x0000000000000000000000000000000000000000';

  // Claim contract interaction
  const { writeContract, data: claimHash, error: claimError } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  const handleClaim = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    try {
      setClaimStatus('claiming');
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: STRATEGY_ABI,
        functionName: 'claim',
      });
    } catch (error) {
      console.error('Claim error:', error);
      setClaimStatus('error');
    }
  };

  // Handle claim confirmation
  if (isClaimConfirmed && claimStatus === 'claiming') {
    setClaimStatus('success');
    setTimeout(() => setClaimStatus('idle'), 3000);
  }

  if (claimError && claimStatus === 'claiming') {
    setClaimStatus('error');
    setTimeout(() => setClaimStatus('idle'), 5000);
  }

  const handlePlaceBid = () => {
    if (!address) {
      openConnectModal?.();
      return;
    }
    setShowBidModal(true);
  };

  return (
    <div className="auctions-page">
      {/* Band 1: Header row - title + key stats */}
      <section className="auctions-header-section">
        <div className="auctions-header-content">
          <div className="auctions-title-row">
            <div className="auctions-title-area">
              <h1 className="auctions-main-title">Auctions</h1>
              <p className="auctions-subtitle">Daily auction of protocol fees for MONSTR.</p>
            </div>
            <div className="auctions-stats-chips">
              <StatusChip
                label="Pool"
                value={
                  isLoading ? '...' : (
                    <>
                      <DisplayFormattedNumber num={auctionPool} significant={3} /> MONSTR
                    </>
                  )
                }
                type="default"
                tooltip="Today's MONSTR being auctioned from protocol fees"
              />
              <StatusChip
                label="Min bid"
                value={
                  isLoading ? '...' : (
                    <>
                      <DisplayFormattedNumber num={minBid} significant={3} /> MON
                    </>
                  )
                }
                type="default"
                tooltip="Minimum bid required to participate in the auction"
              />
              <StatusChip
                label="Ends in"
                value={isLoading ? '...' : timeRemaining}
                type="active"
                tooltip="Time until auction ends and winner is determined"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Band 2: Two columns - Today's auction + Your position */}
      <section className="auctions-two-column-section">
        <div className="auctions-two-column-content">
          {/* Left: Today's auction card */}
          <div className="today-auction-card">
            <h2 className="card-section-title">Today's auction</h2>

            <div className="auction-pool-display">
              <span className="pool-label">Auctioning</span>
              <span className="pool-amount">
                <DisplayFormattedNumber num={auctionPool} significant={4} /> MONSTR
              </span>
            </div>

            <div className="auction-info-rows">
              <div className="info-row">
                <span className="info-label">Current highest</span>
                <span className="info-value">
                  {hasBids ? (
                    <>
                      <DisplayFormattedNumber num={currentBid} significant={3} /> MON
                      <span className="status-badge leading">Leading</span>
                    </>
                  ) : (
                    <span className="status-badge no-bids">No bids yet</span>
                  )}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Min bid</span>
                <span className="info-value">
                  <DisplayFormattedNumber num={minBid} significant={3} /> MON
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Backing value</span>
                <span className="info-value">
                  ≈ <DisplayFormattedNumber num={backingValue} significant={3} /> MON
                </span>
              </div>
            </div>

            <div className="countdown-display">
              <span className="countdown-label">Ends in</span>
              <span className="countdown-value">{isLoading ? '...' : timeRemaining}</span>
              <div className="countdown-progress">
                <div className="countdown-progress-bar" style={{ width: '65%' }}></div>
              </div>
            </div>

            <p className="draw-explainer-text">
              Fees from transfers are converted to MONSTR and auctioned once per day. Highest bid wins at end of day.
            </p>
          </div>

          {/* Right: Your position card */}
          <div className="your-position-card">
            <h2 className="card-section-title">Your position</h2>

            {address ? (
              <>
                <div className="auction-info-rows">
                  <div className="info-row">
                    <span className="info-label">Your last bid</span>
                    <span className="info-value">
                      {isUserLeading ? (
                        <>
                          <DisplayFormattedNumber num={currentBid} significant={3} /> MON
                        </>
                      ) : (
                        'No active bid'
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Your status</span>
                    <span className="info-value">
                      {isUserLeading ? (
                        <span className="status-badge winning">Currently leading</span>
                      ) : hasBids ? (
                        <span className="status-badge outbid">Outbid</span>
                      ) : (
                        <span className="status-badge no-bid">No bids</span>
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Potential winnings</span>
                    <span className="info-value">
                      <DisplayFormattedNumber num={auctionPool} significant={4} /> MONSTR
                    </span>
                  </div>
                  {hasUnclaimedPrizes && (
                    <div className="info-row highlight-row">
                      <span className="info-label">Unclaimed prize</span>
                      <span className="info-value highlight-value">
                        <DisplayFormattedNumber num={userClaimable} significant={4} /> MONSTR
                      </span>
                    </div>
                  )}
                </div>

                {isUserLeading && (
                  <div className="winning-banner">
                    <span className="winning-icon">🏆</span>
                    You are currently winning
                  </div>
                )}

                {hasUnclaimedPrizes ? (
                  <button
                    className="claim-btn"
                    onClick={handleClaim}
                    disabled={isClaimConfirming || claimStatus === 'claiming'}
                  >
                    {isClaimConfirming || claimStatus === 'claiming'
                      ? 'Claiming...'
                      : claimStatus === 'success'
                      ? '✓ Claimed!'
                      : claimStatus === 'error'
                      ? 'Error - Try again'
                      : 'Claim prize'}
                  </button>
                ) : !isUserLeading ? (
                  <button className="bid-btn" onClick={handlePlaceBid}>
                    Place bid
                  </button>
                ) : null}
              </>
            ) : (
              <div className="connect-prompt">
                <p className="connect-text">Connect your wallet to participate in auctions and claim prizes.</p>
                <button className="connect-btn-auction" onClick={openConnectModal}>
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Band 3: History - Last 7 auctions */}
      <section className="auctions-history-section">
        <div className="auctions-history-content">
          <div className="history-header">
            <h2 className="section-title">Last 7 auctions</h2>
          </div>

          <div className="history-table-card">
            <div className="history-table">
              <div className="table-header">
                <span className="th-day">Day</span>
                <span className="th-auctioned">Auctioned</span>
                <span className="th-bid">Winning bid</span>
                <span className="th-winner">Winner</span>
                <span className="th-status">Status</span>
              </div>
              {auctionHistory.length > 0 ? (
                auctionHistory.map((entry) => (
                  <div
                    key={entry.day}
                    className={`table-row ${entry.isUserWinner ? 'user-winner' : ''}`}
                  >
                    <span className="td-day">{entry.day}</span>
                    <span className="td-auctioned">
                      <DisplayFormattedNumber num={entry.amount} significant={3} /> MONSTR
                    </span>
                    <span className="td-bid">
                      <DisplayFormattedNumber num={entry.amount * 0.5} significant={3} /> MON
                    </span>
                    <span className="td-winner">
                      {entry.winner.slice(0, 6)}...{entry.winner.slice(-4)}
                      {entry.isUserWinner && <span className="you-badge">You</span>}
                    </span>
                    <span className={`td-status status-${entry.status}`}>
                      {entry.status === 'unclaimed' ? 'Unclaimed' : 'Claimed'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-history-row">
                  <p>No auction history yet. The first auction will happen after day 0.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bid Modal */}
      <BidModal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        minBid={minBid}
        auctionPool={auctionPool}
      />

      {/* Band 4: How it works - Auction specific */}
      <section className="auctions-explainer-section">
        <div className="auctions-explainer-content">
          <h2 className="section-title">How it works</h2>
          <div className="auctions-steps-grid">
            <div className="step-card" tabIndex="0">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Fees accumulate</h3>
                <p className="step-description">
                  1% transfer fee fills the fees pool.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Daily MONSTR auction</h3>
                <p className="step-description">
                  Yesterday's fees are converted to MONSTR and auctioned.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Highest bid wins</h3>
                <p className="step-description">
                  Bids are placed in MON/WMON. Highest bid at day end receives the MONSTR.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Claim prize</h3>
                <p className="step-description">
                  Winners claim within 7 days; older unclaimed prizes are recycled to the treasury.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
