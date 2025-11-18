import { useState } from 'react';
import { theme } from '../config/contract';
import './HowItWorks.css';

export default function HowItWorks() {
  const [openSection, setOpenSection] = useState('strategy');

  const toggleSection = (sectionId) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const sections = [
    {
      id: 'strategy',
      title: `${theme.strategyCoin.symbol} and ${theme.nativeCoin.symbol}`,
      content: (
        <div className="section-content">
          <p>
            <strong>{theme.strategyCoin.symbol}</strong> is a Strategy Coin backed by{' '}
            <strong>{theme.nativeCoin.symbol}</strong>, the native currency of the Monad blockchain.
          </p>
          <p>
            Every {theme.strategyCoin.symbol} token is backed by a proportional amount of{' '}
            {theme.nativeCoin.symbol} held in the smart contract. This creates a price floor -
            the minimum value each token can be redeemed for.
          </p>
          <ul>
            <li>
              Users deposit {theme.nativeCoin.symbol} to mint {theme.strategyCoin.symbol}
            </li>
            <li>
              During the first 24 hours: 1 {theme.nativeCoin.symbol} = 1{' '}
              {theme.strategyCoin.symbol}
            </li>
            <li>After minting period: proportional to backing ratio</li>
            <li>All operations have a 1% fee that funds the lottery and auction systems</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'backing',
      title: 'Backing and Floor Price',
      content: (
        <div className="section-content">
          <p>
            The backing mechanism ensures every {theme.strategyCoin.symbol} token has intrinsic
            value.
          </p>
          <h4>How it works:</h4>
          <ol>
            <li>
              Users deposit {theme.nativeCoin.symbol} into the smart contract
            </li>
            <li>
              {theme.strategyCoin.symbol} tokens are minted proportionally
            </li>
            <li>
              The contract calculates backing per token: Total {theme.nativeCoin.symbol} ÷ Total{' '}
              {theme.strategyCoin.symbol}
            </li>
            <li>
              Users can burn {theme.strategyCoin.symbol} anytime to redeem their share of backing
            </li>
          </ol>
          <p className="highlight">
            This creates a guaranteed floor price - you can always redeem your tokens for their
            proportional share of the backing pool.
          </p>
        </div>
      ),
    },
    {
      id: 'auctions',
      title: 'Daily Auctions',
      content: (
        <div className="section-content">
          <p>
            After the initial 24-hour minting period ends, daily auctions begin. These auctions
            distribute 50% of the daily fees collected by the protocol.
          </p>
          <h4>Auction mechanics:</h4>
          <ul>
            <li>
              Auctions run every 25 hours (to rotate timing across different timezones)
            </li>
            <li>
              Bidders use {theme.wrappedCoin.symbol} (wrapped {theme.nativeCoin.symbol}) to prevent DoS attacks
            </li>
            <li>Minimum bid: 50% of redemption value</li>
            <li>Each new bid must be 10% higher than the previous bid</li>
            <li>Previous bidders receive instant {theme.wrappedCoin.symbol} refunds</li>
            <li>
              Winner receives {theme.strategyCoin.symbol} tokens funded by the auction pool
            </li>
          </ul>
          <p>
            Auctions must wait 1 minute into the new period before execution to ensure fair
            participation.
          </p>
        </div>
      ),
    },
    {
      id: 'lottery',
      title: 'Lottery System',
      content: (
        <div className="section-content">
          <p>
            The lottery system automatically enters all token holders based on their balance. No
            manual entry required!
          </p>
          <h4>How the lottery works:</h4>
          <ul>
            <li>
              Runs every 25 hours (pseudo-day) to rotate timing
            </li>
            <li>
              During minting period: lottery receives 100% of fees
            </li>
            <li>
              After minting period: lottery receives 50% of fees
            </li>
            <li>
              Winner selection is weighted by token balance (more tokens = better odds)
            </li>
            <li>
              Uses prevrandao for random selection
            </li>
            <li>
              Winners can claim prizes by calling the claim() function
            </li>
          </ul>
          <h4>Prize claiming:</h4>
          <p>
            Unclaimed prizes are stored in a 7-slot rolling array. If a prize remains unclaimed
            after 7 days, it's sent to the treasury beneficiary address.
          </p>
        </div>
      ),
    },
    {
      id: 'fees',
      title: 'Fee Structure',
      content: (
        <div className="section-content">
          <p>
            A 1% fee is applied to all minting, burning, and transfer operations. These fees fund
            the lottery and auction systems.
          </p>
          <h4>Fee distribution:</h4>
          <table className="fee-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Lottery</th>
                <th>Auction</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>During minting period (first 24 hours)</td>
                <td>100%</td>
                <td>0%</td>
              </tr>
              <tr>
                <td>After minting period</td>
                <td>50%</td>
                <td>50%</td>
              </tr>
            </tbody>
          </table>
          <h4>Fee-free minting:</h4>
          <p>
            Users can optionally lock community tokens to mint {theme.strategyCoin.symbol} without
            fees during the minting period. Requirements:
          </p>
          <ul>
            <li>Lock 100e12 community tokens</li>
            <li>Tokens locked for 30 days from deployment</li>
            <li>Only available during the 24-hour minting period</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'risks',
      title: 'Risks and Assumptions',
      content: (
        <div className="section-content">
          <p className="warning">
            <strong>⚠️ High Risk Investment</strong>
          </p>
          <ul className="risk-list">
            <li>
              <strong>Smart Contract Risk:</strong> The contract is unaudited and may contain
              bugs or vulnerabilities
            </li>
            <li>
              <strong>Market Risk:</strong> Token price can fall below backing value during
              periods of low liquidity
            </li>
            <li>
              <strong>Regulatory Risk:</strong> Token mechanics may face regulatory scrutiny
            </li>
            <li>
              <strong>Centralization Risk:</strong> Large holders can influence lottery odds and
              auction outcomes
            </li>
            <li>
              <strong>Technical Risk:</strong> Blockchain congestion can prevent timely prize
              claims or auction bids
            </li>
            <li>
              <strong>Liquidity Risk:</strong> No guarantee of secondary market liquidity
            </li>
          </ul>
          <p>
            <strong>Do your own research</strong> before participating. Never invest more than you
            can afford to lose.
          </p>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'FAQ',
      content: (
        <div className="section-content">
          <div className="faq-item">
            <h4>When can I mint tokens?</h4>
            <p>
              Minting is available during the first 24 hours after contract deployment at a 1:1
              ratio. After that, minting is proportional to the backing ratio.
            </p>
          </div>

          <div className="faq-item">
            <h4>Can I redeem my tokens anytime?</h4>
            <p>
              Yes! You can burn your {theme.strategyCoin.symbol} tokens anytime to receive your
              proportional share of the backing pool (minus the 1% fee).
            </p>
          </div>

          <div className="faq-item">
            <h4>How are lottery winners selected?</h4>
            <p>
              Winners are selected randomly using prevrandao, weighted by token balance. The
              selection uses a Fenwick tree (binary indexed tree) for efficient O(log n) winner
              selection.
            </p>
          </div>

          <div className="faq-item">
            <h4>What happens if I don't claim my prize?</h4>
            <p>
              Unclaimed prizes are stored for 7 days. After that, they're sent to the treasury
              beneficiary address.
            </p>
          </div>

          <div className="faq-item">
            <h4>Why use {theme.wrappedCoin.symbol} for auctions?</h4>
            <p>
              {theme.wrappedCoin.symbol} prevents DoS attacks from malicious bidders who could reject refunds and block
              the auction. With {theme.wrappedCoin.symbol}, refunds are instant and guaranteed.
            </p>
          </div>

          <div className="faq-item">
            <h4>What is the treasury address?</h4>
            <p>
              Treasury: <code>{theme.treasury}</code>
            </p>
            <p>Receives unclaimed prizes after 7 days.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="how-it-works-page">
      <div className="page-container">
        {/* Intro Section */}
        <section className="intro-section">
          <h1 className="page-title">How It Works</h1>
          <p className="intro-text">
            {theme.strategyCoin.symbol} is a Strategy Coin that combines{' '}
            {theme.nativeCoin.symbol} backing with daily auctions and lottery mechanics. The
            backing creates a guaranteed price floor, while auctions and lottery distribute
            protocol fees to participants.
          </p>
        </section>

        {/* Collapsible Sections */}
        <section className="collapsible-sections">
          {sections.map((section) => (
            <div key={section.id} className="collapsible-section">
              <button
                className={`section-header ${openSection === section.id ? 'open' : ''}`}
                onClick={() => toggleSection(section.id)}
              >
                <span className="section-title">{section.title}</span>
                <span className="section-icon">{openSection === section.id ? '−' : '+'}</span>
              </button>
              {openSection === section.id && (
                <div className="section-body">{section.content}</div>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
