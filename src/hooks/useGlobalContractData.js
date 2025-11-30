import { useMemo, useState, useEffect } from 'react';
import { useReadContract, useBalance } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { CONTRACT_CONFIG, CONTRACT_ADDRESS, PSEUDO_DAY_SECONDS } from '../config/contract';
import contractConstants from '../config/contract-constants.json';

// FEES_POOL synthetic address where fees accumulate
const FEES_POOL = '0x00000000000fee50000000AdD2E5500000000000';

// Standardized polling interval: 30 seconds
const POLLING_INTERVAL = 30000;

// Minting period constants from contract
const DEPLOYMENT_TIME = Number(contractConstants.deploymentTime);
const MINTING_PERIOD = Number(contractConstants.MINTING_PERIOD);
const MINTING_END_TIME = DEPLOYMENT_TIME + MINTING_PERIOD;

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function maxSupplyEver() view returns (uint256)',
  'function getCurrentDay() view returns (uint256)',
  'function currentLotteryPool() view returns (uint256)',
  'function currentAuction() view returns (address currentBidder, uint96 currentBid, uint96 minBid, uint112 monstrAmount, uint8 auctionDay)',
  'function balanceOf(address) view returns (uint256)',
]);

/**
 * Centralized hook for global contract data shared across the app.
 * Replaces redundant calls from useProtocolStats, DataStrip, and other hooks.
 * Uses standardized 30s polling interval and memoized calculations.
 */
export function useGlobalContractData() {
  // Track current time for minting period calculation
  const [currentTime, setCurrentTime] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Get total supply of MONSTR tokens
  const { data: totalSupply, error: totalSupplyError, isLoading: totalSupplyLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'totalSupply',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get max supply cap
  const { data: maxSupply, error: maxSupplyError, isLoading: maxSupplyLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'maxSupplyEver',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get MON balance of the contract (TVL)
  const { data: monBalance, error: balanceError, isLoading: balanceLoading } = useBalance({
    address: CONTRACT_ADDRESS,
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get current day
  const { data: currentDay, error: currentDayError, isLoading: currentDayLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getCurrentDay',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get FEES_POOL balance (where fees accumulate)
  const { data: feesPoolBalance, error: feesPoolError, isLoading: feesPoolLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'balanceOf',
    args: [FEES_POOL],
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get lottery pool
  const { data: lotteryPool, error: lotteryPoolError, isLoading: lotteryPoolLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'currentLotteryPool',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get current auction data
  const { data: currentAuction, error: auctionError, isLoading: auctionLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'currentAuction',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Memoized calculations to prevent unnecessary re-renders
  const calculations = useMemo(() => {
    const tvl = monBalance?.value ? parseFloat(formatEther(monBalance.value)) : 0;
    const supply = totalSupply ? parseFloat(formatEther(totalSupply)) : 0;
    const maxSupplyValue = maxSupply ? parseFloat(formatEther(maxSupply)) : 0;
    const backingRatio = supply > 0 ? tvl / supply : 0;
    const isMintingPeriod = currentTime < MINTING_END_TIME;
    // Check if supply has reached max (with small tolerance for rounding)
    const isAtMaxSupply = maxSupplyValue > 0 && supply >= maxSupplyValue - 0.000001;
    const currentDayNumber = currentDay ? Number(currentDay) : 0;
    // Calculate which day is the last day of minting period
    const mintingEndDay = Math.floor(MINTING_PERIOD / PSEUDO_DAY_SECONDS);
    // On the minting end day, show preview UI for entire day (even after minting time passes)
    const isLastMintingDay = currentDayNumber === mintingEndDay;
    // Auctions can only happen starting the day AFTER minting ends
    const isAuctionActive = currentDayNumber > mintingEndDay;
    const feesPoolAmount = feesPoolBalance ? parseFloat(formatEther(feesPoolBalance)) : 0;
    const lotteryPoolAmount = lotteryPool ? parseFloat(formatEther(lotteryPool)) : 0;

    // Process auction data
    const auctionPool = currentAuction && currentAuction[3] ? parseFloat(formatEther(currentAuction[3])) : 0;
    const currentBid = currentAuction && currentAuction[1] ? parseFloat(formatEther(currentAuction[1])) : 0;
    const minBid = currentAuction && currentAuction[2] ? parseFloat(formatEther(currentAuction[2])) : 0;
    const currentBidder = currentAuction ? currentAuction[0] : null;
    const auctionDay = currentAuction && currentAuction[4] !== undefined ? Number(currentAuction[4]) : 0;

    // Auction staleness detection:
    // - auctionDay is the day whose fees are being auctioned (set as currentDay - 1 when auction starts)
    // - A valid current auction has auctionDay == currentDayNumber - 1
    // - If auctionDay < currentDayNumber - 1, the auction is stale (from a previous day)
    // - If auctionDay == 0 and we're past minting, no auction has started yet
    const isAuctionStale = isAuctionActive && auctionDay > 0 && auctionDay < currentDayNumber - 1;
    const needsLotteryExecution = isAuctionActive && (auctionDay === 0 || auctionDay < currentDayNumber - 1);

    // Estimated next auction pool is 50% of accumulated fees in FEES_POOL
    const estimatedNextAuctionPool = feesPoolAmount * 0.5;

    return {
      tvl,
      supply,
      maxSupplyValue,
      backingRatio,
      isMintingPeriod,
      isAtMaxSupply,
      isLastMintingDay,
      isAuctionActive,
      currentDayNumber,
      feesPoolAmount,
      lotteryPoolAmount,
      auctionPool,
      currentBid,
      minBid,
      currentBidder,
      auctionDay,
      isAuctionStale,
      needsLotteryExecution,
      estimatedNextAuctionPool,
    };
  }, [monBalance, totalSupply, maxSupply, currentDay, feesPoolBalance, lotteryPool, currentAuction, currentTime]);

  // Aggregate errors and loading states
  const hasError =
    totalSupplyError ||
    maxSupplyError ||
    balanceError ||
    currentDayError ||
    feesPoolError ||
    lotteryPoolError ||
    auctionError;

  const isLoading =
    totalSupplyLoading ||
    maxSupplyLoading ||
    balanceLoading ||
    currentDayLoading ||
    feesPoolLoading ||
    lotteryPoolLoading ||
    auctionLoading;

  // Debug logging for errors
  if (typeof window !== 'undefined' && hasError) {
    console.error('Global Contract Data Errors:', {
      contractAddress: CONTRACT_ADDRESS,
      chainId: CONTRACT_CONFIG.chainId,
      errors: {
        totalSupply: totalSupplyError?.message,
        maxSupply: maxSupplyError?.message,
        balance: balanceError?.message,
        currentDay: currentDayError?.message,
        feesPool: feesPoolError?.message,
        lotteryPool: lotteryPoolError?.message,
        auction: auctionError?.message,
      },
    });
  }

  return {
    // Raw data
    totalSupply,
    maxSupply,
    monBalance,
    currentDay,
    feesPoolBalance,
    lotteryPool,
    currentAuction,

    // Calculated values
    ...calculations,

    // Status
    isLoading,
    hasError,
    error: hasError ? (
      totalSupplyError ||
      maxSupplyError ||
      balanceError ||
      currentDayError ||
      feesPoolError ||
      lotteryPoolError ||
      auctionError
    ) : null,
  };
}
