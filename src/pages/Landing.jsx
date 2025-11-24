import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatEther, parseAbi } from 'viem';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { MintModal } from '../components/MintModal';
import { BurnModal } from '../components/BurnModal';
import { useRealtimeTransactions } from '../hooks/useRealtimeTransactions';
import { DisplayFormattedNumber } from '../components/DisplayFormattedNumber';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
import './Landing.css';

// Simple ABI for balanceOf
const parsedAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);

export default function Landing() {
  const { address } = useAccount();
  const [showStrategy, setShowStrategy] = useState(false);
  const [hoverState, setHoverState] = useState(null); // 'deposit', 'withdraw', or null
  const [animationTimeout, setAnimationTimeout] = useState(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);

  // Fetch user balances
  // Get MON balance (native token)
  const { data: monBalance } = useBalance({
    address,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  // Get MONSTR balance
  const { data: monstrBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
      refetchInterval: 10000,
    },
  });

  // Format balances
  const monValue = monBalance ? parseFloat(formatEther(monBalance.value)) : 0;
  const monstrValue = monstrBalance ? parseFloat(formatEther(monstrBalance)) : 0;

  // Fetch recent transactions via WebSocket (real-time) or fallback to loading state
  const { transactions, loading: txLoading, connected } = useRealtimeTransactions(10);

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - parseInt(timestamp);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Helper function to truncate address
  const truncateAddress = (address) => {
    if (!address) return '0x0000...0000';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCoinClick = () => {
    setShowStrategy(!showStrategy);
  };

  const handleDepositHover = () => {
    // Clear any ongoing animation
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      setAnimationTimeout(null);
    }

    // Only animate if not already showing MONSTR or if currently animating
    if (!showStrategy || hoverState === 'withdraw') {
      setHoverState('deposit');
      // After animation completes, update the permanent state
      const timeout = setTimeout(() => {
        setShowStrategy(true);
        setHoverState(null);
        setAnimationTimeout(null);
      }, 1200);
      setAnimationTimeout(timeout);
    }
  };

  const handleWithdrawHover = () => {
    // Clear any ongoing animation
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      setAnimationTimeout(null);
    }

    // Only animate if not already showing MON or if currently animating
    if (showStrategy || hoverState === 'deposit') {
      setHoverState('withdraw');
      // After animation completes, update the permanent state
      const timeout = setTimeout(() => {
        setShowStrategy(false);
        setHoverState(null);
        setAnimationTimeout(null);
      }, 1200);
      setAnimationTimeout(timeout);
    }
  };

  const handleButtonLeave = () => {
    // Don't reset on leave - let the animation complete
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section page-header-section">
        <div className="hero-wrapper page-header-content">
          <p className="page-tagline">
            100% backed by MON, withdraw anytime, up-only price.
          </p>

          {/* Balance Strip - Only show if wallet connected */}
          {address && (
            <div className="balances-strip">
              <span className="balances-label">Your balances:</span>
              <div className="balance-item">
                <img src="/coins/mon-logo.png" alt="MON" className="balance-icon" />
                <span className="balance-value"><DisplayFormattedNumber num={monValue} significant={3} /> MON</span>
              </div>
              <span className="balance-separator">·</span>
              <div className="balance-item">
                <img src="/coins/monstr-logo.png" alt="MONSTR" className="balance-icon" />
                <span className="balance-value"><DisplayFormattedNumber num={monstrValue} significant={3} /> MONSTR</span>
              </div>
            </div>
          )}

          <div className="hero-content-grid">
            {/* Left Side - Coin Flip */}
            <div className="hero-left">
              <div className="coin-area">
              <div
                className={`coin-container ${showStrategy ? 'flipped' : ''} ${hoverState === 'deposit' ? 'hover-deposit' : ''} ${hoverState === 'withdraw' ? 'hover-withdraw' : ''}`}
                onClick={handleCoinClick}
              >
                <div className="coin-face coin-native">
                  <img
                    src={"/coins/mon.png"}
                    alt={"MON"}
                    className="coin-image"
                  />
                </div>
                <div className="coin-face coin-strategy">
                  <img
                    src={"/coins/monstr.png"}
                    alt={"MONSTR"}
                    className="coin-image"
                  />
                </div>
              </div>

              <div className="coin-actions">
                <button
                  className="action-btn deposit-btn"
                  onMouseEnter={handleDepositHover}
                  onMouseLeave={handleButtonLeave}
                  onClick={() => setIsMintModalOpen(true)}
                >
                  <span className="action-line">Deposit MON</span>
                  <span className="action-line">Mint MONSTR</span>
                </button>
                <button
                  className="action-btn withdraw-btn"
                  onMouseEnter={handleWithdrawHover}
                  onMouseLeave={handleButtonLeave}
                  onClick={() => setIsBurnModalOpen(true)}
                >
                  <span className="action-line">Burn MONSTR</span>
                  <span className="action-line">Withdraw MON</span>
                </button>
              </div>
              </div>
            </div>

            {/* Right Side - Recent Transactions */}
            <div className="hero-right">
            <div className="transactions-wrapper">
              {connected && <div className="live-indicator"><span className="live-dot"></span>LIVE</div>}
              <div className="transactions-list">
              {txLoading && transactions.length === 0 ? (
                <div className="transaction-row">
                  <span className="tx-type">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="transaction-row">
                  <span className="tx-type">No recent transactions</span>
                </div>
              ) : (
                (() => {
                  // Expand transactions to include fee entries for mints/burns
                  const expandedTransactions = [];
                  transactions.forEach(tx => {
                    // Add the main transaction
                    expandedTransactions.push(tx);

                    // Add fee transaction if it has a fee and is a mint (burns already have fee tx from subgraph)
                    const type = tx.type.toLowerCase();
                    if (type === 'mint' && tx.fee && BigInt(tx.fee) > 0) {
                      // Create a synthetic fee transaction
                      expandedTransactions.push({
                        ...tx,
                        id: `${tx.id}-fee`,
                        type: 'TRANSFER',
                        stratAmount: tx.fee, // Fee amount in MONSTR
                        isSyntheticFee: true,
                      });
                    }
                  });

                  return expandedTransactions.slice(0, 7).map((tx, index) => {
                    const isFaded = index >= 4;
                    const isDesktopOnly = index >= 5;
                    const type = tx.type.toLowerCase();
                    // Map transaction types for display
                    const displayType = type === 'redeem' ? 'burn' :
                                       type === 'transfer' ? 'fee' : type;
                    const formattedAmount = formatEther(BigInt(tx.stratAmount));
                    const sign = type === 'mint' ? '+' :
                                type === 'transfer' ? '' : '-';

                    return (
                      <div
                        key={tx.id}
                        className={`transaction-row ${displayType} ${isFaded ? 'fade' : ''} ${isDesktopOnly ? 'desktop-only' : ''} ${tx.isNew ? 'new' : ''}`}
                      >
                        <span className="tx-indicator"></span>
                        <span className="tx-type">{displayType.toUpperCase()}</span>
                        <a
                          href={`${CONTRACT_CONFIG.explorerUrl}/address/${tx.user}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-address"
                        >
                          {truncateAddress(tx.user)}
                        </a>
                        <span className="tx-time">{formatTimeAgo(tx.timestamp)}</span>
                        <span className="tx-amount">{sign}<DisplayFormattedNumber num={formattedAmount} significant={3} /> MONSTR</span>
                      </div>
                    );
                  });
                })()
              )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Mini Explainer Section */}
      <section className="explainer-section">
        <div className="explainer-content">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
          <div className="step-card" tabIndex="0">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3 className="step-title">Deposit MON to mint</h3>
              <p className="step-description">
                <strong>Mint MONSTR</strong> 1:1 during first 3 days
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">Supply fixed after 3 days</h3>
              <p className="step-description">
                After 3 days, supply is locked and <strong>backing grows</strong> from fees
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3 className="step-title">No-loss lottery daily</h3>
              <p className="step-description">
                Daily <strong>lottery</strong> raffle of fees to random holders
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3 className="step-title">Withdraw MON anytime</h3>
              <p className="step-description">
                <strong>Withdraw</strong> by burning tokens at backing ratio
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Modals */}
      <MintModal isOpen={isMintModalOpen} onClose={() => setIsMintModalOpen(false)} />
      <BurnModal isOpen={isBurnModalOpen} onClose={() => setIsBurnModalOpen(false)} />
    </div>
  );
}
