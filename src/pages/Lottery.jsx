import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { DisplayFormattedNumber } from '../components/DisplayFormattedNumber';
import { EnsAddress } from '../components/EnsAddress';
import { useLotteryData } from '../hooks/useLotteryData';
import { useLotteryPrizeHistory } from '../hooks/useLotteryPrizeHistory';
import { useLotteryCountdown } from '../hooks/useLotteryCountdown';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
import { STRATEGY_ABI } from '../config/abi';
import './Lottery.css';

// Helper to truncate address for desktop
const truncateAddress = (addr) => {
  if (!addr) return '0x0000...0000';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// Compact address for mobile (shorter)
const compactAddress = (addr) => {
  if (!addr) return '0x00..00';
  return `${addr.slice(0, 4)}..${addr.slice(-2)}`;
};

export default function Lottery() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [claimStatus, setClaimStatus] = useState('idle'); // idle, claiming, success, error
  const [drawStatus, setDrawStatus] = useState('idle'); // idle, drawing, success, error

  const {
    currentPool,
    userBalance,
    totalWeight,
    sharePercent,
    userClaimable,
    hasUnclaimedPrizes,
    needsLotteryExecution,
    pendingDrawDay,
    isLoading,
  } = useLotteryData();

  // Get lottery prize history from subgraph (with claim status)
  const { lotteryHistory, loading: historyLoading, refetch: refetchHistory } = useLotteryPrizeHistory(7, 30000);

  const { timeRemaining } = useLotteryCountdown();
  const { isMintingPeriod } = useProtocolStats();

  // Calculate total unclaimed in the 7-day ring
  const totalUnclaimed = lotteryHistory.reduce((sum, entry) => sum + entry.amount, 0);

  // Claim contract interaction
  const { writeContract: writeClaimContract, data: claimHash, error: claimError } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  // Draw winner contract interaction
  const { writeContract: writeDrawContract, data: drawHash, error: drawError } = useWriteContract();

  const { isLoading: isDrawConfirming, isSuccess: isDrawConfirmed } = useWaitForTransactionReceipt({
    hash: drawHash,
  });

  const handleClaim = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    try {
      setClaimStatus('claiming');
      writeClaimContract({
        address: CONTRACT_ADDRESS,
        abi: STRATEGY_ABI,
        functionName: 'claim',
      });
    } catch (error) {
      console.error('Claim error:', error);
      setClaimStatus('error');
    }
  };

  const handleDrawWinner = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    try {
      setDrawStatus('drawing');
      writeDrawContract({
        address: CONTRACT_ADDRESS,
        abi: STRATEGY_ABI,
        functionName: 'executeLottery',
      });
    } catch (error) {
      console.error('Draw winner error:', error);
      setDrawStatus('error');
    }
  };

  // Handle claim confirmation
  useEffect(() => {
    if (isClaimConfirmed && claimStatus === 'claiming') {
      setClaimStatus('success');
      // Refetch lottery history immediately to show claimed status
      refetchHistory();
      setTimeout(() => setClaimStatus('idle'), 3000);
    }
  }, [isClaimConfirmed, claimStatus, refetchHistory]);

  useEffect(() => {
    if (claimError && claimStatus === 'claiming') {
      setClaimStatus('error');
      setTimeout(() => setClaimStatus('idle'), 5000);
    }
  }, [claimError, claimStatus]);

  // Handle draw confirmation
  useEffect(() => {
    if (isDrawConfirmed && drawStatus === 'drawing') {
      setDrawStatus('success');
      refetchHistory();
      setTimeout(() => setDrawStatus('idle'), 3000);
    }
  }, [isDrawConfirmed, drawStatus, refetchHistory]);

  useEffect(() => {
    if (drawError && drawStatus === 'drawing') {
      setDrawStatus('error');
      setTimeout(() => setDrawStatus('idle'), 5000);
    }
  }, [drawError, drawStatus]);

  return (
    <div className="lottery-page">
      {/* Band 1: Header row - tagline */}
      <section className="page-header-section">
        <div className="page-header-content">
          <p className="page-tagline">
            Hodl MONSTR, win daily prizes, no loss lottery.
          </p>
        </div>
      </section>

      {/* Band 2: Two columns - Your status vs Today's lottery */}
      <section className="lottery-cards-section">
        <div className="page-header-content">
          <div className="hero-content-grid">
          {/* Left: Your ticket card */}
          <div className="your-lottery-card">
            <h2 className="card-section-title">Your daily ticket</h2>

            {address ? (
              <>
                <div className="lottery-info-rows">
                  <div className="info-row">
                    <span className="info-label">Your MONSTR balance</span>
                    <span className="info-value">
                      <DisplayFormattedNumber num={userBalance} significant={3} /> MONSTR
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">
                      Share of qualifiable supply
                      <span className="info-tooltip" data-tooltip="Contract balances don't count toward lottery eligibility">i</span>
                    </span>
                    <span className="info-value">
                      <DisplayFormattedNumber num={sharePercent} significant={3} />%
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Estimated odds today</span>
                    <span className="info-value">
                      {sharePercent > 0 ? `~1 in ${Math.round(100 / sharePercent)}` : '0'}
                    </span>
                  </div>
                </div>

                <p className="lottery-explainer-text">
                  You stay entered as long as you hold MONSTR. Snapshots are taken once per day.
                </p>
              </>
            ) : (
              <div className="connect-prompt">
                <p className="connect-text">Connect your wallet to see your lottery status and odds.</p>
                <button className="connect-btn-lottery" onClick={openConnectModal}>
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Right: Today's lottery card */}
          <div className="today-draw-card">
            <h2 className="card-section-title">Today's lottery</h2>

            <div className="today-pool-display">
              <span className="pool-label">Today's pool</span>
              <span className="pool-amount">
                <span className="pool-value"><DisplayFormattedNumber num={currentPool} significant={3} /> <img src="/coins/monstr-logo.png" alt="MONSTR" className="pool-icon" /><span className="pool-symbol">MONSTR</span></span>
              </span>
            </div>

            {needsLotteryExecution && (
              <div className="draw-pending-section">
                <p className="draw-pending-text">
                  Day {pendingDrawDay}'s draw is ready. Anyone can trigger it to select a winner.
                </p>
                <button
                  className="draw-winner-btn"
                  onClick={handleDrawWinner}
                  disabled={isDrawConfirming || drawStatus === 'drawing'}
                >
                  {isDrawConfirming || drawStatus === 'drawing'
                    ? 'Drawing...'
                    : drawStatus === 'success'
                    ? 'Winner drawn!'
                    : drawStatus === 'error'
                    ? 'Try again'
                    : 'Draw winner'}
                </button>
              </div>
            )}

            <div className="countdown-display">
              <span className="countdown-label">Next draw in</span>
              <span className="countdown-value">{isLoading ? '...' : timeRemaining}</span>
              <div className="countdown-progress">
                <div className="countdown-progress-bar" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Band 3: History - Last 7 draws */}
      <section className="explainer-section lottery-history">
        <div className="explainer-content">
          <div className="history-header">
            <h2 className="section-title">Last 7 draws</h2>
          </div>

          <div className="history-table-card">
            <div className="history-table">
              <div className="table-header">
                <span className="th-day">Day</span>
                <span className="th-winner">Winner</span>
                <span className="th-prize">Prize</span>
                <span className="th-status">Status</span>
              </div>
              {historyLoading && lotteryHistory.length === 0 ? (
                <div className="empty-history-row">
                  <p>Loading lottery history...</p>
                </div>
              ) : lotteryHistory.length > 0 ? (
                lotteryHistory.map((entry) => (
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
                    <span className="td-prize">
                      <DisplayFormattedNumber num={entry.amount} significant={3} /> MONSTR
                    </span>
                    <span className={`td-status status-${entry.status}`}>
                      {entry.status === 'claimed' ? (
                        '✓ Claimed'
                      ) : entry.status === 'expired' ? (
                        '⚠ Expired'
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
                            : claimStatus === 'error'
                            ? 'Try again'
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
                  <p>No lottery history yet. The first draw will happen after day 0.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Band 4: How it works - Lottery specific */}
      <section className="explainer-section">
        <div className="explainer-content">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
            <div className="step-card" tabIndex="0">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Fees accumulate</h3>
                <p className="step-description">
                  1% transfer fee is collected in the fees pool.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Daily snapshot</h3>
                <p className="step-description">
                  Once per day, holder balances are snapshotted.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Random winner</h3>
                <p className="step-description">
                  One holder is chosen at random, weighted by balance.
                </p>
              </div>
            </div>
            <div className="step-card" tabIndex="0">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Claim within 7 days</h3>
                <p className="step-description">
                  After 7 days, unclaimed prizes roll to the treasury.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
