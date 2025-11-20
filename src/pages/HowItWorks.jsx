import { useState } from 'react';
import { CONTRACT_CONFIG } from '../config/contract';
import './HowItWorks.css';

export default function HowItWorks() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (questionId) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  const faqs = [
    {
      id: 'what-is-monstr',
      question: 'What is MONSTR?',
      answer: (
        <>
          <p>
            MONSTR is a Strategy Coin backed by MON, the native currency of the Monad blockchain.
            Every MONSTR token is backed by a proportional amount of MON held in the smart contract,
            creating a guaranteed price floor.
          </p>
        </>
      ),
    },
    {
      id: 'when-mint',
      question: 'When can I mint tokens?',
      answer: (
        <>
          <p>
            Minting is available during the first 3 days after contract deployment at a 1:1 ratio
            (1 MON = 1 MONSTR). After that, minting continues but is proportional to the backing ratio.
          </p>
        </>
      ),
    },
    {
      id: 'redeem-anytime',
      question: 'Can I redeem my tokens anytime?',
      answer: (
        <>
          <p>
            Yes! You can burn your MONSTR tokens anytime to receive your proportional share of the
            backing pool. A 1% fee is applied on redemption.
          </p>
        </>
      ),
    },
    {
      id: 'backing-works',
      question: 'How does the backing mechanism work?',
      answer: (
        <>
          <p>
            The backing per token is calculated as: <strong>Total MON ÷ Total MONSTR</strong>
          </p>
          <p>
            This creates a guaranteed floor price - you can always redeem your tokens for their
            proportional share of the backing pool.
          </p>
        </>
      ),
    },
    {
      id: 'fees',
      question: 'What are the fees?',
      answer: (
        <>
          <p>
            A 1% fee is applied to all minting, burning, and transfer operations. These fees fund
            the lottery and auction systems.
          </p>
          <ul>
            <li>During minting period (first 3 days): lottery receives 100% of fees</li>
            <li>After minting period: lottery receives 50%, auction receives 50%</li>
          </ul>
        </>
      ),
    },
    {
      id: 'lottery',
      question: 'How does the lottery work?',
      answer: (
        <>
          <p>
            The lottery system automatically enters all token holders based on their balance. No manual
            entry required!
          </p>
          <ul>
            <li>Runs every 25 hours (pseudo-day) to rotate timing across timezones</li>
            <li>Winner selection is weighted by token balance (more tokens = better odds)</li>
            <li>Uses prevrandao for random selection</li>
            <li>Winners claim prizes by calling the claim() function</li>
          </ul>
        </>
      ),
    },
    {
      id: 'auctions',
      question: 'How do the daily auctions work?',
      answer: (
        <>
          <p>
            After the 3-day minting period ends, daily auctions begin. These auctions distribute 50%
            of the daily fees.
          </p>
          <ul>
            <li>Auctions run every 25 hours</li>
            <li>Bidders use WMON (wrapped MON) to prevent DoS attacks</li>
            <li>Minimum bid: 50% of redemption value</li>
            <li>Each new bid must be 10% higher than previous</li>
            <li>Previous bidders receive instant WMON refunds</li>
            <li>Winner receives MONSTR tokens from the auction pool</li>
          </ul>
        </>
      ),
    },
    {
      id: 'unclaimed-prizes',
      question: 'What happens to unclaimed prizes?',
      answer: (
        <>
          <p>
            Unclaimed prizes are stored in a 7-slot rolling array. If a prize remains unclaimed after
            7 days, it's sent to the treasury beneficiary address.
          </p>
        </>
      ),
    },
    {
      id: 'why-wmon',
      question: 'Why use WMON for auctions instead of MON?',
      answer: (
        <>
          <p>
            WMON prevents DoS attacks from malicious bidders who could reject refunds and block the
            auction. With WMON, refunds are instant and guaranteed.
          </p>
        </>
      ),
    },
    {
      id: 'pseudo-day',
      question: 'What is a "pseudo-day" and why 25 hours?',
      answer: (
        <>
          <p>
            A pseudo-day is a 25-hour period used for lottery and auction cycles. The extra hour
            ensures that the lottery/auction timing rotates across different timezones, giving everyone
            fair access regardless of their location.
          </p>
        </>
      ),
    },
    {
      id: 'winner-selection',
      question: 'How are lottery winners selected?',
      answer: (
        <>
          <p>
            Winners are selected randomly using prevrandao (blockchain's random number source),
            weighted by token balance. The selection uses a Fenwick tree (binary indexed tree) for
            efficient O(log n) winner selection.
          </p>
        </>
      ),
    },
    {
      id: 'treasury',
      question: 'What is the treasury address?',
      answer: (
        <>
          <p>
            Treasury: <code>{CONTRACT_CONFIG.treasury}</code>
          </p>
          <p>This address receives unclaimed prizes after 7 days.</p>
        </>
      ),
    },
    {
      id: 'contract-address',
      question: 'What is the contract address?',
      answer: (
        <>
          <p>
            Contract: <code>{CONTRACT_CONFIG.address}</code>
          </p>
          <p>
            Network: <strong>{CONTRACT_CONFIG.chainName}</strong>
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="how-it-works-page">
      <div className="page-container">
        {/* Intro Section */}
        <section className="intro-section">
          <h1 className="page-title">Frequently Asked Questions</h1>
          <p className="intro-text">
            Everything you need to know about MONSTR, the Strategy Coin backed by MON.
          </p>
        </section>

        {/* FAQ List */}
        <section className="collapsible-sections">
          {faqs.map((faq) => (
            <div key={faq.id} className="collapsible-section">
              <button
                className={`section-header ${openQuestion === faq.id ? 'open' : ''}`}
                onClick={() => toggleQuestion(faq.id)}
              >
                <span className="section-title">{faq.question}</span>
                <span className="section-icon">{openQuestion === faq.id ? '−' : '+'}</span>
              </button>
              {openQuestion === faq.id && (
                <div className="section-body">
                  <div className="section-content">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
