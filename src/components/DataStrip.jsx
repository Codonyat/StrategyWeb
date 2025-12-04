import { useMemo, useState, useEffect } from 'react';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import { useGlobalContractData } from '../hooks/useGlobalContractData';
import { useSharedPrizeData } from '../hooks/useSharedPrizeData';
import { useNativePrice } from '../hooks/useNativePrice';
import contractConstants from '../config/contract-constants.json';
import { PSEUDO_DAY_SECONDS } from '../config/contract';
import './DataStrip.css';

const LOTTERY_GAP_SECONDS = 60; // 1 minute gap before lottery can execute

// Pure function to calculate time until draw (no network calls)
function calculateTimeUntilDraw() {
  const now = Math.floor(Date.now() / 1000);
  const deploymentTime = Number(contractConstants.deploymentTime);

  const timeSinceDeployment = now - deploymentTime;
  const timeUntilDayBoundary = PSEUDO_DAY_SECONDS - (timeSinceDeployment % PSEUDO_DAY_SECONDS);
  const timeUntilNextDraw = timeUntilDayBoundary + LOTTERY_GAP_SECONDS;

  const hours = Math.floor(timeUntilNextDraw / 3600);
  const minutes = Math.floor((timeUntilNextDraw % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

/**
 * DataStrip component - now uses centralized data hooks.
 * All RPC calls eliminated - uses useGlobalContractData and useSharedPrizeData.
 * This significantly reduces network load and prevents duplicate subscriptions.
 */
export function DataStrip() {
  // Use centralized global data (no RPC calls here!)
  const {
    supply,
    maxSupplyValue,
    tvl,
    feesPoolAmount,
    isMintingPeriod,
  } = useGlobalContractData();

  // Use shared prize data for lottery winner
  const { lotteryWinners, lotteryAmounts } = useSharedPrizeData();

  // Get native token price from Alchemy
  const { price: nativePrice } = useNativePrice();

  // Live countdown timer - updates every minute (no network calls)
  const [timeUntilDraw, setTimeUntilDraw] = useState(calculateTimeUntilDraw);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilDraw(calculateTimeUntilDraw());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Memoized calculation for last lottery winner
  const lastLotteryWinner = useMemo(() => {
    const formatAddress = (addr) => {
      if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'None';
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    if (!lotteryWinners || !lotteryAmounts) return 'None';

    // Find the most recent non-zero winner
    for (let i = 6; i >= 0; i--) {
      if (lotteryWinners[i] !== '0x0000000000000000000000000000000000000000' && lotteryAmounts[i] > 0n) {
        return formatAddress(lotteryWinners[i]);
      }
    }
    return 'None';
  }, [lotteryWinners, lotteryAmounts]);

  return (
    <div className="data-strip">
      <div className="data-strip-content">
        {!isMintingPeriod && (
          <>
            <span className="ticker-item">
              <span className="ticker-label">Max supply</span>{' '}
              <span className="ticker-value">
                <DisplayFormattedNumber num={maxSupplyValue} significant={3} /> GIGA
              </span>
            </span>

            <span className="ticker-separator">•</span>
          </>
        )}

        <span className="ticker-item has-tooltip" tabIndex={0}>
          <span className="ticker-label">Supply</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={supply} significant={3} /> GIGA
          </span>
          <span className="ticker-tooltip">
            {isMintingPeriod
              ? 'Total GIGA minted. Max supply will be set when minting phase ends.'
              : 'Total GIGA in circulation. Minting is capped at max supply.'}
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item has-tooltip" tabIndex={0}>
          <span className="ticker-label">Reserve</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={tvl} significant={3} /> MEGA
          </span>
          <span className="ticker-tooltip">
            MEGA backing all GIGA tokens. Grows from mint deposits, burn fees, and transfer fees. Sets the floor price for GIGA redemptions.
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item has-tooltip" tabIndex={0}>
          <span className="ticker-label">Next draw</span>{' '}
          <span className="ticker-value">{timeUntilDraw}</span>
          <span className="ticker-tooltip">
            When the daily lottery winner is drawn and any active auction ends.
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Daily fees</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={feesPoolAmount} significant={3} /> GIGA
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">GIGA price</span>{' '}
          <span className="ticker-value">N/A</span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">MEGA price</span>{' '}
          <span className="ticker-value">
            {nativePrice !== null ? <><DisplayFormattedNumber num={nativePrice} significant={3} /> USD</> : 'N/A'}
          </span>
        </span>

      </div>
    </div>
  );
}
