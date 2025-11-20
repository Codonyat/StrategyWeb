import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { StatusChip } from './StatusChip';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import { DataStrip } from './DataStrip';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { theme } from '../config/contract';
import './Header.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { tvl, supply, backingRatio, isMintingPeriod, isLoading, hasError, error } = useProtocolStats();

  const navItems = [
    { path: '/auctions', label: 'Auctions' },
    { path: '/lottery', label: 'Lottery' },
    { path: '/stats', label: 'Stats' },
    { path: '/how-it-works', label: 'How it works' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="header">
        <div className="header-content">
        <Link to="/" className="header-logo">
          <img
            src={theme.strategyCoin.logoSmall || theme.strategyCoin.logo}
            alt={theme.strategyCoin.name}
            className="logo-icon"
          />
          <div className="logo-text-container">
            <span className="logo-text">Monstr</span>
            <span className="logo-subtitle">Monad Strategy</span>
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
              {isMintingPeriod && (
                <StatusChip
                  label=""
                  value="Minting"
                  type="minting"
                />
              )}
              <StatusChip
                label="Backing"
                value={
                  <>
                    x<DisplayFormattedNumber num={backingRatio} significant={3} />
                  </>
                }
                type="active"
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
