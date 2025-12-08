import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { useStrategyContract } from '../hooks/useStrategyContract';
import { useGlobalContractData } from '../hooks/useGlobalContractData';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './TransactionModal.css';

// ERC20 ABI for balance, allowance, and approve
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

// MEGA uses 18 decimals
const MEGA_DECIMALS = CONTRACT_CONFIG.nativeCoin.decimals;

export function BidModal({ isOpen, onClose, minBid, minBidRaw, currentBid, currentBidRaw, auctionPool }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [useUnlimitedApproval, setUseUnlimitedApproval] = useState(false);
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { bid, isPending, isConfirming, isSuccess, isConfirmError, error: txError, confirmError, reset } = useStrategyContract();
  const { backingRatio } = useGlobalContractData();

  // Get MEGA token address
  const megaTokenAddress = CONTRACT_CONFIG.megaTokenAddress;

  // Get MEGA balance
  const { data: megaBalance, isError, isLoading: isBalanceLoading, refetch: refetchBalance } = useReadContract({
    address: megaTokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!megaTokenAddress,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 10000,
    },
  });

  // Get current allowance
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: megaTokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!megaTokenAddress && !!CONTRACT_ADDRESS,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 5000,
    },
  });

  // Approval transaction
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Check if approval is needed
  const needsApproval = () => {
    if (!amount || parseFloat(amount) <= 0) return false;
    if (!currentAllowance) return true;
    try {
      const amountWei = parseUnits(amount, MEGA_DECIMALS);
      return currentAllowance < amountWei;
    } catch {
      return true;
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError('');
      setSelectedPercentage(null);
      setIsApproving(false);
      setUseUnlimitedApproval(false);
      reset();
      resetApprove();
    }
  }, [isOpen, reset, resetApprove]);

  // Refetch balance and allowance when modal opens
  useEffect(() => {
    if (isOpen && address) {
      refetchBalance();
      refetchAllowance();
    }
  }, [isOpen, address, refetchBalance, refetchAllowance]);

  // Refetch allowance after successful approval
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setIsApproving(false);
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      if (txError.message && txError.message.includes('User rejected')) {
        return;
      }
      setError(txError.message || 'Transaction failed');
    }
  }, [txError]);

  // Handle transaction confirmation errors (reverts, etc.)
  useEffect(() => {
    if (isConfirmError) {
      setError(confirmError?.message || 'Transaction failed on-chain');
    }
  }, [isConfirmError, confirmError]);

  // Handle approval errors
  useEffect(() => {
    if (approveError) {
      if (approveError.message && approveError.message.includes('User rejected')) {
        setIsApproving(false);
        return;
      }
      setError(approveError.message || 'Approval failed');
      setIsApproving(false);
    }
  }, [approveError]);

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

  // Check if amount exceeds balance
  const exceedsBalance = () => {
    if (!amount || parseFloat(amount) <= 0) return false;
    if (megaBalance === undefined || megaBalance === null) return false;
    try {
      const amountWei = parseUnits(amount, MEGA_DECIMALS);
      const tolerance = megaBalance / BigInt(1000000000) || BigInt(1000000);
      return amountWei > megaBalance + tolerance;
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
  }, [amount, megaBalance]);

  const handleApprove = async () => {
    setError('');
    setIsApproving(true);

    try {
      const approvalAmount = useUnlimitedApproval
        ? maxUint256
        : parseUnits(amount, MEGA_DECIMALS);

      await writeApprove({
        address: megaTokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, approvalAmount],
      });
    } catch (err) {
      if (err.message && err.message.includes('User rejected')) {
        setIsApproving(false);
        return;
      }
      setError(err.message || 'Failed to approve');
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    // Validate minimum bid
    if (parseFloat(amount) < minBid) {
      setError(`Bid must be at least ${minBid.toFixed(6)} ${CONTRACT_CONFIG.nativeCoin.symbol}`);
      return;
    }

    if (exceedsBalance()) {
      setError(`Insufficient ${CONTRACT_CONFIG.nativeCoin.symbol} balance`);
      return;
    }

    // Check if approval is needed
    if (needsApproval()) {
      await handleApprove();
      return;
    }

    try {
      await bid(amount);
    } catch (err) {
      if (err.message && err.message.includes('User rejected')) {
        return;
      }
      setError(err.message || 'Failed to place bid');
    }
  };

  const handleShortcutClick = (type) => {
    if (type === 'min') {
      // Use raw BigInt value and add small buffer (1000 wei) to ensure we exceed minBid
      // This avoids floating-point precision loss
      if (minBidRaw && minBidRaw > BigInt(0)) {
        const minWithBuffer = minBidRaw + BigInt(1000);
        setAmount(formatUnits(minWithBuffer, MEGA_DECIMALS));
      } else {
        // Fallback to float calculation if raw not available
        const roundedMin = (Math.ceil(minBid * 1000000) + 1) / 1000000;
        setAmount(roundedMin.toString());
      }
      setSelectedPercentage('min');
    } else if (type === 'double') {
      // Double the current bid using raw BigInt for precision
      if (currentBidRaw && currentBidRaw > BigInt(0)) {
        const doubled = currentBidRaw * BigInt(2) + BigInt(1000);
        setAmount(formatUnits(doubled, MEGA_DECIMALS));
      } else {
        // Fallback to float calculation if raw not available
        const roundedDouble = (Math.ceil(currentBid * 2 * 1000000) + 1) / 1000000;
        setAmount(roundedDouble.toString());
      }
      setSelectedPercentage('double');
    } else if (type === 'max') {
      if (megaBalance !== undefined && megaBalance !== null) {
        setAmount(formatUnits(megaBalance, MEGA_DECIMALS));
        setSelectedPercentage('max');
      }
    }
  };

  if (!isOpen) return null;

  const isLoading = isPending || (isConfirming && !isConfirmError) || isApprovePending || isApproveConfirming;
  const showSuccessView = isSuccess && amount;
  const showApprovalNeeded = needsApproval() && !isApproveSuccess && amount && parseFloat(amount) > 0;

  // Button text logic
  const getButtonText = () => {
    if (isApprovePending) return 'Waiting for approval';
    if (isApproveConfirming) return 'Confirming approval';
    if (isPending) return 'Waiting for confirmation';
    if (isConfirmError) return 'Transaction Failed';
    if (isConfirming) return 'Confirming';
    if (isSuccess && amount) return 'Success!';
    if (showApprovalNeeded) return `Approve ${CONTRACT_CONFIG.nativeCoin.symbol}`;
    return 'Place Bid';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{showSuccessView ? 'Bid Placed!' : 'Place Bid'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {showSuccessView ? (
          <div className="success-view">
            <div className="success-icon">🎉</div>
            <h3 className="success-title">Bid Successful!</h3>
            <p className="success-message">
              You've placed a bid of <strong><DisplayFormattedNumber num={parseFloat(amount)} significant={4} /> {CONTRACT_CONFIG.nativeCoin.symbol}</strong>!
            </p>
            <p className="success-subtitle">
              If you win, you'll receive <strong><DisplayFormattedNumber num={auctionPool} significant={4} /> {CONTRACT_CONFIG.strategyCoin.symbol}</strong>!
            </p>
            <div className="success-actions">
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
            <label htmlFor="amount">Bid Amount</label>
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
                  setSelectedPercentage(null);
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
            ) : isError || !megaTokenAddress ? (
              <div className="balance-info disabled">
                Balance: <strong>{!megaTokenAddress ? 'Token not configured' : 'Error loading balance'}</strong>
              </div>
            ) : megaBalance !== undefined && megaBalance !== null ? (
              <div className="balance-row">
                <div className="balance-info-text">
                  Balance: <strong><DisplayFormattedNumber num={formatUnits(megaBalance, MEGA_DECIMALS)} significant={6} /> {CONTRACT_CONFIG.nativeCoin.symbol}</strong>
                </div>
                <div className="balance-shortcuts">
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 'min' ? 'selected' : ''}`}
                    onClick={() => handleShortcutClick('min')}
                    disabled={isLoading || !minBid || minBid <= 0}
                  >
                    Min
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 'double' ? 'selected' : ''}`}
                    onClick={() => handleShortcutClick('double')}
                    disabled={isLoading || !currentBid || currentBid <= 0}
                  >
                    2x
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 'max' ? 'selected' : ''}`}
                    onClick={() => handleShortcutClick('max')}
                    disabled={isLoading || parseFloat(formatUnits(megaBalance, MEGA_DECIMALS)) === 0}
                  >
                    Max
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
              <span>Potential winnings</span>
              <span>
                <DisplayFormattedNumber num={auctionPool} significant={3} /> {CONTRACT_CONFIG.strategyCoin.symbol}
              </span>
            </div>
            {backingRatio > 0 && (
              <div className="info-row">
                <span>Backing value</span>
                <span>
                  <DisplayFormattedNumber num={auctionPool * backingRatio} significant={3} /> {CONTRACT_CONFIG.nativeCoin.symbol}
                </span>
              </div>
            )}
            <div className="info-row">
              <span>Minimum bid</span>
              <span>
                <DisplayFormattedNumber num={minBid} significant={3} /> {CONTRACT_CONFIG.nativeCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Required increase</span>
              <span>10% above current</span>
            </div>
          </div>

          {showApprovalNeeded && (
            <label className="approval-toggle">
              <input
                type="checkbox"
                checked={useUnlimitedApproval}
                onChange={(e) => setUseUnlimitedApproval(e.target.checked)}
                disabled={isLoading}
              />
              <span className="approval-toggle-text">
                <span className="approval-toggle-label">Unlimited approval</span>
                <span className="approval-toggle-hint">Skip approvals for future transactions (less secure)</span>
              </span>
            </label>
          )}

          <div className="error-text-reserved">
            {error && <span className="error-text">{error}</span>}
            {isSuccess && amount && !error && <span className="success-text">Bid placed successfully!</span>}
          </div>

          {!address ? (
            <button
              type="button"
              className="submit-button bid"
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
              className={`submit-button bid ${isLoading || (isSuccess && amount) ? 'loading' : ''}`}
              disabled={isLoading || (isSuccess && amount) || !amount || parseFloat(amount) <= 0 || exceedsBalance()}
            >
              <div className="button-content">
                {isLoading && <span className="spinner"></span>}
                {getButtonText()}
              </div>
            </button>
          )}
        </form>
        )}
      </div>
    </div>
  );
}
