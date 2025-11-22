import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { useStrategyContract } from '../hooks/useStrategyContract';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './TransactionModal.css';

export function BurnModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { burn, isPending, isConfirming, isSuccess, error: txError } = useStrategyContract();
  const { backingRatio, isMintingPeriod } = useProtocolStats();

  // Get MONSTR balance
  const { data: tokenBalance, isError, isLoading: isBalanceLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
      setSelectedPercentage(null);
    }
  }, [isOpen]);

  // Refetch balance when modal opens
  useEffect(() => {
    if (isOpen && address) {
      refetch();
    }
  }, [isOpen, address, refetch]);

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

  // Check if amount exceeds balance in real-time
  const exceedsBalance = () => {
    if (!amount || parseFloat(amount) <= 0) return false;
    if (tokenBalance === undefined || tokenBalance === null) return false;
    try {
      const amountWei = parseEther(amount);
      // Allow for rounding errors up to 0.000001% (10^12 wei tolerance for typical balances)
      // This handles formatEther → parseEther precision loss
      const tolerance = tokenBalance / BigInt(1000000000) || BigInt(1000000);
      return amountWei > tokenBalance + tolerance;
    } catch {
      return false;
    }
  };

  // Update error message when amount changes
  useEffect(() => {
    if (exceedsBalance()) {
      setError(`Amount exceeds your ${CONTRACT_CONFIG.strategyCoin.symbol} balance`);
    } else if (error && error.includes('exceeds')) {
      setError('');
    }
  }, [amount, tokenBalance]);

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

    if (exceedsBalance()) {
      setError(`Insufficient ${CONTRACT_CONFIG.strategyCoin.symbol} balance`);
      return;
    }

    try {
      await burn(amount);
    } catch (err) {
      setError(err.message || 'Failed to burn');
    }
  };

  const handlePercentageClick = (percentage) => {
    if (tokenBalance !== undefined && tokenBalance !== null) {
      const balance = parseFloat(formatEther(tokenBalance));
      // For MAX (100%), use full precision to avoid rounding errors
      const newAmount = percentage === 1.0
        ? formatEther(tokenBalance)
        : (balance * percentage).toFixed(6);
      setAmount(newAmount);
      setSelectedPercentage(percentage * 100);
    }
  };

  const estimatedOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    const inputAmount = parseFloat(amount);

    // Burning gives MON at backing ratio minus 1% fee
    return inputAmount * backingRatio * 0.99;
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
                  setSelectedPercentage(null); // Clear selection on manual edit
                }}
                disabled={isLoading}
                className={`burn-input ${error ? 'error' : ''}`}
              />
              <span className="token-symbol">{CONTRACT_CONFIG.strategyCoin.symbol}</span>
            </div>
            {isBalanceLoading ? (
              <div className="balance-info disabled">
                Balance: <strong>Loading...</strong>
              </div>
            ) : isError ? (
              <div className="balance-info disabled">
                Balance: <strong>Error loading balance</strong>
              </div>
            ) : tokenBalance !== undefined && tokenBalance !== null ? (
              <div className="balance-row">
                <div className="balance-info-text">
                  Balance: <strong><DisplayFormattedNumber num={formatEther(tokenBalance)} significant={6} /> {CONTRACT_CONFIG.strategyCoin.symbol}</strong>
                </div>
                <div className="balance-shortcuts">
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 25 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(0.25)}
                    disabled={isLoading || parseFloat(formatEther(tokenBalance)) === 0}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 50 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(0.5)}
                    disabled={isLoading || parseFloat(formatEther(tokenBalance)) === 0}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 100 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(1.0)}
                    disabled={isLoading || parseFloat(formatEther(tokenBalance)) === 0}
                  >
                    MAX
                  </button>
                </div>
              </div>
            ) : address ? (
              <div className="balance-info disabled">
                Balance: <strong>0 {CONTRACT_CONFIG.strategyCoin.symbol}</strong>
              </div>
            ) : null}
          </div>

          <div className="transaction-info">
            <div className="info-row">
              <span>You will receive</span>
              <span>
                ~<DisplayFormattedNumber num={estimatedOutput()} significant={6} /> {CONTRACT_CONFIG.nativeCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Exchange rate</span>
              <span>1:<DisplayFormattedNumber num={backingRatio} significant={4} /></span>
            </div>
            <div className="info-row">
              <span>Fee</span>
              <span>1%</span>
            </div>
          </div>

          {!isMintingPeriod && (
            <div className="warning-message">
              <strong>Warning:</strong> Burning {CONTRACT_CONFIG.strategyCoin.symbol} is irreversible. You will receive {CONTRACT_CONFIG.nativeCoin.symbol} at the current backing ratio.
            </div>
          )}

          <div className="error-text-reserved">
            {error && <span className="error-text">{error}</span>}
          </div>
          {isSuccess && <div className="success-message">Transaction successful!</div>}

          {!address ? (
            <button
              type="button"
              className="submit-button burn"
              onClick={() => {
                openConnectModal?.();
              }}
            >
              <div className="button-content">
                Connect Wallet
              </div>
            </button>
          ) : (
            <button
              type="submit"
              className={`submit-button burn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !amount || parseFloat(amount) <= 0 || exceedsBalance()}
            >
              <div className="button-content">
                {isLoading && <span className="spinner"></span>}
                {isPending ? 'Waiting for approval' :
                 isConfirming ? 'Confirming' :
                 isSuccess ? 'Success!' :
                 `Burn ${CONTRACT_CONFIG.strategyCoin.symbol}`}
              </div>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
