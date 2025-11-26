import { useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';

/**
 * Displays an address with ENS resolution
 * Shows ENS name if available, otherwise shows address in specified format
 */
export function EnsAddress({ address, format = 'full', className = '' }) {
  const { data: ensName, isLoading } = useEnsName({
    address,
    chainId: mainnet.id, // ENS is on mainnet
  });

  // Format address based on format prop
  const formatAddress = (addr) => {
    if (!addr) return '';
    switch (format) {
      case 'compact':
        return `${addr.slice(0, 4)}..${addr.slice(-2)}`;
      case 'medium':
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      case 'full':
      default:
        return addr;
    }
  };

  if (isLoading) {
    return <span className={className}>{formatAddress(address)}</span>;
  }

  return (
    <span className={className}>
      {ensName || formatAddress(address)}
    </span>
  );
}
