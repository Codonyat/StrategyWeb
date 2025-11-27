import { useState, useEffect, useRef } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseEther, formatEther, parseAbi, maxUint256 } from 'viem';
import { useStrategyContract } from '../hooks/useStrategyContract';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './TransactionModal.css';

// Minimal ERC20 ABI for WMON interactions
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

export function BidModal({ isOpen, onClose, minBid, auctionPool }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [useNativeMon, setUseNativeMon] = useState(true); // Default to native MON
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { bid, isPending: isBidPending, isConfirming: isBidConfirming, isSuccess: isBidSuccess, error: bidError } = useStrategyContract();

  // Get native MON balance
  const { data: monBalance, refetch: refetchMonBalance } = useBalance({
    address,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  // Get WMON address from contract
  const { data: wmonAddress } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'wmon',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS,
    },
  });

  // Get WMON balance
  const { data: wmonBalance, isError: isBalanceError, isLoading: isBalanceLoading, refetch: refetchBalance } = useReadContract({
    address: wmonAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!wmonAddress,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 10000,
    },
  });

  // Get WMON allowance
  const { data: wmonAllowance, refetch: refetchAllowance } = useReadContract({
    address: wmonAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && CONTRACT_ADDRESS ? [address, CONTRACT_ADDRESS] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!wmonAddress && !!CONTRACT_ADDRESS,
      retry: 3,
      retryDelay: 1000,
      refetchInterval: 10000,
    },
  });

  // Approve WMON spending
  const { writeContract: approveWmon, data: approvalHash, isPending: isApproving, error: approvalError } = useWriteContract();
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Check if approval is needed (only for WMON)
  useEffect(() => {
    if (useNativeMon || !amount || !wmonAllowance) {
      setNeedsApproval(false);
      return;
    }

    try {
      const bidAmount = parseEther(amount);
      setNeedsApproval(wmonAllowance < bidAmount);
    } catch {
      setNeedsApproval(false);
    }
  }, [amount, wmonAllowance, useNativeMon]);

  // Refetch balances and allowances when modal opens or approval succeeds
  useEffect(() => {
    if ((isOpen || isApprovalSuccess) && address) {
      refetchBalance();
      refetchAllowance();
      refetchMonBalance();
    }
  }, [isOpen, isApprovalSuccess, address, refetchBalance, refetchAllowance, refetchMonBalance]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-close on success
  useEffect(() => {
    if (isBidSuccess) {
      const timer = setTimeout(() => {
        setAmount('');
        setError('');
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isBidSuccess, onClose]);

  // Handle transaction errors
  useEffect(() => {
    if (bidError) {
      setError(bidError.message || 'Transaction failed');
    }
    if (approvalError) {
      setError(approvalError.message || 'Approval failed');
    }
  }, [bidError, approvalError]);

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

  const handleApprove = async () => {
    if (!address || !wmonAddress) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setError('');
      approveWmon({
        address: wmonAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, maxUint256], // Approve unlimited
      });
    } catch (err) {
      setError(err.message || 'Failed to approve');
    }
  };

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

    // Validate minimum bid
    const tokenSymbol = useNativeMon ? CONTRACT_CONFIG.nativeCoin.symbol : CONTRACT_CONFIG.wrappedCoin.symbol;
    if (parseFloat(amount) < minBid) {
      setError(`Bid must be at least ${minBid.toFixed(6)} ${tokenSymbol}`);
      return;
    }

    // Validate balance
    const currentBalance = useNativeMon ? monBalance?.value : wmonBalance;
    if (currentBalance && parseEther(amount) > currentBalance) {
      setError(`Insufficient ${tokenSymbol} balance`);
      return;
    }

    try {
      await bid(amount, useNativeMon);
    } catch (err) {
      setError(err.message || 'Failed to place bid');
    }
  };

  const handlePercentageClick = (percentage) => {
    const currentBalance = useNativeMon ? monBalance?.value : wmonBalance;
    if (currentBalance !== undefined && currentBalance !== null) {
      const balance = parseFloat(formatEther(currentBalance));
      const newAmount = (balance * percentage).toFixed(6);
      setAmount(newAmount);
      setSelectedPercentage(percentage * 100);
    }
  };

  if (!isOpen) return null;

  const isLoading = isBidPending || isBidConfirming || isApproving || isApprovalConfirming;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Place Bid</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Token Toggle */}
          <div className="token-toggle">
            <button
              type="button"
              className={`toggle-btn ${useNativeMon ? 'active' : ''}`}
              onClick={() => {
                setUseNativeMon(true);
                setAmount('');
                setSelectedPercentage(null);
                setError('');
              }}
              disabled={isLoading}
            >
              {CONTRACT_CONFIG.nativeCoin.symbol}
            </button>
            <button
              type="button"
              className={`toggle-btn ${!useNativeMon ? 'active' : ''}`}
              onClick={() => {
                setUseNativeMon(false);
                setAmount('');
                setSelectedPercentage(null);
                setError('');
              }}
              disabled={isLoading}
            >
              {CONTRACT_CONFIG.wrappedCoin.symbol}
            </button>
          </div>

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
              <span className="token-symbol">{useNativeMon ? CONTRACT_CONFIG.nativeCoin.symbol : CONTRACT_CONFIG.wrappedCoin.symbol}</span>
            </div>
            {(() => {
              const currentBalance = useNativeMon ? monBalance?.value : wmonBalance;
              const tokenSymbol = useNativeMon ? CONTRACT_CONFIG.nativeCoin.symbol : CONTRACT_CONFIG.wrappedCoin.symbol;
              const balanceLoading = useNativeMon ? false : isBalanceLoading;
              const balanceError = useNativeMon ? false : isBalanceError;

              if (balanceLoading) {
                return (
                  <div className="balance-info disabled">
                    Balance: <strong>Loading...</strong>
                  </div>
                );
              }
              if (balanceError) {
                return (
                  <div className="balance-info disabled">
                    Balance: <strong>Error loading balance</strong>
                  </div>
                );
              }
              if (currentBalance !== undefined && currentBalance !== null) {
                const balanceNum = parseFloat(formatEther(currentBalance));
                return (
                  <div className="balance-row">
                    <div className="balance-info-text">
                      Balance: <strong><DisplayFormattedNumber num={balanceNum} significant={6} /> {tokenSymbol}</strong>
                    </div>
                    <div className="balance-shortcuts">
                      <button
                        type="button"
                        className={`shortcut-btn ${selectedPercentage === 25 ? 'selected' : ''}`}
                        onClick={() => handlePercentageClick(0.25)}
                        disabled={isLoading || balanceNum === 0}
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        className={`shortcut-btn ${selectedPercentage === 50 ? 'selected' : ''}`}
                        onClick={() => handlePercentageClick(0.5)}
                        disabled={isLoading || balanceNum === 0}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        className={`shortcut-btn ${selectedPercentage === 100 ? 'selected' : ''}`}
                        onClick={() => handlePercentageClick(1.0)}
                        disabled={isLoading || balanceNum === 0}
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                );
              }
              if (address) {
                return (
                  <div className="balance-info disabled">
                    Balance: <strong>0 {tokenSymbol}</strong>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="transaction-info">
            <div className="info-row">
              <span>Potential winnings</span>
              <span>
                <DisplayFormattedNumber num={auctionPool} significant={6} /> {CONTRACT_CONFIG.strategyCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Minimum bid</span>
              <span>
                <DisplayFormattedNumber num={minBid} significant={6} /> {CONTRACT_CONFIG.wrappedCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Required increase</span>
              <span>10% above current</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {isBidSuccess && <div className="success-message">Bid placed successfully!</div>}
          {isApprovalSuccess && !isBidSuccess && <div className="success-message">Approval successful! You can now place your bid.</div>}

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
          ) : needsApproval ? (
            <button
              type="button"
              className={`submit-button bid ${isLoading ? 'loading' : ''}`}
              onClick={handleApprove}
              disabled={isLoading}
            >
              <div className="button-content">
                {isLoading && <span className="spinner"></span>}
                {isApproving ? 'Waiting for approval' :
                 isApprovalConfirming ? 'Confirming' :
                 isApprovalSuccess ? 'Approved!' :
                 `Approve ${CONTRACT_CONFIG.wrappedCoin.symbol}`}
              </div>
            </button>
          ) : (
            <button
              type="submit"
              className={`submit-button bid ${isLoading ? 'loading' : ''}`}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              <div className="button-content">
                {isLoading && <span className="spinner"></span>}
                {isBidPending ? 'Waiting for approval' :
                 isBidConfirming ? 'Confirming' :
                 isBidSuccess ? 'Success!' :
                 'Place Bid'}
              </div>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
