import { useState } from 'react';
import { theme, CONTRACT_ADDRESS } from '../config/contract';
import './Footer.css';

export function Footer() {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">Strategy Coin</h3>
          <p className="footer-description">
            100% backed by {theme.nativeCoin.symbol}, withdraw anytime, and as fees accumulate the guaranteed floor price rises.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Contract</h4>
          <div className="contract-address">
            <span className="address-text">{shortenAddress(CONTRACT_ADDRESS)}</span>
            <button
              onClick={copyAddress}
              className="copy-button"
              aria-label="Copy contract address"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Links</h4>
          <div className="footer-links">
            {theme.links.docs && (
              <a href={theme.links.docs} target="_blank" rel="noopener noreferrer" className="footer-link">
                Docs
              </a>
            )}
            {theme.links.repository && (
              <a href={theme.links.repository} target="_blank" rel="noopener noreferrer" className="footer-link">
                Code
              </a>
            )}
            {theme.links.twitter && (
              <a href={theme.links.twitter} target="_blank" rel="noopener noreferrer" className="footer-link">
                Twitter
              </a>
            )}
            {theme.links.discord && (
              <a href={theme.links.discord} target="_blank" rel="noopener noreferrer" className="footer-link">
                Discord
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="footer-disclaimer">
        <p>
          High risk investment. Smart contracts are unaudited. Do your own research.
        </p>
      </div>
    </footer>
  );
}
