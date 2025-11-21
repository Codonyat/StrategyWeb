import { useReadContract, useBalance } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS } from '../config/contract';

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function getCurrentDay() view returns (uint256)',
]);

export function useProtocolStats() {
  // Get total supply of MONSTR tokens (public view function)
  const { data: totalSupply, error: totalSupplyError, isLoading: totalSupplyLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'totalSupply',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 60000, // Refetch every 60 seconds (1 minute)
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get MON balance of the contract (TVL) - public data
  const { data: monBalance, error: balanceError, isLoading: balanceLoading } = useBalance({
    address: CONTRACT_ADDRESS,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 60000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get current day (public view function)
  const { data: currentDay, error: currentDayError, isLoading: currentDayLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getCurrentDay',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 60000,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Calculate stats
  const tvl = monBalance?.value ? parseFloat(formatEther(monBalance.value)) : 0;
  const supply = totalSupply ? parseFloat(formatEther(totalSupply)) : 0;
  const backingRatio = supply > 0 ? tvl / supply : 0;

  // Check if in minting period (first day, currentDay === 0)
  const isMintingPeriod = currentDay === 0n;

  const hasError = totalSupplyError || balanceError || currentDayError;
  const isLoading = totalSupplyLoading || balanceLoading || currentDayLoading;

  // Debug logging (only log once when data changes, not on every render)
  if (typeof window !== 'undefined') {
    if (hasError) {
      console.error('Protocol Stats Errors:', {
        contractAddress: CONTRACT_ADDRESS,
        chainId: CONTRACT_CONFIG.chainId,
        totalSupplyError: totalSupplyError?.message || totalSupplyError,
        balanceError: balanceError?.message || balanceError,
        currentDayError: currentDayError?.message || currentDayError,
      });
    }
  }

  return {
    tvl,
    supply,
    backingRatio,
    isMintingPeriod,
    currentDay: currentDay ? Number(currentDay) : 0,
    isLoading,
    hasError,
    error: totalSupplyError || balanceError || currentDayError,
  };
}
