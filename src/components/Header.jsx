import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import { theme } from '../config/contract';
import './Header.css';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/auctions', label: 'Auctions' },
    { path: '/lottery', label: 'Lottery' },
    { path: '/stats', label: 'Stats' },
    { path: '/how-it-works', label: 'How it works' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="header-logo">
          <img
            src={theme.strategyCoin.logoSmall || theme.strategyCoin.logo}
            alt={theme.strategyCoin.name}
            className="logo-icon"
          />
          <span className="logo-text">Monad Strategy</span>
        </Link>

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
          <WalletConnect />
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
  );
}
