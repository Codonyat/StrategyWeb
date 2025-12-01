import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther } from 'viem';
import { useStrategyContract } from '../hooks/useStrategyContract';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { CONTRACT_CONFIG } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './TransactionModal.css';

export function MintModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { mint, isPending, isConfirming, isSuccess, error: txError, reset } = useStrategyContract();
  const { isMintingPeriod, backingRatio } = useProtocolStats();

  // Get MON balance
  const { data: balance, isError, isLoading: isBalanceLoading, refetch } = useBalance({
    address,
    query: {
      enabled: !!address,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
      setSelectedPercentage(null);
      reset(); // Reset transaction state from previous transactions
    }
  }, [isOpen, reset]);

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

  // Don't auto-close on success - let user share or close manually
  // (Removed auto-close effect)

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      // Don't show error if user rejected the transaction
      if (txError.message && txError.message.includes('User rejected')) {
        return;
      }
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
    if (balance?.value === undefined || balance?.value === null) return false;
    try {
      const amountWei = parseEther(amount);
      // Allow for rounding errors up to 0.000001% (10^12 wei tolerance for typical balances)
      // This handles formatEther → parseEther precision loss
      const tolerance = balance.value / BigInt(1000000000) || BigInt(1000000);
      return amountWei > balance.value + tolerance;
    } catch {
      return false;
    }
  };

  // Update error message when amount changes
  useEffect(() => {
    if (exceedsBalance()) {
      setError(`Amount exceeds your ${CONTRACT_CONFIG.nativeCoin.symbol} balance`);
    } else if (error && error.includes('exceeds')) {
      setError('');
    }
  }, [amount, balance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Prevent submission if transaction is in progress or succeeded
    if (isPending || isConfirming || isSuccess) {
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (exceedsBalance()) {
      setError(`Insufficient ${CONTRACT_CONFIG.nativeCoin.symbol} balance`);
      return;
    }

    try {
      await mint(amount);
    } catch (err) {
      // Don't show error if user rejected the transaction
      if (err.message && err.message.includes('User rejected')) {
        return;
      }
      setError(err.message || 'Failed to mint');
    }
  };

  const handlePercentageClick = (percentage) => {
    if (balance?.value !== undefined && balance?.value !== null) {
      const totalBalance = parseFloat(formatEther(balance.value));
      if (percentage === 1.0) {
        // For MAX, use full balance without gas reserve
        setAmount(formatEther(balance.value));
      } else {
        // For percentages, use rounded value
        const newAmount = (totalBalance * percentage).toFixed(6);
        setAmount(newAmount);
      }
      setSelectedPercentage(percentage * 100);
    }
  };

  const estimatedOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    const inputAmount = parseFloat(amount);

    if (isMintingPeriod) {
      // During minting period: 1:1 ratio minus 1% fee
      return inputAmount * 0.99;
    } else {
      // After minting period: proportional to backing ratio minus 1% fee
      return inputAmount / backingRatio * 0.99;
    }
  };

  if (!isOpen) return null;

  const isLoading = isPending || isConfirming;
  const showSuccessView = isSuccess && amount;

  // Generate X share URL with prepopulated tweet
  const generateShareUrl = () => {
    const announcementLink = import.meta.env.VITE_ANNOUNCEMENT_LINK || 'https://twitter.com/yourhandle/status/123456789';
    const tweetText = `I just minted GIGA, a strategy coin on MegaETH:\n\n◈ 100% backed by MEGA, redeemable anytime\n◈ with a floor price that can only go up as fees accrue, and\n◈ a daily no-loss lottery for holders.\n\nCheck the launch thread and join in: ${announcementLink}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  };

  // Open X share in pop-up window
  const handleShare = () => {
    const url = generateShareUrl();
    const width = 550;
    const height = 420;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(
      url,
      'Share on X',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{showSuccessView ? 'Success!' : 'Deposit MEGA'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {showSuccessView ? (
          <div className="success-view">
            <div className="success-icon">🎉</div>
            <h3 className="success-title">Congratulations!</h3>
            <p className="success-message">
              You've successfully minted <strong><DisplayFormattedNumber num={estimatedOutput()} significant={4} /> {CONTRACT_CONFIG.strategyCoin.symbol}</strong>!
            </p>
            <p className="success-subtitle">
              Share your success with the community!
            </p>
            <div className="success-actions">
              <button
                className="share-button"
                onClick={handleShare}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>
              <button
                className="close-success-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
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
                className={error ? 'error' : ''}
              />
              <span className="token-symbol">{CONTRACT_CONFIG.nativeCoin.symbol}</span>
            </div>
            {isBalanceLoading ? (
              <div className="balance-info disabled">
                Balance: <strong>Loading...</strong>
              </div>
            ) : isError ? (
              <div className="balance-info disabled">
                Balance: <strong>Error loading balance</strong>
              </div>
            ) : balance?.value !== undefined && balance?.value !== null ? (
              <div className="balance-row">
                <div className="balance-info-text">
                  Balance: <strong><DisplayFormattedNumber num={formatEther(balance.value)} significant={6} /> {CONTRACT_CONFIG.nativeCoin.symbol}</strong>
                </div>
                <div className="balance-shortcuts">
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 25 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(0.25)}
                    disabled={isLoading || parseFloat(formatEther(balance.value)) === 0}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 50 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(0.5)}
                    disabled={isLoading || parseFloat(formatEther(balance.value)) === 0}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 100 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(1.0)}
                    disabled={isLoading || parseFloat(formatEther(balance.value)) === 0}
                  >
                    MAX
                  </button>
                </div>
              </div>
            ) : address ? (
              <div className="balance-info disabled">
                Balance: <strong>0 {CONTRACT_CONFIG.nativeCoin.symbol}</strong>
              </div>
            ) : null}
          </div>

          <div className="transaction-info">
            <div className="info-row">
              <span>You will receive</span>
              <span>
                ~<DisplayFormattedNumber num={estimatedOutput()} significant={6} /> {CONTRACT_CONFIG.strategyCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Exchange rate</span>
              <span>{isMintingPeriod ? '1:1' : <>1:<DisplayFormattedNumber num={1 / backingRatio} significant={4} /></>}</span>
            </div>
            <div className="info-row">
              <span>Fee</span>
              <span>1%</span>
            </div>
          </div>

          <div className="error-text-reserved">
            {error && <span className="error-text">{error}</span>}
            {isSuccess && amount && !error && <span className="success-text">Transaction successful!</span>}
          </div>

          {!address ? (
            <button
              type="button"
              className="submit-button"
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
              className={`submit-button ${isLoading || (isSuccess && amount) ? 'loading' : ''}`}
              disabled={isLoading || (isSuccess && amount) || !amount || parseFloat(amount) <= 0 || exceedsBalance()}
            >
              <div className="button-content">
                {isLoading && <span className="spinner"></span>}
                {isPending ? 'Waiting for approval' :
                 isConfirming ? 'Confirming' :
                 (isSuccess && amount) ? 'Success!' :
                 'Deposit MEGA'}
              </div>
            </button>
          )}
        </form>
        )}
      </div>
    </div>
  );
}
