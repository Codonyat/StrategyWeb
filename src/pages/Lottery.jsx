import { useWallet } from '../hooks/useWallet';
import './Lottery.css';

export default function Lottery() {
  const { isConnected } = useWallet();

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

  const lotteryHistory = [
    { round: 155, winner: '0x1234...5678', prize: '10.2' },
    { round: 154, winner: '0xabcd...ef01', prize: '8.9' },
    { round: 153, winner: '0x9876...4321', prize: '11.5' },
    { round: 152, winner: '0xdef0...1234', prize: '9.3' },
  ];

  const summaryMetrics = {
    totalPaidOut: '1,245.8',
    completedRounds: 155,
    largestPrize: '25.4',
  };

  return (
    <div className="lottery-page">
      <div className="page-container">
        {/* Page Header */}
        <section className="page-header">
          <div className="header-top">
            <h1 className="page-title">Lottery</h1>
            <span className="round-badge">Round {lotteryData.currentRound}</span>
          </div>
          <p className="page-subtitle">
            Token holders are automatically entered based on their balance
          </p>
        </section>

        {/* Lottery Status Card */}
        <section className="lottery-status">
          <div className="status-card">
            <div className="timers-row">
              <div className="timer-block">
                <div className="timer-value">{lotteryData.snapshotIn}</div>
                <div className="timer-label">Snapshot in</div>
              </div>
              <div className="timer-block">
                <div className="timer-value">{lotteryData.drawIn}</div>
                <div className="timer-label">Draw in</div>
              </div>
            </div>

            <div className="prize-info">
              <div className="prize-label">Current prize pool</div>
              <div className="prize-value">
                {lotteryData.prizePool} MON
              </div>
              <div className="prize-note">Funded by protocol fees</div>
            </div>
          </div>
        </section>

        {/* User Panel */}
        {isConnected ? (
          <section className="user-panel">
            {lotteryData.hasUnclaimedPrizes && (
              <div className="unclaimed-alert">
                <div className="alert-content">
                  <span className="alert-icon">🎉</span>
                  <div>
                    <div className="alert-title">You have unclaimed prizes!</div>
                    <div className="alert-amount">
                      {lotteryData.unclaimedAmount} MON
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary">Claim prize</button>
              </div>
            )}

            <div className="user-stats-grid">
              <div className="user-stat">
                <div className="stat-label">Your MONSTR balance</div>
                <div className="stat-value">
                  {lotteryData.userBalance} MONSTR
                </div>
              </div>
              <div className="user-stat">
                <div className="stat-label">Your lottery weight</div>
                <div className="stat-value">{lotteryData.userWeight}</div>
                <div className="stat-note">{lotteryData.weightPercent}% of total</div>
              </div>
              <div className="user-stat">
                <div className="stat-label">Estimated odds</div>
                <div className="stat-value">{lotteryData.estimatedOdds}</div>
                <div className="stat-note">Approximately</div>
              </div>
            </div>
          </section>
        ) : (
          <section className="connect-section">
            <p>Connect wallet to see your weight and any winnings</p>
          </section>
        )}

        {/* Summary Metrics */}
        <section className="summary-metrics">
          <div className="metric-card">
            <div className="metric-value">{summaryMetrics.totalPaidOut} MON</div>
            <div className="metric-label">Total prizes paid out</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{summaryMetrics.completedRounds}</div>
            <div className="metric-label">Completed rounds</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{summaryMetrics.largestPrize} MON</div>
            <div className="metric-label">Largest single prize</div>
          </div>
        </section>

        {/* Lottery History */}
        <section className="lottery-history">
          <h2 className="section-title">Previous Winners</h2>
          <div className="history-table">
            <div className="table-header">
              <span>Round</span>
              <span>Winner</span>
              <span>Prize</span>
            </div>
            {lotteryHistory.map((entry) => (
              <div key={entry.round} className="table-row">
                <span>#{entry.round}</span>
                <span className="mono">{entry.winner}</span>
                <span>
                  {entry.prize} MON
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
