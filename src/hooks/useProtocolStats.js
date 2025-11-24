import { useGlobalContractData } from './useGlobalContractData';

/**
 * Protocol stats hook - now uses centralized global contract data.
 * This eliminates redundant RPC calls and standardizes polling to 30s.
 *
 * @deprecated Consider using useGlobalContractData directly for better performance.
 * This hook is kept for backward compatibility.
 */
export function useProtocolStats() {
  const {
    tvl,
    supply,
    backingRatio,
    isMintingPeriod,
    currentDayNumber,
    isLoading,
    hasError,
    error,
  } = useGlobalContractData();

  return {
    tvl,
    supply,
    backingRatio,
    isMintingPeriod,
    currentDay: currentDayNumber,
    isLoading,
    hasError,
    error,
  };
}
