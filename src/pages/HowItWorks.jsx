import { useState } from 'react';
import { CONTRACT_CONFIG } from '../config/contract';
import contractConstants from '../config/contract-constants.json';
import './HowItWorks.css';

// Calculate minting period in days from contract constants
const mintingPeriodDays = Math.round(Number(contractConstants.MINTING_PERIOD) / 86400);
const LOTTERY_PERCENT = Number(contractConstants.LOTTERY_PERCENT);
const AUCTION_PERCENT = 100 - LOTTERY_PERCENT;

export default function HowItWorks() {
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (questionId) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  const faqCategories = [
    {
      category: 'Basics',
      faqs: [
        {
          id: 'what-is-monstr',
          question: 'What is GIGA?',
          answer: (
            <>
              <p>
                <strong>GIGA is a strategy coin backed 100% by MEGA.</strong> You can always burn GIGA to withdraw MEGA from the backing pool, and protocol fees create an up-only backing ratio over time.
              </p>
            </>
          ),
        },
        {
          id: 'giga-icon',
          question: 'What does the GIGA icon represent?',
          answer: (
            <>
              <p>
                <strong>The GIGA icon is a playful nod to the tortoise and the hare fable.</strong> MegaETH's logo features an "M" with two dots underneath, resembling a rabbit to symbolize their ultra-fast blockchain.
              </p>
              <p>
                We created a complementary "G" modified to look like a turtle. While GIGA isn't a blockchain, the turtle represents our philosophy: slow and steady wins the race. The backing ratio grows gradually over time through accumulated fees, steadily increasing the MEGA reserves behind each GIGA token.
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
                <strong>Minting is open for the first {mintingPeriodDays} days after deployment.</strong> During the first 24 hours, 1000 MEGA mints 1 GIGA at a fixed 1:1000 ratio. After the first 24 hours, minting uses the current backing ratio.
              </p>
              <p>
                After the minting period ends, you can still mint GIGA at the current backing ratio, but only if the total supply is below the maximum supply cap (set at the end of the minting period). When holders burn GIGA, this opens up supply capacity for new minting. You can also acquire GIGA on the secondary market.
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
                <strong>Yes.</strong> You can burn GIGA at any time to redeem MEGA from the backing pool at the current backing ratio. A 1% protocol fee is applied on redemptions.
              </p>
            </>
          ),
        },
        {
          id: 'risky',
          question: 'Is GIGA risky?',
          answer: (
            <>
              <p>
                <strong>GIGA has been audited and uses a transparent, on-chain backing mechanism.</strong> The contract allows you to redeem GIGA for MEGA at any time, creating a price floor at the backing ratio. Like all crypto protocols, you should be aware of smart contract risk and exposure to MEGA price volatility. Always review the audit and source code yourself before participating.
              </p>
            </>
          ),
        },
      ],
    },
    {
      category: 'Mechanics',
      faqs: [
        {
          id: 'backing-works',
          question: 'How does the backing mechanism work?',
          answer: (
            <>
              <p>
                <strong>All MEGA sent into the protocol</strong> (minting, fees, and auction proceeds) stays in the reserve. GIGA supply fluctuates: it decreases when tokens are burned and can increase when new tokens are minted (if below the max supply cap). Because the reserve grows but the max supply stays capped, the backing per GIGA will increase over time as long as the protocol collects fees.
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
                <strong>There is a 1% fee on mint, burn, and transfers of GIGA.</strong> These fees are routed into the protocol and split {LOTTERY_PERCENT}% to the lottery pool and {AUCTION_PERCENT}% to the auction pool. The auction mechanism converts collected fees back into MEGA by auctioning GIGA tokens to bidders, thereby increasing the net amount of MEGA in the reserve and strengthening the backing ratio.
              </p>
            </>
          ),
        },
        {
          id: 'backing-vs-price',
          question: 'What is the difference between backing ratio and exchange price?',
          answer: (
            <>
              <p>
                <strong>The backing ratio</strong> tells you how much MEGA sits behind each GIGA in the reserve. <strong>The exchange price</strong> is whatever the token trades for on the market. Since anyone can redeem GIGA for MEGA at the backing ratio at any time, arbitrageurs will buy below backing and redeem for profit, creating a price floor. In practice, GIGA should trade at or above the backing ratio.
              </p>
            </>
          ),
        },
        {
          id: 'flywheel-effect',
          question: 'How does GIGA create value over time?',
          answer: (
            <>
              <p>
                <strong>GIGA has a built-in flywheel effect.</strong> Minting generates fees, which increase the backing ratio. A higher backing ratio creates profit expectations, driving secondary market buying. This buying generates more fees, further increasing the backing. If the exchange price diverges too much from backing and drops, increased trading activity generates even more fees, strengthening the backing and restarting the cycle.
              </p>
              <p>
                This mechanism makes GIGA a safe leverage bet on MEGA. As long as MEGA has value and the protocol sees activity, the backing ratio trends upward over time.
              </p>
            </>
          ),
        },
        {
          id: 'lottery',
          question: 'How does the lottery work?',
          answer: (
            <>
              <p>
                <strong>Starting from day 1, the protocol snapshots GIGA holder balances each day.</strong> Using on-chain randomness, one holder is chosen at random, weighted by their balance. Only regular wallet addresses participate—smart contracts are excluded from lottery draws. The winner can claim that day's lottery pool, which receives {LOTTERY_PERCENT}% of protocol fees.
              </p>
            </>
          ),
        },
        {
          id: 'auctions',
          question: 'How do the daily auctions work?',
          answer: (
            <>
              <p>
                <strong>Starting from day 1, {AUCTION_PERCENT}% of protocol fees are auctioned once per day.</strong> Users bid with MEGA. At the end of the day the highest bid wins the pool of GIGA. Losing bidders keep their MEGA.
              </p>
            </>
          ),
        },
        {
          id: 'unclaimed-prizes',
          question: 'What happens to unclaimed prizes?',
          answer: (
            <>
              <p>
                <strong>Lottery and auction prizes can be claimed for 7 days.</strong> After that window closes unclaimed prizes are sent to the treasury address defined in the contract.
              </p>
            </>
          ),
        },
      ],
    },
    {
      category: 'Timing and randomness',
      faqs: [
        {
          id: 'pseudo-day',
          question: 'What is a pseudo-day and why 25 hours?',
          answer: (
            <>
              <p>
                <strong>The protocol uses 25-hour pseudo-days instead of 24 hours.</strong> That slowly rotates the time of day when lotteries and auctions roll over so no single timezone always gets the most convenient reset time.
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
                <strong>The contract uses a data structure that tracks holder balances</strong> and picks a random position using the prevrandao value from the block. This lets it select a winner weighted by balance without iterating over all holders.
              </p>
            </>
          ),
        },
      ],
    },
    {
      category: 'Operations and contracts',
      faqs: [
        {
          id: 'treasury',
          question: 'What is the treasury address?',
          answer: (
            <>
              <p>
                <strong>The treasury address is a hard-coded address</strong> that receives unclaimed prizes and other protocol funds. You can view it in the contract under <code>BENEFICIARIES</code>.
              </p>
              <p>
                Treasury: <code>{CONTRACT_CONFIG.treasury}</code>
              </p>
            </>
          ),
        },
        {
          id: 'contract-address',
          question: 'What is the contract address?',
          answer: (
            <>
              <p>
                <strong>The strategy contract address is shown in the footer and on the FAQ page.</strong> You can click it to open the contract on the block explorer and verify the source code.
              </p>
              <p>
                Contract: <code>{CONTRACT_CONFIG.address}</code>
              </p>
            </>
          ),
        },
        {
          id: 'audited',
          question: 'Has the contract been audited?',
          answer: (
            <>
              <p>
                <strong>The GIGA contract has been audited for Ethereum and then adapted for MegaETH testnet.</strong> Audits reduce but do not remove risk. Always review the code and audit reports yourself.
              </p>
            </>
          ),
        },
        {
          id: 'stake-lock',
          question: 'Do I need to stake or lock GIGA to enter the lottery?',
          answer: (
            <>
              <p>
                <strong>No.</strong> You stay entered in the daily lottery as long as you hold GIGA in your wallet at the time of the daily snapshot. Note that only regular wallets participate, smart contracts are excluded from lottery draws.
              </p>
            </>
          ),
        },
        {
          id: 'wallets-networks',
          question: 'What wallets and networks are supported?',
          answer: (
            <>
              <p>
                <strong>GIGA currently runs on {CONTRACT_CONFIG.chainName}</strong> and supports any wallet that can connect to EVM-compatible networks, such as MetaMask or Rabby.
              </p>
            </>
          ),
        },
      ],
    },
  ];

  return (
    <div className="how-it-works-page">
      <div className="page-container">
        <p className="page-tagline">
          Frequently asked questions
        </p>
        {/* FAQ List */}
        <section className="faq-sections">
          {faqCategories.map((category) => (
            <div key={category.category} className="faq-category">
              <h2 className="category-label">{category.category}</h2>
              <div className="collapsible-sections">
                {category.faqs.map((faq) => (
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
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
