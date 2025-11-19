import { useAccount, useConnect, useDisconnect } from 'wagmi';
import './WalletConnect.css';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.type === 'injected');
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isPending}
          className="btn btn-primary btn-sm"
        >
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-info">
          <span className="wallet-address">{formatAddress(address)}</span>
          <button onClick={() => disconnect()} className="btn btn-error btn-sm">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
