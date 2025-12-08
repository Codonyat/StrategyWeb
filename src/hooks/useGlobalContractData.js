import { useMemo, useState, useEffect, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
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

// Token decimals
const GIGA_DECIMALS = CONTRACT_CONFIG.strategyCoin.decimals; // 21
const MEGA_DECIMALS = CONTRACT_CONFIG.nativeCoin.decimals;   // 18

// Parse the human-readable ABI once
const parsedAbi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function maxSupplyEver() view returns (uint256)',
  'function getCurrentDay() view returns (uint256)',
  'function currentLotteryPool() view returns (uint256)',
  'function currentAuction() view returns (address currentBidder, uint96 currentBid, uint96 minBid, uint112 auctionTokens, uint8 auctionDay)',
  'function balanceOf(address) view returns (uint256)',
  'function getMegaReserve() view returns (uint256)',
  'function lastLotteryDay() view returns (uint32)',
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
  const { data: totalSupply, error: totalSupplyError, isLoading: totalSupplyLoading, refetch: refetchTotalSupply } = useReadContract({
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
  const { data: maxSupply, error: maxSupplyError, isLoading: maxSupplyLoading, refetch: refetchMaxSupply } = useReadContract({
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

  // Get MEGA reserve (TVL) - uses getMegaReserve() which excludes escrowed bid amounts
  const { data: megaReserve, error: balanceError, isLoading: balanceLoading, refetch: refetchMegaReserve } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getMegaReserve',
    chainId: CONTRACT_CONFIG.chainId,
    query: {
      enabled: !!CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: POLLING_INTERVAL,
      retry: 3,
      retryDelay: 1000,
    },
  });

  // Get current day
  const { data: currentDay, error: currentDayError, isLoading: currentDayLoading, refetch: refetchCurrentDay } = useReadContract({
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
  const { data: feesPoolBalance, error: feesPoolError, isLoading: feesPoolLoading, refetch: refetchFeesPool } = useReadContract({
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
  const { data: lotteryPool, error: lotteryPoolError, isLoading: lotteryPoolLoading, refetch: refetchLotteryPool } = useReadContract({
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
  const { data: currentAuction, error: auctionError, isLoading: auctionLoading, refetch: refetchAuction } = useReadContract({
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

  // Get last lottery day (to detect pending lottery during minting)
  const { data: lastLotteryDay, error: lastLotteryDayError, isLoading: lastLotteryDayLoading, refetch: refetchLastLotteryDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'lastLotteryDay',
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
    // TVL in MEGA (18 decimals)
    const tvl = megaReserve ? parseFloat(formatUnits(megaReserve, MEGA_DECIMALS)) : 0;
    // Supply values in GIGA (21 decimals)
    const supply = totalSupply ? parseFloat(formatUnits(totalSupply, GIGA_DECIMALS)) : 0;
    const maxSupplyValue = maxSupply ? parseFloat(formatUnits(maxSupply, GIGA_DECIMALS)) : 0;
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
    // Pool amounts in GIGA (21 decimals)
    const feesPoolAmount = feesPoolBalance ? parseFloat(formatUnits(feesPoolBalance, GIGA_DECIMALS)) : 0;
    const lotteryPoolAmount = lotteryPool ? parseFloat(formatUnits(lotteryPool, GIGA_DECIMALS)) : 0;

    // Process auction data
    // auctionTokens (index 3) is in GIGA (21 decimals)
    const auctionPool = currentAuction && currentAuction[3] ? parseFloat(formatUnits(currentAuction[3], GIGA_DECIMALS)) : 0;
    // currentBid and minBid (indices 1, 2) are in MEGA (18 decimals)
    const currentBid = currentAuction && currentAuction[1] ? parseFloat(formatUnits(currentAuction[1], MEGA_DECIMALS)) : 0;
    const minBid = currentAuction && currentAuction[2] ? parseFloat(formatUnits(currentAuction[2], MEGA_DECIMALS)) : 0;
    const currentBidder = currentAuction ? currentAuction[0] : null;
    const auctionDay = currentAuction && currentAuction[4] !== undefined ? Number(currentAuction[4]) : 0;

    // Check last lottery day to determine if lottery needs execution
    // lastLotteryDay is directly updated by executeLottery(), so it's the reliable indicator
    const lastLotteryDayNum = lastLotteryDay ? Number(lastLotteryDay) : 0;

    // Auction staleness detection:
    // - auctionDay is the day whose fees are being auctioned (set as currentDay - 1 when auction starts)
    // - A valid current auction has auctionDay == currentDayNumber - 1
    // - If auctionDay < currentDayNumber - 1, the auction is stale (from a previous day)
    // - If auctionDay == 0 and we're past minting, no auction has started yet
    const isAuctionStale = isAuctionActive && auctionDay > 0 && auctionDay < currentDayNumber - 1;

    // Use lastLotteryDay to determine if lottery needs execution (more reliable than auctionDay)
    // The lottery for day N-1 should have run, so lastLotteryDay should be >= currentDayNumber - 1
    const needsLotteryExecution = isAuctionActive && lastLotteryDayNum < currentDayNumber - 1;

    // Check if there's a pending lottery that will execute during minting period
    const hasPendingLotteryDuringMinting = isMintingPeriod && currentDayNumber >= 1 && lastLotteryDayNum < currentDayNumber - 1;

    // Estimated next auction pool:
    // - During minting period with pending lottery: 0 (all fees go to lottery when executed)
    // - Otherwise: 50% of accumulated fees
    const estimatedNextAuctionPool = hasPendingLotteryDuringMinting ? 0 : feesPoolAmount * 0.5;

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
      hasPendingLotteryDuringMinting,
    };
  }, [megaReserve, totalSupply, maxSupply, currentDay, feesPoolBalance, lotteryPool, currentAuction, currentTime, lastLotteryDay]);

  // Aggregate errors and loading states
  const hasError =
    totalSupplyError ||
    maxSupplyError ||
    balanceError ||
    currentDayError ||
    feesPoolError ||
    lotteryPoolError ||
    auctionError ||
    lastLotteryDayError;

  const isLoading =
    totalSupplyLoading ||
    maxSupplyLoading ||
    balanceLoading ||
    currentDayLoading ||
    feesPoolLoading ||
    lotteryPoolLoading ||
    auctionLoading ||
    lastLotteryDayLoading;

  // Combined refetch function to refresh all contract data
  const refetch = useCallback(() => {
    refetchTotalSupply();
    refetchMaxSupply();
    refetchMegaReserve();
    refetchCurrentDay();
    refetchFeesPool();
    refetchLotteryPool();
    refetchAuction();
    refetchLastLotteryDay();
  }, [refetchTotalSupply, refetchMaxSupply, refetchMegaReserve, refetchCurrentDay, refetchFeesPool, refetchLotteryPool, refetchAuction, refetchLastLotteryDay]);

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
        lastLotteryDay: lastLotteryDayError?.message,
      },
    });
  }

  return {
    // Raw data
    totalSupply,
    maxSupply,
    megaReserve,
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

    // Refetch function
    refetch,
  };
}
