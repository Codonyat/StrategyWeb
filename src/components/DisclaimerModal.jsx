import { useEffect } from 'react';
import './DisclaimerModal.css';

export function DisclaimerModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="disclaimer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Legal Disclaimer & Terms of Use</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="disclaimer-modal-body">
          <section className="disclaimer-section">
            <h3>No Investment Advice</h3>
            <p>
              The information provided on this website does not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should not treat any of the website's content as such. MONSTR does not recommend that any cryptocurrency should be bought, sold, or held by you. Conduct your own due diligence and consult your financial advisor before making any investment decisions.
            </p>
          </section>

          <section className="disclaimer-section">
            <h3>Risk Warning</h3>
            <p>
              Cryptocurrency trading and DeFi protocols involve substantial risk of loss. The value of digital assets can be extremely volatile and unpredictable. You may lose some or all of your invested capital. Past performance is not indicative of future results.
            </p>
          </section>

          <section className="disclaimer-section">
            <h3>Smart Contract Risks</h3>
            <p>
              While the Strategy contract has been audited for Ethereum and adapted for Monad, smart contracts are complex systems that may contain undiscovered vulnerabilities. Audits do not guarantee security. Blockchain technology and smart contracts are subject to inherent risks including, but not limited to, bugs, malfunctions, cyber attacks, changes to the protocol, and regulatory actions.
            </p>
          </section>

          <section className="disclaimer-section">
            <h3>No Guarantees</h3>
            <p>
              No representations or warranties are made concerning the accuracy, completeness, or reliability of any information, code, or materials on this website. The protocol is provided "as is" without warranty of any kind, either express or implied.
            </p>
          </section>

          <section className="disclaimer-section">
            <h3>Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by applicable law, the creators, developers, contributors, and affiliates of MONSTR shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul>
              <li>Your access to or use of or inability to access or use the protocol;</li>
              <li>Any conduct or content of any third party;</li>
              <li>Unauthorized access, use, or alteration of your content or transactions; or</li>
              <li>Any other matter relating to the protocol.</li>
            </ul>
          </section>

          <section className="disclaimer-section">
            <h3>User Responsibility</h3>
            <p>
              You are solely responsible for determining whether any transaction is appropriate for you based on your personal investment objectives, financial circumstances, and risk tolerance. You accept full responsibility for your use of this website and the protocol.
            </p>
          </section>

          <section className="disclaimer-section">
            <h3>Regulatory Uncertainty</h3>
            <p>
              The regulatory status of cryptographic tokens and blockchain technology is unclear or unsettled in many jurisdictions. It is your responsibility to determine whether your use of the protocol complies with applicable laws and regulations in your jurisdiction.
            </p>
          </section>

          <section className="disclaimer-section">
            <h3>Affiliation</h3>
            <p>
              MONSTR is an independent project and is not affiliated with, endorsed by, or sponsored by Monad Labs or the Monad blockchain. The Strategy contract was audited for Ethereum and adapted for Monad.
            </p>
          </section>

          <section className="disclaimer-section disclaimer-emphasis-section">
            <p className="disclaimer-emphasis-text">
              BY ACCESSING AND USING THIS WEBSITE AND PROTOCOL, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREED TO THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THIS WEBSITE OR PROTOCOL.
            </p>
          </section>
        </div>

        <div className="disclaimer-modal-footer">
          <button onClick={onClose} className="disclaimer-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
