import { useMemo } from 'react';
import { formatEther } from 'viem';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import { useGlobalContractData } from '../hooks/useGlobalContractData';
import { useSharedPrizeData } from '../hooks/useSharedPrizeData';
import contractConstants from '../config/contract-constants.json';
import './DataStrip.css';

/**
 * DataStrip component - now uses centralized data hooks.
 * All RPC calls eliminated - uses useGlobalContractData and useSharedPrizeData.
 * This significantly reduces network load and prevents duplicate subscriptions.
 */
export function DataStrip() {
  // Use centralized global data (no RPC calls here!)
  const {
    supply,
    tvl,
    feesPoolAmount,
  } = useGlobalContractData();

  // Use shared prize data for lottery winner
  const { lotteryWinners, lotteryAmounts } = useSharedPrizeData();

  // Memoized calculations
  const { timeUntilDraw, lastLotteryWinner } = useMemo(() => {
    // Calculate time until next lottery draw
    const calculateTimeUntilDraw = () => {
      const now = Math.floor(Date.now() / 1000);
      const deploymentTime = Number(contractConstants.deploymentTime);
      const pseudoDayLength = 90000; // 25 hours

      const timeSinceDeployment = now - deploymentTime;
      const timeUntilNextDraw = pseudoDayLength - (timeSinceDeployment % pseudoDayLength);

      const hours = Math.floor(timeUntilNextDraw / 3600);
      const minutes = Math.floor((timeUntilNextDraw % 3600) / 60);

      return `${hours}h ${minutes}m`;
    };

    // Format address
    const formatAddress = (addr) => {
      if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'None';
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    // Get last lottery winner
    const getLastLotteryWinner = () => {
      if (!lotteryWinners || !lotteryAmounts) return 'None';

      // Find the most recent non-zero winner
      for (let i = 6; i >= 0; i--) {
        if (lotteryWinners[i] !== '0x0000000000000000000000000000000000000000' && lotteryAmounts[i] > 0n) {
          return formatAddress(lotteryWinners[i]);
        }
      }
      return 'None';
    };

    return {
      timeUntilDraw: calculateTimeUntilDraw(),
      lastLotteryWinner: getLastLotteryWinner(),
    };
  }, [lotteryWinners, lotteryAmounts]);

  return (
    <div className="data-strip">
      <div className="data-strip-content">
        <span className="ticker-item">
          <span className="ticker-label">Supply</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={supply} significant={3} /> MONSTR
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Reserve</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={tvl} significant={3} /> MON
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Next draw</span>{' '}
          <span className="ticker-value">{timeUntilDraw}</span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Daily fees</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={feesPoolAmount} significant={3} /> MONSTR
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">MONSTR price</span>{' '}
          <span className="ticker-value">N/A</span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">MON price</span>{' '}
          <span className="ticker-value">N/A</span>
        </span>

      </div>
    </div>
  );
}
