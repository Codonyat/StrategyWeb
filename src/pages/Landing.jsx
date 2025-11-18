import { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../config/contract';
import './Landing.css';

export default function Landing() {
  const [showStrategy, setShowStrategy] = useState(false);

  const handleCoinClick = () => {
    setShowStrategy(!showStrategy);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-wrapper">
          <p className="hero-subtitle">
            100% backed by {theme.nativeCoin.symbol}, withdraw anytime, and as fees accumulate the guaranteed floor price rises.
          </p>

          <div className="hero-content-grid">
            {/* Left Side - Coin Flip */}
            <div className="hero-left">
              <div className="coin-area">
              <div
                className={`coin-container ${showStrategy ? 'flipped' : ''}`}
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
                <button className="action-btn deposit-btn">
                  <span className="action-line">Deposit {theme.nativeCoin.symbol}</span>
                  <span className="action-line">Mint {theme.strategyCoin.symbol}</span>
                </button>
                <button className="action-btn withdraw-btn">
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
        <h2 className="section-title">How it works in 4 steps</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Deposit {theme.nativeCoin.symbol}</h3>
            <p className="step-description">
              Mint {theme.strategyCoin.symbol} by depositing {theme.nativeCoin.symbol} into the contract
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Join the auction</h3>
            <p className="step-description">
              Bid on daily auctions to win {theme.strategyCoin.symbol} tokens
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Build lottery weight</h3>
            <p className="step-description">
              Your token balance gives you weight in the daily lottery
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3 className="step-title">Backing creates a floor</h3>
            <p className="step-description">
              Redeem tokens anytime for your share of the backing pool
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats Strip */}
      <section className="quick-stats">
        <div className="stats-container">
          <div className="stat-card">
            <span className="stat-label">Backing per {theme.strategyCoin.symbol}</span>
            <span className="stat-value">0.000 {theme.nativeCoin.symbol}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total backing</span>
            <span className="stat-value">0 {theme.nativeCoin.symbol}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total supply</span>
            <span className="stat-value">0 {theme.strategyCoin.symbol}</span>
          </div>
        </div>
      </section>

      {/* Deep Link Buttons */}
      <section className="deep-links">
        <Link to="/stats" className="link-button">
          View stats →
        </Link>
        <Link to="/how-it-works" className="link-button">
          Read how it works →
        </Link>
      </section>
    </div>
  );
}
