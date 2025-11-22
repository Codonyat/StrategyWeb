import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { StatusChip } from '../components/StatusChip';
import { DisplayFormattedNumber } from '../components/DisplayFormattedNumber';
import { useLotteryData } from '../hooks/useLotteryData';
import { useLotteryPrizeHistory } from '../hooks/useLotteryPrizeHistory';
import { useLotteryCountdown } from '../hooks/useLotteryCountdown';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { CONTRACT_ADDRESS } from '../config/contract';
import { STRATEGY_ABI } from '../config/abi';
import './Lottery.css';

export default function Lottery() {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [claimStatus, setClaimStatus] = useState('idle'); // idle, claiming, success, error

  const {
    currentPool,
    userBalance,
    totalWeight,
    sharePercent,
    userClaimable,
    hasUnclaimedPrizes,
    isLoading,
  } = useLotteryData();

  // Get lottery prize history from subgraph (with claim status)
  const { lotteryHistory, loading: historyLoading } = useLotteryPrizeHistory(7, 30000);

  const { timeRemaining } = useLotteryCountdown();
  const { isMintingPeriod } = useProtocolStats();

  // Get last lottery day from history
  const lastLotteryDay = lotteryHistory.length > 0 ? lotteryHistory[0].day : 0;

  // Get last winner from history
  const lastWinner = lotteryHistory.length > 0 ? lotteryHistory[0] : null;

  // Calculate total unclaimed in the 7-day ring
  const totalUnclaimed = lotteryHistory.reduce((sum, entry) => sum + entry.amount, 0);

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

  return (
    <div className="lottery-page">
      {/* Band 1: Header row - tagline + key stats */}
      <section className="lottery-header-section">
        <div className="lottery-header-content">
          <p className="page-tagline">
            Hodl MONSTR, win daily prizes, zero risk.
          </p>
          <div className="lottery-title-row">
            <div className="lottery-stats-chips">
              <StatusChip
                label="Next draw"
                value={isLoading ? '...' : timeRemaining}
                type="active"
                tooltip="Time until next lottery draw can be executed"
              />
              <StatusChip
                label="Pool"
                value={
                  isLoading ? '...' : (
                    <>
                      <DisplayFormattedNumber num={currentPool} significant={3} /> MONSTR
                    </>
                  )
                }
                type="default"
                tooltip={
                  isMintingPeriod
                    ? "Lottery's prize pool from accumulated fees (100% of fees during minting period)"
                    : "Lottery's prize pool from accumulated fees (50% of fees, other 50% goes to auction)"
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Band 2: Two columns - Your status vs Today's draw */}
      <section className="lottery-two-column-section">
        <div className="lottery-two-column-content">
          {/* Left: Your lottery card */}
          <div className="your-lottery-card">
            <h2 className="card-section-title">Your lottery</h2>

            {address ? (
              <>
                <div className="lottery-info-rows">
                  <div className="info-row">
                    <span className="info-label">Your MONSTR balance</span>
                    <span className="info-value">
                      <DisplayFormattedNumber num={userBalance} significant={4} /> MONSTR
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Share of holders</span>
                    <span className="info-value">
                      <DisplayFormattedNumber num={sharePercent} significant={2} />%
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Estimated odds today</span>
                    <span className="info-value">
                      {sharePercent > 0 ? `~1 in ${Math.round(100 / sharePercent)}` : 'N/A'}
                    </span>
                  </div>
                  {hasUnclaimedPrizes && (
                    <div className="info-row highlight-row">
                      <span className="info-label">Unclaimed prizes</span>
                      <span className="info-value highlight-value">
                        <DisplayFormattedNumber num={userClaimable} significant={4} /> MONSTR
                      </span>
                    </div>
                  )}
                </div>

                <p className="lottery-explainer-text">
                  You stay entered as long as you hold MONSTR. Snapshots are taken once per day.
                </p>

                {hasUnclaimedPrizes && (
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
                      : 'Claim now'}
                  </button>
                )}
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

          {/* Right: Today's draw card */}
          <div className="today-draw-card">
            <h2 className="card-section-title">Today's draw</h2>

            <div className="today-pool-display">
              <span className="pool-label">Today's pool</span>
              <span className="pool-amount">
                <DisplayFormattedNumber num={currentPool} significant={4} /> MONSTR
              </span>
            </div>

            <div className="countdown-display">
              <span className="countdown-label">Next draw in</span>
              <span className="countdown-value">{isLoading ? '...' : timeRemaining}</span>
              <div className="countdown-progress">
                <div className="countdown-progress-bar" style={{ width: '65%' }}></div>
              </div>
            </div>

            <p className="draw-explainer-text">
              Fees from transfers fill the pool. Snapshot taken at end of day, winner chosen from holders.
            </p>

            <p className="last-executed-text">Last executed: day {lastLotteryDay}</p>
          </div>
        </div>
      </section>

      {/* Band 3: History - Last 7 draws */}
      <section className="lottery-history-section">
        <div className="lottery-history-content">
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
                      {entry.winner.slice(0, 6)}...{entry.winner.slice(-4)}
                      {entry.isUserWinner && <span className="you-badge">You</span>}
                    </span>
                    <span className="td-prize">
                      <DisplayFormattedNumber num={entry.amount} significant={3} /> MONSTR
                    </span>
                    <span className={`td-status status-${entry.status}`}>
                      {entry.status === 'claimed' ? '✓ Claimed' : entry.status === 'expired' ? '⚠ Expired' : 'Unclaimed'}
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
      <section className="lottery-explainer-section">
        <div className="lottery-explainer-content">
          <h2 className="section-title">How it works</h2>
          <div className="lottery-steps-grid">
            <div className="step-card" tabIndex="0">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Fees accumulate</h3>
                <p className="step-description">
                  1 percent transfer fee is collected in the fees pool.
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
                  Winner can claim from the lottery pool. After 7 days, unclaimed prizes roll to the treasury.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
