import { useState, useEffect } from 'react';
import { MINTING_END_TIME } from '../config/constants';

export function useMintingCountdown() {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const mintingEndSeconds = Number(MINTING_END_TIME);
      const remaining = mintingEndSeconds - now;

      if (remaining <= 0) {
        setTimeRemaining('Ended');
        setIsActive(false);
        return;
      }

      setIsActive(true);

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
  }, []);

  return { timeRemaining, isActive };
}
