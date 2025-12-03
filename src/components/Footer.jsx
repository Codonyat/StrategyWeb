import { useState } from 'react';
import { FileText, BookOpen, Github, Twitter, Send } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
import { DisclaimerModal } from './DisclaimerModal';
import './Footer.css';

export function Footer() {
  const [copied, setCopied] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
          <h4 className="footer-subtitle">About GIGA</h4>
          <p className="footer-description">
            100% backed by MEGA, withdraw anytime, up-only floor price. Designed for MegaETH.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Contract ({CONTRACT_CONFIG.chainName})</h4>
          <div className="contract-module">
            <div className="contract-address">
              <span className="address-text">{CONTRACT_ADDRESS}</span>
              <button
                onClick={copyAddress}
                className="copy-button"
                aria-label="Copy contract address"
                title="Copy address"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
            <a
              href={`${CONTRACT_CONFIG.explorerUrl}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Explorer →
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Links</h4>
          <div className="footer-links">
            <a href="/audit-report.pdf" target="_blank" rel="noopener noreferrer" className="footer-link">
              <FileText size={16} /> Audit Report
            </a>
            {CONTRACT_CONFIG.links.docs !== '#' && (
              <a href={CONTRACT_CONFIG.links.docs} target="_blank" rel="noopener noreferrer" className="footer-link">
                <BookOpen size={16} /> Docs
              </a>
            )}
            {CONTRACT_CONFIG.links.repository !== '#' && (
              <a href={CONTRACT_CONFIG.links.repository} target="_blank" rel="noopener noreferrer" className="footer-link">
                <Github size={16} /> Github
              </a>
            )}
            {CONTRACT_CONFIG.links.twitter !== '#' && (
              <a href={CONTRACT_CONFIG.links.twitter} target="_blank" rel="noopener noreferrer" className="footer-link">
                <Twitter size={16} /> Twitter
              </a>
            )}
            {CONTRACT_CONFIG.links.telegram !== '#' && (
              <a href={CONTRACT_CONFIG.links.telegram} target="_blank" rel="noopener noreferrer" className="footer-link">
                <Send size={16} /> Telegram
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="footer-disclaimer">
        <p>
          Contract audited for Ethereum, adapted for MegaETH. GIGA is not affiliated with MegaETH.
        </p>
        <p>
          <button onClick={() => setShowDisclaimer(true)} className="disclaimer-link">
            Legal Disclaimer & Terms of Use
          </button>
        </p>
        <p className="footer-copyright">
          © 2025 GIGA. All rights reserved.
        </p>
      </div>

      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </footer>
  );
}
