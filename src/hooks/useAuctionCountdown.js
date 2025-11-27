import { useState, useEffect } from 'react';
import contractConstants from '../config/contract-constants.json';
import { PSEUDO_DAY_SECONDS } from '../config/contract';
import { useProtocolStats } from './useProtocolStats';
const LOTTERY_GAP_SECONDS = 60; // 1 minute gap

export function useAuctionCountdown() {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [nextAuctionTime, setNextAuctionTime] = useState(0);
  const { currentDay } = useProtocolStats();

  useEffect(() => {
    if (currentDay === undefined) return;

    const deploymentTime = Number(contractConstants.deploymentTime);

    // Auction ends at the same time as lottery can be executed
    // Next auction end time: deploymentTime + ((currentDay + 1) * 90000) + 60
    const nextAuction = deploymentTime + ((currentDay + 1) * PSEUDO_DAY_SECONDS) + LOTTERY_GAP_SECONDS;
    setNextAuctionTime(nextAuction);

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = nextAuction - now;

      if (remaining <= 0) {
        setTimeRemaining('Ended');
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentDay]);

  return { timeRemaining, nextAuctionTime };
}
