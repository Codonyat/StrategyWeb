import { useReadContract, useBalance } from 'wagmi';
import { formatEther, parseAbi } from 'viem';
import { CONTRACT_ADDRESS, CONTRACT_CONFIG } from '../config/contract';
import { DisplayFormattedNumber } from './DisplayFormattedNumber';
import './DataStrip.css';

const parsedAbi = parseAbi([
  'function getCurrentDay() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function currentLotteryPool() view returns (uint256)',
  'function getAllUnclaimedPrizes() view returns (address[7] lotteryWinners, uint112[7] lotteryAmounts, address[7] auctionWinners, uint112[7] auctionAmounts)',
  'function currentAuction() view returns (address currentBidder, uint96 currentBid, uint96 minBid, uint112 monstrAmount, uint32 auctionDay)',
  'function mintingEndTime() view returns (uint256)',
]);

export function DataStrip() {
  // Get current day
  const { data: currentDay } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getCurrentDay',
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 10000 },
  });

  // Get total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'totalSupply',
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 10000 },
  });

  // Get minting end time
  const { data: mintingEndTime } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'mintingEndTime',
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  // Get MON reserve (contract balance)
  const { data: monBalance } = useBalance({
    address: CONTRACT_ADDRESS,
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 10000 },
  });

  // Get lottery pool
  const { data: lotteryPool } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'currentLotteryPool',
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 10000 },
  });

  // Get unclaimed prizes to find last lottery winner
  const { data: unclaimedPrizes } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'getAllUnclaimedPrizes',
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 30000 },
  });

  // Get current auction info
  const { data: auctionData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: parsedAbi,
    functionName: 'currentAuction',
    chainId: CONTRACT_CONFIG.chainId,
    query: { enabled: !!CONTRACT_ADDRESS, refetchInterval: 10000 },
  });

  // Calculate time until next lottery draw
  const calculateTimeUntilDraw = () => {
    if (!mintingEndTime) return 'N/A';

    const now = Math.floor(Date.now() / 1000);
    const mintingEnd = Number(mintingEndTime);
    const pseudoDayLength = 90000; // 25 hours

    if (now < mintingEnd) {
      const timeLeft = mintingEnd - now;
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }

    const timeSinceMinting = now - mintingEnd;
    const currentDayProgress = timeSinceMinting % pseudoDayLength;
    const timeUntilNextDraw = pseudoDayLength - currentDayProgress;

    const hours = Math.floor(timeUntilNextDraw / 3600);
    const minutes = Math.floor((timeUntilNextDraw % 3600) / 60);
    const seconds = timeUntilNextDraw % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Format address
  const formatAddress = (addr) => {
    if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'None';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Get last lottery winner
  const getLastLotteryWinner = () => {
    if (!unclaimedPrizes) return 'None';
    const [lotteryWinners, lotteryAmounts] = unclaimedPrizes;

    // Find the most recent non-zero winner
    for (let i = 6; i >= 0; i--) {
      if (lotteryWinners[i] !== '0x0000000000000000000000000000000000000000' && lotteryAmounts[i] > 0n) {
        return formatAddress(lotteryWinners[i]);
      }
    }
    return 'None';
  };

  // Get last auction proceeds
  const getLastAuctionProceeds = () => {
    if (!unclaimedPrizes) return 0;
    const [, , , auctionAmounts] = unclaimedPrizes;

    // Find the most recent auction amount
    for (let i = 6; i >= 0; i--) {
      if (auctionAmounts[i] > 0n) {
        return parseFloat(formatEther(auctionAmounts[i]));
      }
    }
    return 0;
  };

  const monReserve = monBalance?.value ? parseFloat(formatEther(monBalance.value)) : 0;
  const supply = totalSupply ? parseFloat(formatEther(totalSupply)) : 0;
  const lotteryPoolAmount = lotteryPool ? parseFloat(formatEther(lotteryPool)) : 0;
  const lastAuctionProceeds = getLastAuctionProceeds();
  const lastLotteryWinner = getLastLotteryWinner();
  const timeUntilDraw = calculateTimeUntilDraw();

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
            <DisplayFormattedNumber num={monReserve} significant={3} /> MON
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Next draw</span>{' '}
          <span className="ticker-value">{timeUntilDraw}</span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Pool</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={lotteryPoolAmount} significant={3} /> MONSTR
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Last auction</span>{' '}
          <span className="ticker-value">
            <DisplayFormattedNumber num={lastAuctionProceeds} significant={3} /> MON
          </span>
        </span>

        <span className="ticker-separator">•</span>

        <span className="ticker-item">
          <span className="ticker-label">Last winner</span>{' '}
          <span className="ticker-value">{lastLotteryWinner}</span>
        </span>
      </div>
    </div>
  );
}
