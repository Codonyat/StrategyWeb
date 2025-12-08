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

export function MintModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState(null);
  const [isApproving, setIsApproving] = useState(false);
  const [useUnlimitedApproval, setUseUnlimitedApproval] = useState(false);
  const inputRef = useRef(null);
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { mint, isPending, isConfirming, isSuccess, isConfirmError, error: txError, confirmError, reset } = useStrategyContract();
  const { isMintingPeriod, backingRatio, maxSupplyValue, supply } = useGlobalContractData();

  // Calculate remaining mintable GIGA (only relevant after minting period)
  const remainingMintable = !isMintingPeriod && maxSupplyValue > 0 ? maxSupplyValue - supply : 0;

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

  // Check if minted output exceeds remaining mintable supply (only after minting period)
  const exceedsRemainingMintable = () => {
    if (isMintingPeriod) return false; // No limit during minting period
    if (remainingMintable <= 0) return false; // Already at max
    if (!amount || parseFloat(amount) <= 0) return false;

    // Calculate what would be minted (before fee)
    const inputAmount = parseFloat(amount);
    const outputBeforeFee = inputAmount / backingRatio;

    return outputBeforeFee > remainingMintable;
  };

  // Update error message when amount changes - prioritize remaining mintable over balance
  useEffect(() => {
    if (exceedsRemainingMintable()) {
      setError(`Amount exceeds remaining mintable ${CONTRACT_CONFIG.strategyCoin.symbol}`);
    } else if (exceedsBalance()) {
      setError(`Amount exceeds your ${CONTRACT_CONFIG.nativeCoin.symbol} balance`);
    } else if (error && error.includes('exceeds')) {
      setError('');
    }
  }, [amount, megaBalance, remainingMintable, backingRatio, isMintingPeriod]);

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

    if (exceedsRemainingMintable()) {
      setError(`Amount exceeds remaining mintable ${CONTRACT_CONFIG.strategyCoin.symbol}`);
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
      await mint(amount);
    } catch (err) {
      if (err.message && err.message.includes('User rejected')) {
        return;
      }
      setError(err.message || 'Failed to mint');
    }
  };

  const handlePercentageClick = (percentage) => {
    if (megaBalance !== undefined && megaBalance !== null) {
      const totalBalance = parseFloat(formatUnits(megaBalance, MEGA_DECIMALS));
      if (percentage === 1.0) {
        setAmount(formatUnits(megaBalance, MEGA_DECIMALS));
      } else {
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
      // During minting period: 1000:1 ratio (1000 MEGA = 1 GIGA) minus 1% fee
      return (inputAmount / 1000) * 0.99;
    } else {
      // After minting period: proportional to backing ratio minus 1% fee
      return inputAmount / backingRatio * 0.99;
    }
  };

  if (!isOpen) return null;

  const isLoading = isPending || (isConfirming && !isConfirmError) || isApprovePending || isApproveConfirming;
  const showSuccessView = isSuccess && amount;
  const showApprovalNeeded = needsApproval() && !isApproveSuccess && amount && parseFloat(amount) > 0;

  // Generate X share URL with prepopulated tweet
  const generateShareUrl = () => {
    const announcementLink = import.meta.env.VITE_ANNOUNCEMENT_LINK || 'https://twitter.com/yourhandle/status/123456789';
    const tweetText = `I just minted GIGA, a strategy coin on MegaETH:\n\n◈ 100% backed by MEGA, redeemable anytime\n◈ with a floor price that can only go up as fees accrue, and\n◈ a daily no-loss lottery for holders.\n\nCheck the launch thread and join in: ${announcementLink}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  };

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

  // Button text logic
  const getButtonText = () => {
    if (isApprovePending) return 'Waiting for approval';
    if (isApproveConfirming) return 'Confirming approval';
    if (isPending) return 'Waiting for confirmation';
    if (isConfirmError) return 'Transaction Failed';
    if (isConfirming) return 'Confirming';
    if (isSuccess && amount) return 'Success!';
    if (showApprovalNeeded) return 'Approve MEGA';
    return 'Deposit MEGA';
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
                    className={`shortcut-btn ${selectedPercentage === 25 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(0.25)}
                    disabled={isLoading || parseFloat(formatUnits(megaBalance, MEGA_DECIMALS)) === 0}
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 50 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(0.5)}
                    disabled={isLoading || parseFloat(formatUnits(megaBalance, MEGA_DECIMALS)) === 0}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    className={`shortcut-btn ${selectedPercentage === 100 ? 'selected' : ''}`}
                    onClick={() => handlePercentageClick(1.0)}
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
              <span>You will receive</span>
              <span>
                ~<DisplayFormattedNumber num={estimatedOutput()} significant={6} /> {CONTRACT_CONFIG.strategyCoin.symbol}
              </span>
            </div>
            <div className="info-row">
              <span>Exchange rate</span>
              <span>{isMintingPeriod ? '1000:1' : <>1:<DisplayFormattedNumber num={1 / backingRatio} significant={4} /></>}</span>
            </div>
            <div className="info-row">
              <span>Fee</span>
              <span>1%</span>
            </div>
            {!isMintingPeriod && remainingMintable > 0 && (
              <div className="info-row">
                <span>Remaining mintable</span>
                <span>
                  <DisplayFormattedNumber num={remainingMintable} significant={6} /> {CONTRACT_CONFIG.strategyCoin.symbol}
                </span>
              </div>
            )}
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
              disabled={isLoading || (isSuccess && amount) || !amount || parseFloat(amount) <= 0 || exceedsRemainingMintable() || exceedsBalance()}
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
