import { useState } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
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
            100% backed by MON, withdraw anytime, up-only floor price.
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
            {CONTRACT_CONFIG.links.docs !== '#' && (
              <a href={CONTRACT_CONFIG.links.docs} target="_blank" rel="noopener noreferrer" className="footer-link">
                Docs
              </a>
            )}
            {CONTRACT_CONFIG.links.repository !== '#' && (
              <a href={CONTRACT_CONFIG.links.repository} target="_blank" rel="noopener noreferrer" className="footer-link">
                Code
              </a>
            )}
            {CONTRACT_CONFIG.links.twitter !== '#' && (
              <a href={CONTRACT_CONFIG.links.twitter} target="_blank" rel="noopener noreferrer" className="footer-link">
                Twitter
              </a>
            )}
            {CONTRACT_CONFIG.links.discord !== '#' && (
              <a href={CONTRACT_CONFIG.links.discord} target="_blank" rel="noopener noreferrer" className="footer-link">
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
