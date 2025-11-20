import { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../config/contract';
import './Landing.css';

export default function Landing() {
  const [showStrategy, setShowStrategy] = useState(false);
  const [hoverState, setHoverState] = useState(null); // 'deposit', 'withdraw', or null
  const [animationTimeout, setAnimationTimeout] = useState(null);

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
      <section className="hero-section">
        <div className="hero-wrapper">
          <p className="hero-subtitle">
            100% backed by {theme.nativeCoin.symbol}, withdraw anytime, up-only price.
          </p>

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
                    src={theme.nativeCoin.logo}
                    alt={theme.nativeCoin.name}
                    className="coin-image"
                  />
                </div>
                <div className="coin-face coin-strategy">
                  <img
                    src={theme.strategyCoin.logo}
                    alt={theme.strategyCoin.name}
                    className="coin-image"
                  />
                </div>
              </div>

              <div className="coin-actions">
                <button
                  className="action-btn deposit-btn"
                  onMouseEnter={handleDepositHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <span className="action-line">Deposit {theme.nativeCoin.symbol}</span>
                  <span className="action-line">Mint {theme.strategyCoin.symbol}</span>
                </button>
                <button
                  className="action-btn withdraw-btn"
                  onMouseEnter={handleWithdrawHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <span className="action-line">Burn {theme.strategyCoin.symbol}</span>
                  <span className="action-line">Withdraw {theme.nativeCoin.symbol}</span>
                </button>
              </div>
              </div>
            </div>

            {/* Right Side - Recent Transactions */}
            <div className="hero-right">
            <h3 className="transactions-title">Recent Activity</h3>
            <div className="transactions-list">
              {/* Mock data - replace with real contract data */}
              <div className="transaction-item mint">
                <div className="tx-header">
                  <span className="tx-type">Mint</span>
                  <span className="tx-time">2 min ago</span>
                </div>
                <div className="tx-details">
                  <span className="tx-address">0x1a2b...3c4d</span>
                  <span className="tx-amount">+1,250 {theme.strategyCoin.symbol}</span>
                </div>
              </div>

              <div className="transaction-item burn">
                <div className="tx-header">
                  <span className="tx-type">Burn</span>
                  <span className="tx-time">5 min ago</span>
                </div>
                <div className="tx-details">
                  <span className="tx-address">0x5e6f...7g8h</span>
                  <span className="tx-amount">-800 {theme.strategyCoin.symbol}</span>
                </div>
              </div>

              <div className="transaction-item mint">
                <div className="tx-header">
                  <span className="tx-type">Mint</span>
                  <span className="tx-time">12 min ago</span>
                </div>
                <div className="tx-details">
                  <span className="tx-address">0x9i0j...1k2l</span>
                  <span className="tx-amount">+3,500 {theme.strategyCoin.symbol}</span>
                </div>
              </div>

              <div className="transaction-item burn">
                <div className="tx-header">
                  <span className="tx-type">Burn</span>
                  <span className="tx-time">18 min ago</span>
                </div>
                <div className="tx-details">
                  <span className="tx-address">0x3m4n...5o6p</span>
                  <span className="tx-amount">-2,100 {theme.strategyCoin.symbol}</span>
                </div>
              </div>

              <div className="transaction-item mint">
                <div className="tx-header">
                  <span className="tx-type">Mint</span>
                  <span className="tx-time">25 min ago</span>
                </div>
                <div className="tx-details">
                  <span className="tx-address">0x7q8r...9s0t</span>
                  <span className="tx-amount">+950 {theme.strategyCoin.symbol}</span>
                </div>
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
              <h3 className="step-title">Deposit {theme.nativeCoin.symbol} to mint</h3>
              <p className="step-description">
                <strong>Mint {theme.strategyCoin.symbol}</strong> 1:1 during first 3 days
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">Backing increases daily</h3>
              <p className="step-description">
                1% <strong>fee</strong> on transfers grows <strong>backing</strong> over time
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
              <h3 className="step-title">Withdraw {theme.nativeCoin.symbol} anytime</h3>
              <p className="step-description">
                <strong>Withdraw</strong> by burning tokens at backing ratio
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
