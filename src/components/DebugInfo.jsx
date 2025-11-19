import { useAccount } from 'wagmi';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';
import { useProtocolStats } from '../hooks/useProtocolStats';

export function DebugInfo() {
  const { address, isConnected, chain } = useAccount();
  const stats = useProtocolStats();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999,
      border: '1px solid #0f0'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#0ff' }}>Debug Info</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Wallet:</strong><br/>
        Connected: {isConnected ? 'Yes' : 'No'}<br/>
        Address: {address || 'Not connected'}<br/>
        Chain ID: {chain?.id || 'N/A'}<br/>
        Chain Name: {chain?.name || 'N/A'}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Config:</strong><br/>
        Contract: {CONTRACT_ADDRESS}<br/>
        Chain ID: {CONTRACT_CONFIG.chainId}<br/>
        RPC: {CONTRACT_CONFIG.rpcUrl}
      </div>

      <div>
        <strong>Protocol Stats:</strong><br/>
        Loading: {stats.isLoading ? 'Yes' : 'No'}<br/>
        Error: {stats.hasError ? 'Yes' : 'No'}<br/>
        {stats.error && <span>Error Msg: {stats.error.message}<br/></span>}
        TVL: {stats.tvl.toFixed(4)}<br/>
        Supply: {stats.supply.toFixed(4)}<br/>
        Backing: {stats.backingRatio.toFixed(4)}x<br/>
        Minting: {stats.isMintingPeriod ? 'Yes' : 'No'}<br/>
        Day: {stats.currentDay}
      </div>
    </div>
  );
}
