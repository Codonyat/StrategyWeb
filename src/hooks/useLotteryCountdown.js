import { useState, useEffect } from 'react';
import contractConstants from '../config/contract-constants.json';
import { PSEUDO_DAY_SECONDS } from '../config/contract';
import { useProtocolStats } from './useProtocolStats';
const LOTTERY_GAP_SECONDS = 60; // 1 minute gap

export function useLotteryCountdown() {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [nextDrawTime, setNextDrawTime] = useState(0);
  const { currentDay } = useProtocolStats();

  useEffect(() => {
    if (currentDay === undefined) return;

    const deploymentTime = Number(contractConstants.deploymentTime);

    // Calculate next lottery time
    // Next lottery happens at: deploymentTime + ((currentDay + 1) * 90000) + 60
    const nextLottery = deploymentTime + ((currentDay + 1) * PSEUDO_DAY_SECONDS) + LOTTERY_GAP_SECONDS;
    setNextDrawTime(nextLottery);

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = nextLottery - now;

      if (remaining <= 0) {
        setTimeRemaining('Ready');
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

  return { timeRemaining, nextDrawTime };
}
