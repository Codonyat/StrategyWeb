import { useState } from 'react';
import { Link } from 'react-router-dom';
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
            100% backed by MON, withdraw anytime, up-only price.
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
                >
                  <span className="action-line">Deposit MON</span>
                  <span className="action-line">Mint MONSTR</span>
                </button>
                <button
                  className="action-btn withdraw-btn"
                  onMouseEnter={handleWithdrawHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <span className="action-line">Burn MONSTR</span>
                  <span className="action-line">Withdraw MON</span>
                </button>
              </div>
              </div>
            </div>

            {/* Right Side - Recent Transactions */}
            <div className="hero-right">
            <div className="transactions-list">
              {/* Mock data - replace with real contract data */}
              <div className="transaction-row mint">
                <span className="tx-indicator"></span>
                <span className="tx-type">MINT</span>
                <span className="tx-address">0x1a2b...3c4d</span>
                <span className="tx-time">2 min ago</span>
                <span className="tx-amount">+1,250 MONSTR</span>
              </div>

              <div className="transaction-row burn">
                <span className="tx-indicator"></span>
                <span className="tx-type">BURN</span>
                <span className="tx-address">0x5e6f...7g8h</span>
                <span className="tx-time">5 min ago</span>
                <span className="tx-amount">-800 MONSTR</span>
              </div>

              <div className="transaction-row mint">
                <span className="tx-indicator"></span>
                <span className="tx-type">MINT</span>
                <span className="tx-address">0x9i0j...1k2l</span>
                <span className="tx-time">12 min ago</span>
                <span className="tx-amount">+3,500 MONSTR</span>
              </div>

              <div className="transaction-row burn">
                <span className="tx-indicator"></span>
                <span className="tx-type">BURN</span>
                <span className="tx-address">0x3m4n...5o6p</span>
                <span className="tx-time">18 min ago</span>
                <span className="tx-amount">-2,100 MONSTR</span>
              </div>

              <div className="transaction-row mint fade">
                <span className="tx-indicator"></span>
                <span className="tx-type">MINT</span>
                <span className="tx-address">0x7q8r...9s0t</span>
                <span className="tx-time">25 min ago</span>
                <span className="tx-amount">+950 MONSTR</span>
              </div>

              <div className="transaction-row burn fade">
                <span className="tx-indicator"></span>
                <span className="tx-type">BURN</span>
                <span className="tx-address">0x4u5v...6w7x</span>
                <span className="tx-time">32 min ago</span>
                <span className="tx-amount">-1,800 MONSTR</span>
              </div>

              <div className="transaction-row mint fade">
                <span className="tx-indicator"></span>
                <span className="tx-type">MINT</span>
                <span className="tx-address">0x8y9z...0a1b</span>
                <span className="tx-time">45 min ago</span>
                <span className="tx-amount">+2,400 MONSTR</span>
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
              <h3 className="step-title">Withdraw MON anytime</h3>
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
