import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useStrategyContract } from '../hooks/useStrategyContract';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './TransactionModal.css';

export function BurnModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { burn, isPending, isConfirming, isSuccess, error: txError } = useStrategyContract();
  const { backingRatio } = useProtocolStats();

  // Get MONSTR balance
  const { data: tokenBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-close on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setAmount('');
        setError('');
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      setError(txError.message || 'Transaction failed');
    }
  }, [txError]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (tokenBalance && parseEther(amount) > tokenBalance) {
      setError(`Insufficient ${CONTRACT_CONFIG.strategyCoin.symbol} balance`);
      return;
    }

    try {
      await burn(amount);
    } catch (err) {
      setError(err.message || 'Failed to burn');
    }
  };

  const handleMaxClick = () => {
    if (tokenBalance) {
      setAmount(formatEther(tokenBalance));
    }
  };

  const handlePercentageClick = (percentage) => {
    if (tokenBalance) {
      const balance = parseFloat(formatEther(tokenBalance));
      const newAmount = (balance * percentage).toFixed(6);
      setAmount(newAmount);
    }
  };

  const estimatedOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    const inputAmount = parseFloat(amount);

    // Burning gives MON at backing ratio minus 1% fee
    return (inputAmount * backingRatio * 0.99).toFixed(6);
  };

  if (!isOpen) return null;

  const isLoading = isPending || isConfirming;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Burn {CONTRACT_CONFIG.strategyCoin.symbol}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <div className="input-wrapper">
              <input
                ref={inputRef}
                id="amount"
                type="number"
                step="any"
                placeholder="0.0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                className={`burn-input ${error ? 'error' : ''}`}
              />
              <span className="token-symbol">{CONTRACT_CONFIG.strategyCoin.symbol}</span>
              <button
                type="button"
                className="max-button burn-max"
                onClick={handleMaxClick}
                disabled={isLoading || !tokenBalance}
              >
                MAX
              </button>
            </div>
            {tokenBalance && (
              <>
                <div
                  className={`balance-info ${parseFloat(formatEther(tokenBalance)) === 0 ? 'disabled' : ''}`}
                  onClick={parseFloat(formatEther(tokenBalance)) > 0 ? handleMaxClick : undefined}
                  title={parseFloat(formatEther(tokenBalance)) > 0 ? "Click to use max" : ""}
                >
                  Balance: <strong><DisplayFormattedNumber num={formatEther(tokenBalance)} significant={6} /> {CONTRACT_CONFIG.strategyCoin.symbol}</strong>
                </div>
                <div className="quick-amounts">
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => handlePercentageClick(0.25)}
                    disabled={isLoading}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => handlePercentageClick(0.5)}
                    disabled={isLoading}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    className="quick-amount-btn"
                    onClick={() => handlePercentageClick(0.75)}
                    disabled={isLoading}
                  >
                    75%
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="transaction-info">
            <div className="info-row">
              <span>You will receive</span>
              <span className="highlight burn">
                {amount && parseFloat(amount) > 0 ? `~${estimatedOutput()}` : '0'} {CONTRACT_CONFIG.nativeCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Backing ratio</span>
              <span><DisplayFormattedNumber num={backingRatio} significant={4} />x</span>
            </div>
            <div className="info-row">
              <span>Fee</span>
              <span>1%</span>
            </div>
          </div>

          <div className="warning-message">
            <strong>Warning:</strong> Burning {CONTRACT_CONFIG.strategyCoin.symbol} is irreversible. You will receive {CONTRACT_CONFIG.nativeCoin.symbol} at the current backing ratio.
          </div>

          {error && <div className="error-message">{error}</div>}
          {isSuccess && <div className="success-message">Transaction successful!</div>}

          <button
            type="submit"
            className={`submit-button burn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            <div className="button-content">
              {isLoading && <span className="spinner"></span>}
              {isPending ? 'Waiting for approval' :
               isConfirming ? 'Confirming' :
               isSuccess ? 'Success!' :
               `Burn ${CONTRACT_CONFIG.strategyCoin.symbol}`}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
