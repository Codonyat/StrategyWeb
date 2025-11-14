// Strategy (MONSTR) Token ABI
// Extracted from Strategy.sol contract

export const STRATEGY_ABI = [
  // Read-only functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",

  // Token state
  "function maxSupplyEver() view returns (uint112)",
  "function deploymentTime() view returns (uint256)",
  "function mintingEndTime() view returns (uint256)",
  "function lastLotteryDay() view returns (uint32)",

  // Holder information
  "function getCurrentDay() view returns (uint256)",
  "function getHolderCount() view returns (uint256)",
  "function getHolderByIndex(uint256 index) view returns (address holder, uint256 balance)",
  "function isHolder(address account) view returns (bool)",

  // Lottery & Auction
  "function currentLotteryPool() view returns (uint256)",
  "function getMyClaimableAmount() view returns (uint256)",
  "function getAllUnclaimedPrizes() view returns (address[7] lotteryWinners, uint112[7] lotteryAmounts, address[7] auctionWinners, uint112[7] auctionAmounts)",
  "function currentAuction() view returns (address currentBidder, uint96 currentBid, uint96 minBid, uint112 monstrAmount, uint32 auctionDay)",

  // Community token
  "function communityTokenLocked(address) view returns (uint256)",

  // Write functions
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",

  // Minting & Redeeming
  "function mint() payable",
  "function mintFeeFree() payable",
  "function redeem(uint256 amount)",
  "function unlockCommunityToken()",

  // Lottery & Auction
  "function executeLottery()",
  "function claim()",
  "function bid(uint256 bidAmount)",

  // Events
  "event Minted(address indexed to, uint256 monAmount, uint256 stratAmount, uint256 fee)",
  "event Redeemed(address indexed from, uint256 stratAmount, uint256 monAmount, uint256 fee)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event LotteryWon(address indexed winner, uint256 amount, uint256 day)",
  "event PrizeClaimed(address indexed winner, uint256 amount)",
  "event BeneficiaryFunded(address indexed beneficiary, uint256 amount, address previousWinner)",
  "event CommunityTokenLocked(address indexed user, uint256 tokenAmount, uint256 stratMinted, uint256 unlockTime)",
  "event CommunityTokenUnlocked(address indexed user, uint256 amount)",
  "event AuctionStarted(uint256 day, uint256 stratAmount, uint256 minBid)",
  "event BidPlaced(address indexed bidder, uint256 amount, uint256 day)",
  "event BidRefunded(address indexed bidder, uint256 amount)",
  "event AuctionWon(address indexed winner, uint256 stratAmount, uint256 monPaid, uint256 day)"
];

// Contract constants for reference
export const CONTRACT_CONSTANTS = {
  FEE_PERCENT: 100, // 1% = 100 basis points
  BASIS_POINTS: 10000,
  MINTING_PERIOD: 86400, // 1 day in seconds
  COMMUNITY_TOKEN_LOCK_AMOUNT: '100000000000000', // 100e12
  COMMUNITY_TOKEN_UNLOCK_TIME: 2592000, // 30 days in seconds
  TIME_GAP: 60, // 1 minute
  MIN_FEES_FOR_DISTRIBUTION: '1000000000000', // 1e12
  PSEUDO_DAY_LENGTH: 90000 // 25 hours in seconds
};
