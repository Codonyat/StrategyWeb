import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { StatusChip } from './StatusChip';
import { StatusCapsule } from './StatusCapsule';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import { DataStrip } from './DataStrip';
import { AnimatedLogo } from './AnimatedLogo';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { useMintingCountdown } from '../hooks/useMintingCountdown';
import { CONTRACT_CONFIG } from '../config/contract';
import './Header.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { tvl, supply, backingRatio, isMintingPeriod, isBackingFixed, isLoading, hasError, error } = useProtocolStats();
  const { timeRemaining, isActive: isMintingActive } = useMintingCountdown();

  const navItems = [
    { path: '/lottery', label: 'Lottery' },
    { path: '/auctions', label: 'Auctions' },
    { path: '/faq', label: 'FAQ' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="header">
        <div className="header-content">
        <Link to="/" className="header-logo">
          <AnimatedLogo />
          <div className="logo-text-container">
            <span className="logo-text">GigaETH</span>
            <span className="logo-subtitle">MegaETH Strategy</span>
          </div>
        </Link>

        {/* Status Chips - Only show when data is available or loading */}
        {!hasError && (
          <div className="status-chips">
            {isLoading ? (
              <StatusChip
                label=""
                value="Loading..."
                type="default"
              />
            ) : (
            <>
              <StatusCapsule
                leftLabel="Backing"
                leftValue={isBackingFixed ? "1:1000" : `1:${Math.floor(backingRatio)}`}
                leftTooltip={
                  <>
                    Backing ratio: <strong>1 GIGA = {isBackingFixed ? "1000" : <DisplayFormattedNumber num={backingRatio} significant={3} />} MEGA</strong>. Each GIGA can be redeemed for this amount of MEGA from the reserve.
                  </>
                }
                rightLabel={isMintingPeriod && isMintingActive ? "Minting ends in" : "Exchange"}
                rightValue={isMintingPeriod && isMintingActive ? timeRemaining : "N/A"}
                rightTooltip={isMintingPeriod && isMintingActive ? "Initial minting period with 1:1000 ratio. After this ends, supply becomes fixed - new minting only possible when GIGA is burned to free up backing." : "Exchange rate between GIGA and MEGA. Coming soon."}
                fixedWidth={isMintingPeriod && isMintingActive}
              />
              </>
            )}
          </div>
        )}

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Wallet Connect */}
        <div className="header-right">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              const wrongNetwork = connected && chain.id !== CONTRACT_CONFIG.chainId;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button onClick={openConnectModal} className="wallet-connect-btn">
                          Connect Wallet
                        </button>
                      );
                    }

                    if (wrongNetwork) {
                      return (
                        <button onClick={openChainModal} className="wallet-wrong-network-btn">
                          <span className="warning-icon">⚠</span>
                          <span>Wrong Network</span>
                        </button>
                      );
                    }

                    return (
                      <button onClick={openAccountModal} className="wallet-connected-btn">
                        <span className="wallet-address-display">
                          {account.displayName}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
          <button
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="nav-mobile">
          {/* Status Capsule in Mobile Menu (visible only <430px) */}
          {!hasError && !isLoading && (
            <div className="nav-mobile-stats">
              <StatusCapsule
                leftLabel="Backing"
                leftValue={isBackingFixed ? "1:1000" : `1:${Math.floor(backingRatio)}`}
                leftTooltip={
                  <>
                    Backing ratio: <strong>1 GIGA = {isBackingFixed ? "1000" : <DisplayFormattedNumber num={backingRatio} significant={3} />} MEGA</strong>. Each GIGA can be redeemed for this amount of MEGA from the reserve.
                  </>
                }
                rightLabel={isMintingPeriod && isMintingActive ? "Minting ends in" : "Exchange"}
                rightValue={isMintingPeriod && isMintingActive ? timeRemaining : "N/A"}
                rightTooltip={isMintingPeriod && isMintingActive ? "Initial minting period with 1:1000 ratio. After this ends, supply becomes fixed - new minting only possible when GIGA is burned to free up backing." : "Exchange rate between GIGA and MEGA. Coming soon."}
                fixedWidth={isMintingPeriod && isMintingActive}
              />
            </div>
          )}

          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      </header>

      {/* Data Strip */}
      <DataStrip />
    </>
  );
}
