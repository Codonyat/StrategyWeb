import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatUnits, parseAbi } from 'viem';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { MintModal } from '../components/MintModal';
import { BurnModal } from '../components/BurnModal';
import { useRealtimeTransactions } from '../hooks/useRealtimeTransactions';
import { useGlobalContractData } from '../hooks/useGlobalContractData';
import { DisplayFormattedNumber } from '../components/DisplayFormattedNumber';
import { EnsAddress } from '../components/EnsAddress';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
import contractConstants from '../config/contract-constants.json';
import './Landing.css';

// Calculate minting period in days from contract constants
const mintingPeriodDays = Math.round(Number(contractConstants.MINTING_PERIOD) / 86400);

// Simple ABI for balanceOf
const parsedAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);

// Mock mint ABI for testnet MEGA
const mockMintAbi = parseAbi(['function mint()']);

// MEGA token address
const megaTokenAddress = CONTRACT_CONFIG.megaTokenAddress;

export default function Landing() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [showStrategy, setShowStrategy] = useState(false);
  const [hoverState, setHoverState] = useState(null); // 'deposit', 'withdraw', or null
  const [animationTimeout, setAnimationTimeout] = useState(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);

  // Fetch user balances
  // Get MEGA balance (ERC20 token)
  const { data: megaBalance } = useReadContract({
    address: megaTokenAddress,
    abi: parsedAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!megaTokenAddress,
      refetchInterval: 10000,
    },
  });

  // Get GIGA balance
  const { data: monstrBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESS,
      refetchInterval: 10000,
    },
  });

  // Format balances (MEGA uses 18 decimals, GIGA uses 21 decimals)
  const megaValue = megaBalance ? parseFloat(formatUnits(megaBalance, CONTRACT_CONFIG.nativeCoin.decimals)) : 0;
  const monstrValue = monstrBalance ? parseFloat(formatUnits(monstrBalance, CONTRACT_CONFIG.strategyCoin.decimals)) : 0;

  // Mock MEGA mint for testnet (chainId 6343)
  const { writeContract: mintMockMega, isPending: isMintingMockMega } = useWriteContract();
  const isTestnet = chainId === 6343;

  const handleMintMockMega = () => {
    if (!megaTokenAddress) return;
    mintMockMega({
      address: megaTokenAddress,
      abi: mockMintAbi,
      functionName: 'mint',
    });
  };

  // Fetch recent transactions via WebSocket (real-time) or fallback to loading state
  const { transactions, loading: txLoading, connected } = useRealtimeTransactions(10);

  // Check if max supply has been reached or minting is disabled
  const { isAtMaxSupply, isMintingPeriod, maxSupplyValue, supply } = useGlobalContractData();
  // Disable minting if at max supply OR if minting period is over and max supply not yet set
  const isMintingDisabled = isAtMaxSupply || (!isMintingPeriod && maxSupplyValue === 0);
  // Calculate remaining mintable GIGA (only relevant after minting period when supply < max)
  const remainingMintable = maxSupplyValue > 0 ? maxSupplyValue - supply : 0;

  // Force re-render every minute to update "time ago" timestamps
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to format time ago
  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - parseInt(timestamp);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  // Helper function to truncate address
  const truncateAddress = (address) => {
    if (!address) return '0x0000...0000';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Compact address for mobile (0x + first 2 + last 2 hex chars)
  const compactAddress = (address) => {
    if (!address) return '0x00..00';
    return `${address.slice(0, 4)}..${address.slice(-2)}`;
  };

  const handleCoinClick = () => {
    setShowStrategy(!showStrategy);
  };

  const handleDepositHover = () => {
    // Clear any ongoing animation
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      setAnimationTimeout(null);
    }

    // Only animate if not already showing GIGA or if currently animating
    if (!showStrategy || hoverState === 'withdraw') {
      setHoverState('deposit');
      // After animation completes, update the permanent state
      const timeout = setTimeout(() => {
        setShowStrategy(true);
        setHoverState(null);
        setAnimationTimeout(null);
      }, 1200);
      setAnimationTimeout(timeout);
    }
  };

  const handleWithdrawHover = () => {
    // Clear any ongoing animation
    if (animationTimeout) {
      clearTimeout(animationTimeout);
      setAnimationTimeout(null);
    }

    // Only animate if not already showing MON or if currently animating
    if (showStrategy || hoverState === 'deposit') {
      setHoverState('withdraw');
      // After animation completes, update the permanent state
      const timeout = setTimeout(() => {
        setShowStrategy(false);
        setHoverState(null);
        setAnimationTimeout(null);
      }, 1200);
      setAnimationTimeout(timeout);
    }
  };

  const handleButtonLeave = () => {
    // Don't reset on leave - let the animation complete
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section page-header-section">
        <div className="hero-wrapper page-header-content">
          <p className="page-tagline">
            100% backed by MEGA, withdraw anytime, up-only price.
          </p>

          {/* Balance Strip - Only show if wallet connected */}
          {address && (
            <div className="balances-strip">
              <span className="balances-label">Your balances:</span>
              <div className="balance-item">
                <img src="/coins/mega-icon.png" alt="MEGA" className="balance-icon" />
                <span className="balance-value"><DisplayFormattedNumber num={megaValue} significant={3} /> MEGA</span>
              </div>
              <span className="balance-separator">·</span>
              <div className="balance-item">
                <img src="/coins/giga-icon.png" alt="GIGA" className="balance-icon" />
                <span className="balance-value"><DisplayFormattedNumber num={monstrValue} significant={3} /> GIGA</span>
              </div>
              {isTestnet && megaTokenAddress && (
                <>
                  <span className="balance-separator">·</span>
                  <button
                    className="mock-mint-btn"
                    onClick={handleMintMockMega}
                    disabled={isMintingMockMega}
                  >
                    {isMintingMockMega ? 'Minting...' : 'Mint Mock MEGA'}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="hero-content-grid">
            {/* Left Side - Coin Flip */}
            <div className="hero-left">
              <div className="coin-area">
              <div
                className={`coin-container ${showStrategy ? 'flipped' : ''} ${hoverState === 'deposit' ? 'hover-deposit' : ''} ${hoverState === 'withdraw' ? 'hover-withdraw' : ''}`}
                onClick={handleCoinClick}
              >
                <div className="coin-face coin-native">
                  <img
                    src={"/coins/mega.jpg"}
                    alt={"MEGA"}
                    className="coin-image"
                  />
                </div>
                <div className="coin-face coin-strategy">
                  <img
                    src={"/coins/giga.jpg"}
                    alt={"GIGA"}
                    className="coin-image"
                  />
                </div>
              </div>

              <div className="coin-actions">
                {isMintingDisabled ? (
                  <button
                    className="action-btn deposit-btn disabled"
                    disabled
                  >
                    <span className="action-line-single">Max supply reached</span>
                  </button>
                ) : (
                  <div className="mint-action-wrapper">
                    <button
                      className="action-btn deposit-btn"
                      onMouseEnter={handleDepositHover}
                      onMouseLeave={handleButtonLeave}
                      onClick={() => setIsMintModalOpen(true)}
                    >
                      <span className="action-line">Deposit MEGA</span>
                      <span className="action-line">Mint GIGA</span>
                    </button>
                    {!isMintingPeriod && remainingMintable > 0 && (
                      <span className="mintable-info">
                        <DisplayFormattedNumber num={remainingMintable} significant={3} /> GIGA remaining
                      </span>
                    )}
                  </div>
                )}
                <button
                  className="action-btn withdraw-btn"
                  onMouseEnter={handleWithdrawHover}
                  onMouseLeave={handleButtonLeave}
                  onClick={() => setIsBurnModalOpen(true)}
                >
                  <span className="action-line">Burn GIGA</span>
                  <span className="action-line">Withdraw MEGA</span>
                </button>
              </div>
              </div>
            </div>

            {/* Right Side - Recent Transactions */}
            <div className="hero-right">
            <div className="transactions-wrapper">
              {connected && <div className="live-indicator"><span className="live-dot"></span>LIVE</div>}
              <div className="transactions-list">
              {txLoading && transactions.length === 0 ? (
                <div className="transaction-row">
                  <span className="tx-type">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="transaction-row">
                  <span className="tx-type">No recent transactions</span>
                </div>
              ) : (
                transactions.slice(0, 7).map((tx, index) => {
                  const isFaded = index >= 4;
                  const isDesktopOnly = index >= 5;
                  const type = tx.type.toLowerCase();
                  // Map transaction types for display
                  const displayType = type === 'redeem' ? 'burn' :
                                     type === 'transfer' ? 'fee' : type;
                  const formattedAmount = formatUnits(BigInt(tx.tokenAmount), 21);
                  const sign = type === 'mint' ? '+' :
                              type === 'transfer' ? '' : '-';

                  return (
                    <div
                      key={tx.id}
                      className={`transaction-row ${displayType} ${isFaded ? 'fade' : ''} ${isDesktopOnly ? 'desktop-only' : ''} ${tx.isNew ? 'new' : ''}`}
                    >
                      <span className="tx-indicator"></span>
                      <span className="tx-type">{displayType.toUpperCase()}</span>
                      <a
                        href={`${CONTRACT_CONFIG.explorerUrl}/address/${tx.user}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tx-address"
                      >
                        <EnsAddress address={tx.user} format="medium" className="tx-address-full" />
                        <EnsAddress address={tx.user} format="compact" className="tx-address-compact" />
                      </a>
                      <span className="tx-time">{formatTimeAgo(tx.timestamp)}</span>
                      <span className="tx-amount">{sign}<DisplayFormattedNumber num={formattedAmount} significant={3} /> GIGA</span>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Mini Explainer Section */}
      <section className="explainer-section">
        <div className="explainer-content">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
          <div className="step-card" tabIndex="0">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3 className="step-title">Deposit MEGA to mint</h3>
              <p className="step-description">
                <strong>Mint GIGA</strong> at 1:1000 for first 24h, then at backing ratio
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">Backing grows from day 1</h3>
              <p className="step-description">
                <strong>Backing ratio increases</strong> as fees accumulate from auctions
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3 className="step-title">No-loss lottery daily</h3>
              <p className="step-description">
                Daily <strong>lottery</strong> raffle of fees to random holders
              </p>
            </div>
          </div>
          <div className="step-card" tabIndex="0">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3 className="step-title">Withdraw MEGA anytime</h3>
              <p className="step-description">
                <strong>Withdraw</strong> by burning tokens at backing ratio
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Modals */}
      <MintModal isOpen={isMintModalOpen} onClose={() => setIsMintModalOpen(false)} />
      <BurnModal isOpen={isBurnModalOpen} onClose={() => setIsBurnModalOpen(false)} />
    </div>
  );
}
