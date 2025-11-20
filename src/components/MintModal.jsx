import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useStrategyContract } from '../hooks/useStrategyContract';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { CONTRACT_CONFIG } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './TransactionModal.css';

export function MintModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { mint, isPending, isConfirming, isSuccess, error: txError } = useStrategyContract();
  const { isMintingPeriod, backingRatio } = useProtocolStats();

  // Get MON balance
  const { data: balance } = useBalance({
    address,
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

    if (balance && parseEther(amount) > balance.value) {
      setError('Insufficient MON balance');
      return;
    }

    try {
      await mint(amount);
    } catch (err) {
      setError(err.message || 'Failed to mint');
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      // Leave a small amount for gas
      const maxAmount = Math.max(0, parseFloat(formatEther(balance.value)) - 0.01);
      setAmount(maxAmount.toFixed(6));
    }
  };

  const estimatedOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    const inputAmount = parseFloat(amount);

    if (isMintingPeriod) {
      // During minting period: 1:1 ratio minus 1% fee
      return (inputAmount * 0.99).toFixed(6);
    } else {
      // After minting period: proportional to backing ratio minus 1% fee
      return (inputAmount / backingRatio * 0.99).toFixed(6);
    }
  };

  if (!isOpen) return null;

  const isLoading = isPending || isConfirming;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Deposit MON</h2>
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
                className={error ? 'error' : ''}
              />
              <span className="token-symbol">{CONTRACT_CONFIG.nativeCoin.symbol}</span>
              <button
                type="button"
                className="max-button"
                onClick={handleMaxClick}
                disabled={isLoading || !balance}
              >
                MAX
              </button>
            </div>
            {balance && (
              <div
                className={`balance-info ${parseFloat(formatEther(balance.value)) === 0 ? 'disabled' : ''}`}
                onClick={parseFloat(formatEther(balance.value)) > 0 ? handleMaxClick : undefined}
                title={parseFloat(formatEther(balance.value)) > 0 ? "Click to use max" : ""}
              >
                Balance: <strong><DisplayFormattedNumber num={formatEther(balance.value)} significant={6} /> {CONTRACT_CONFIG.nativeCoin.symbol}</strong>
              </div>
            )}
          </div>

          <div className="transaction-info">
            <div className="info-row">
              <span>You will receive</span>
              <span className="highlight">
                {amount && parseFloat(amount) > 0 ? `~${estimatedOutput()}` : '0'} {CONTRACT_CONFIG.strategyCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Exchange rate</span>
              <span>{isMintingPeriod ? '1:1' : `1:${(1 / backingRatio).toFixed(4)}`}</span>
            </div>
            <div className="info-row">
              <span>Fee</span>
              <span>1%</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {isSuccess && <div className="success-message">Transaction successful!</div>}

          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            <div className="button-content">
              {isLoading && <span className="spinner"></span>}
              {isPending ? 'Waiting for approval' :
               isConfirming ? 'Confirming' :
               isSuccess ? 'Success!' :
               'Deposit MON'}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
