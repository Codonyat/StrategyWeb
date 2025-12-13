import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { DisplayFormattedNumber } from '../components/DisplayFormattedNumber';
import { EnsAddress } from '../components/EnsAddress';
import { BidModal } from '../components/BidModal';
import { useAuctionData } from '../hooks/useAuctionData';
import { useAuctionCountdown } from '../hooks/useAuctionCountdown';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
import { STRATEGY_ABI } from '../config/abi';
import contractConstants from '../config/contract-constants.json';
import './Auctions.css';

const LOTTERY_PERCENT = Number(contractConstants.LOTTERY_PERCENT);
const AUCTION_PERCENT = 100 - LOTTERY_PERCENT;

export default function Auctions() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [claimStatus, setClaimStatus] = useState('idle'); // idle, claiming, success, error
  const [showBidModal, setShowBidModal] = useState(false);

  const {
    auctionPool,
    currentBid,
    currentBidRaw,
    minBid,
    minBidRaw,
    currentBidder,
    auctionDay,
    backingValue,
    isUserLeading,
    auctionHistory,
    estimatedAuctionPool,
    nextLotAccumulating,
    isMintingPeriod,
    isLastMintingDay,
    isAuctionActive,
    isAuctionStale,
    needsLotteryExecution,
    hasPendingLotteryBeforeAuctions,
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
    // Reset to idle - don't show error state for user rejections
    setClaimStatus('idle');
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
      {/* Band 1: Header row - tagline */}
      <section className="page-header-section">
        <div className="page-header-content">
          <p className="page-tagline">
            Bid with MEGA, win GIGA below market price.
          </p>
        </div>
      </section>

      {/* Band 2: Two columns - Your position + Today's auction */}
      {/* Show preview UI during minting period AND on the last minting day (entire day) */}
      {!isAuctionActive ? (
        <section className="auction-cards-section">
          <div className="page-header-content">
            <div className="hero-content-grid">
          {/* Left: Minting period info card */}
          <div className="your-position-card">
            <h2 className="card-section-title">Bidding starts soon</h2>
            <div className="minting-info-content">
              <p className="minting-info-text">
                Auctions begin after day 1. Each day, {AUCTION_PERCENT}% of collected fees are auctioned to the highest bidder.
              </p>
              <p className="minting-info-text">
                Bids are placed in MEGA, allowing you to acquire GIGA below its backing value.
              </p>
            </div>
          </div>

          {/* Right: First auction preview - shows accumulating fees before auctions start */}
          <div className="today-auction-card">
            <h2 className="card-section-title">First auction preview</h2>

            <div className="today-pool-display">
              <span className="pool-label">Fees accumulating</span>
              <span className="pool-amount">
                <span className="pool-value"><DisplayFormattedNumber num={nextLotAccumulating} significant={3} /> <img src="/coins/giga-icon.png" alt="GIGA" className="pool-icon" /><span className="pool-symbol">GIGA</span></span>
              </span>
            </div>

            <div className="countdown-display">
              <span className="countdown-label">Auction starts in</span>
              <span className="countdown-value">{isLoading ? '...' : timeRemaining}</span>
              <div className="countdown-progress">
                <div className="countdown-progress-bar" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
          </div>
        </div>
        </section>
      ) : (
        <section className="auction-cards-section">
          <div className="page-header-content">
            <div className="hero-content-grid">
          {/* Left: Your position card */}
          <div className="your-position-card">
            <h2 className="card-section-title">Your position</h2>

            {address ? (
              <>
                {needsLotteryExecution ? (
                  <>
                    <div className="auction-info-rows">
                      <div className="info-row">
                        <span className="info-label">Your status</span>
                        <span className="info-value">
                          <span className="status-badge no-bid">Waiting for auction</span>
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Estimated winnings</span>
                        <span className="info-value">
                          <DisplayFormattedNumber num={estimatedAuctionPool} significant={3} /> GIGA
                        </span>
                      </div>
                    </div>

                    <div className="minting-info-content">
                      <p className="minting-info-text">
                        Execute the draw on the Lottery page to start today's auction.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="auction-info-rows">
                      <div className="info-row">
                        <span className="info-label">Your last bid</span>
                        <span className="info-value">
                          {isUserLeading ? (
                            <>
                              <DisplayFormattedNumber num={currentBid} significant={3} /> MEGA
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
                          <DisplayFormattedNumber num={auctionPool} significant={3} /> GIGA
                        </span>
                      </div>
                    </div>

                    <button className="bid-btn" onClick={handlePlaceBid}>
                      {isUserLeading ? 'Increase Bid' : 'Place Bid'}
                    </button>
                  </>
                )}
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

          {/* Right: Today's auction card */}
          <div className="today-auction-card">
            <h2 className="card-section-title">Today's auction</h2>

            {needsLotteryExecution ? (
              <>
                <div className="today-pool-display">
                  <span className="pool-label">Estimated lot</span>
                  <span className="pool-amount">
                    <span className="pool-value"><DisplayFormattedNumber num={estimatedAuctionPool} significant={3} /> <img src="/coins/giga-icon.png" alt="GIGA" className="pool-icon" /><span className="pool-symbol">GIGA</span></span>
                  </span>
                </div>

                <div className="minting-info-content">
                  <p className="minting-info-text">
                    {isAuctionStale
                      ? "Previous day's draw is pending. Draw the winner on the Lottery page to start the new auction."
                      : "Yesterday's draw is pending. Draw the winner on the Lottery page to start today's auction."}
                  </p>
                </div>

                <div className="countdown-display">
                  <span className="countdown-label">Day ends in</span>
                  <span className="countdown-value">{isLoading ? '...' : timeRemaining}</span>
                  <div className="countdown-progress">
                    <div className="countdown-progress-bar" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="dual-pool-display">
                  <div className="pool-column current">
                    <span className="pool-label">Today's lot</span>
                    <span className="pool-amount">
                      <span className="pool-value"><DisplayFormattedNumber num={auctionPool} significant={3} /> <img src="/coins/giga-icon.png" alt="GIGA" className="pool-icon" /><span className="pool-symbol">GIGA</span></span>
                    </span>
                  </div>
                  <div className="pool-column next">
                    <span className="pool-label has-tooltip">
                      Accumulating
                      <span className="pool-tooltip">Fees collecting today for tomorrow's auction.</span>
                    </span>
                    <span className="pool-amount">
                      <span className="pool-value">~<DisplayFormattedNumber num={nextLotAccumulating} significant={3} /> <img src="/coins/giga-icon.png" alt="GIGA" className="pool-icon" /><span className="pool-symbol">GIGA</span></span>
                    </span>
                  </div>
                </div>

                <div className="auction-info-rows">
                  <div className="info-row">
                    <span className="info-label">Current highest</span>
                    <span className="info-value">
                      {hasBids ? (
                        <>
                          <DisplayFormattedNumber num={currentBid} significant={3} /> MEGA
                        </>
                      ) : (
                        <span className="no-bids-text">No bids yet</span>
                      )}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Min bid</span>
                    <span className="info-value">
                      <DisplayFormattedNumber num={minBid} significant={3} /> MEGA
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Backing value</span>
                    <span className="info-value">
                      ≈ <DisplayFormattedNumber num={backingValue} significant={3} /> MEGA
                    </span>
                  </div>
                </div>

                <div className="countdown-display">
                  <span className="countdown-label">Auction ends in</span>
                  <span className="countdown-value">{isLoading ? '...' : timeRemaining}</span>
                  <div className="countdown-progress">
                    <div className="countdown-progress-bar" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
        </section>
      )}

      {/* Band 3: History - Last 7 auctions */}
      <section className="explainer-section auction-history">
        <div className="explainer-content">
          <div className="history-header">
            <h2 className="section-title">Last 7 auctions</h2>
          </div>

          <div className="history-table-card">
            <div className="history-table">
              <div className="table-header">
                <span className="th-day">Day</span>
                <span className="th-winner">Winner</span>
                <span className="th-auctioned">Auctioned</span>
                <span className="th-bid">Winning bid</span>
                <span className="th-status">Status</span>
              </div>
              {auctionHistory.length > 0 ? (
                auctionHistory.map((entry) => (
                  <div
                    key={entry.day}
                    className={`table-row ${entry.isUserWinner ? 'user-winner' : ''}`}
                  >
                    <span className="td-day">{entry.day}</span>
                    <span className="td-winner">
                      <a
                        href={`${CONTRACT_CONFIG.explorerUrl}/address/${entry.winner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="winner-link"
                      >
                        <EnsAddress address={entry.winner} format="full" className="winner-address-full" />
                        <EnsAddress address={entry.winner} format="medium" className="winner-address-medium" />
                        <EnsAddress address={entry.winner} format="compact" className="winner-address-compact" />
                      </a>
                      {entry.isUserWinner && <span className="you-badge">You</span>}
                    </span>
                    <span className="td-auctioned">
                      <DisplayFormattedNumber num={entry.amount} significant={3} /> GIGA
                    </span>
                    <span className="td-bid">
                      <DisplayFormattedNumber num={entry.amount * 0.5} significant={3} /> MEGA
                    </span>
                    <span className={`td-status status-${entry.status}`}>
                      {entry.status === 'claimed' ? (
                        '✓ Claimed'
                      ) : entry.isUserWinner ? (
                        <button
                          className="claim-btn-inline"
                          onClick={handleClaim}
                          disabled={isClaimConfirming || claimStatus === 'claiming'}
                        >
                          {isClaimConfirming || claimStatus === 'claiming'
                            ? 'Claiming...'
                            : claimStatus === 'success'
                            ? '✓ Claimed!'
                            : 'Claim'}
                        </button>
                      ) : (
                        'Unclaimed'
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-history-row">
                  <p>No auctions have completed yet.</p>
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
        minBidRaw={minBidRaw}
        currentBid={currentBid}
        currentBidRaw={currentBidRaw}
        auctionPool={auctionPool}
      />

      {/* Band 4: How it works - Auction specific */}
      <section className="explainer-section">
        <div className="explainer-content">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
            <div className="step-card" tabIndex="0">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Fees accumulate</h3>
                <p className="step-description">
                  {AUCTION_PERCENT}% of the 1% transfer fee goes to the auction pool.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Daily GIGA auction</h3>
                <p className="step-description">
                  Each day's fees in GIGA are auctioned off.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Highest bid wins</h3>
                <p className="step-description">
                  Bids are placed in MEGA. Highest bid at day end receives the GIGA.
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
