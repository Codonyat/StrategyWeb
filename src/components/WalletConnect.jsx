import { useWallet } from '../hooks/useWallet';
import './WalletConnect.css';

export const WalletConnect = () => {
  const { address, isConnecting, error, connect, disconnect, isConnected } = useWallet();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="wallet-button"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(address)}</span>
          <button onClick={disconnect} className="wallet-button disconnect">
            Disconnect
          </button>
        </div>
      )}
      {error && <p className="wallet-error">{error}</p>}
    </div>
  );
};
