# Strategy (MONSTR) Token Contract Summary

## Overview
Strategy.sol is an ERC20 token contract with the symbol **MONSTR**, backed by MON (Monad's native currency). The contract implements a sophisticated tokenomics system with lottery and auction mechanics.

## Development Guidelines
- **Prefer simplicity**: When possible, use simple, straightforward solutions instead of over-engineered ones
- Keep implementations minimal and easy to understand

## Key Mechanics

### Minting & Redemption
- **During minting period (first 24 hours)**: 1 MON = 1 MONSTR (1:1 ratio)
- **After minting period**: Proportional to MON backing ratio
- **Redemption**: Burn MONSTR to receive proportional share of contract's MON balance
- **Fee**: 1% on all mints, burns, and transfers

### Fee-Free Minting (Optional)
- Users can lock community tokens (if configured) to mint without fees during the minting period
- Lock amount: 100e12 community tokens
- Unlock time: 30 days from deployment

### Daily Lottery
- Random holder selected using prevrandao
- Runs every 25-hour "pseudo-day" (to rotate timing across timezones)
- Winner selection weighted by token balance (Fenwick tree for efficiency)
- Must wait 1 minute into new day before execution
- During minting period: lottery gets 100% of fees
- After minting period: lottery gets 50% of fees

### Daily Auctions
- Only runs after minting period ends
- Gets 50% of daily fees
- Bidders use WMON (wrapped MON) to prevent DoS attacks
- Minimum bid: 50% of redemption value
- Each bid must be 10% higher than previous bid
- Previous bidders get instant WMON refunds
- Winner receives the auctioned MONSTR tokens

### Prize System
- Unclaimed prizes stored in 7-slot rolling arrays
- Separate arrays for lottery and auction prizes
- Winners claim prizes by calling `claim()`
- If prize unclaimed after 7 days: sent to beneficiary (treasury)

## Important Addresses
- **FEES_POOL**: `0x00000000000fee50000000AdD2E5500000000000` (synthetic address for fee collection)
- **LOT_POOL**: `0x0000000000010700000000aDD2E5500000000000` (synthetic address for prizes)
- **Treasury**: `0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A` (beneficiary for unclaimed prizes)

## Key Functions

### Write Functions
- `mint()` - Deposit MON to mint MONSTR (with 1% fee)
- `mintFeeFree()` - Mint without fees by locking community tokens
- `redeem(uint256)` - Burn MONSTR to receive MON
- `unlockCommunityToken()` - Unlock community tokens after 30 days
- `executeLottery()` - Trigger daily lottery/auction
- `claim()` - Claim all unclaimed prizes
- `bid(uint256)` - Place bid in current auction (using WMON)

### Read Functions
- `balanceOf(address)` - Get token balance
- `totalSupply()` - Get total supply
- `getCurrentDay()` - Get current pseudo-day number
- `getMyClaimableAmount()` - Get caller's total claimable prizes
- `getAllUnclaimedPrizes()` - Get all unclaimed lottery and auction prizes
- `currentAuction()` - Get current auction details
- `currentLotteryPool()` - Get lottery pool balance
- `getHolderCount()` - Get number of holders
- `isHolder(address)` - Check if address is a holder

## Technical Features
- **Reentrancy Protection**: Uses EIP-1153 transient storage for gas efficiency
- **Fenwick Tree**: Binary indexed tree for O(log n) winner selection
- **Dual State**: Maintains 2-day rolling history for lottery snapshots
- **Gas Optimized**: Packed storage slots, atomic balance updates
- **DoS Resistant**: Uses WMON for auctions to prevent refund griefing

## Constants
- Fee: 1% (100 basis points)
- Minting period: 1 day (86,400 seconds)
- Pseudo-day length: 25 hours (90,000 seconds)
- Time gap for lottery: 1 minute
- Minimum fees for distribution: 0.000001 MONSTR (1e12 wei)
- Auction bid increment: 10%
- Auction minimum bid: 50% of redemption value

## Contract Location
Source: `c:/Users/nilga/Repos/Etherium/src/Strategy.sol`

## Website Integration
The contract ABI and configuration are located in:
- `src/config/abi.js` - Full contract ABI
- `src/config/contract.js` - **All configuration indexed by chain ID** (network, tokens, branding, colors, links)
- `.env.example` - Environment variable template

Set your environment variables in `.env`:
```
VITE_CONTRACT_ADDRESS=0x...
VITE_CHAIN_ID=10143          # Testnet: 10143, Mainnet: 143
# VITE_RPC_URL=https://...   # Optional - uses network default if not specified
```

### Network Configuration
The `VITE_CHAIN_ID` automatically configures:
- Chain name (e.g., "Monad Testnet" or "Monad Mainnet")
- Token symbols (MONSTR, MON, WMON)
- Default RPC URL
- Explorer URL
- Coin image paths (based on chain ID)

Supported networks:
- **Monad Testnet**: Chain ID 10143
- **Monad Mainnet**: Chain ID 143

### Coin Images
Coin/token logos are organized by chain ID in the `public/coins/` directory:

```
public/coins/
├── 143/          # Monad Mainnet
│   ├── monstr.svg
│   ├── mon.svg
│   └── wmon.svg
└── 10143/        # Monad Testnet
    ├── monstr.svg
    ├── mon.svg
    └── wmon.svg
```

The theme automatically loads the correct images based on `VITE_CHAIN_ID`. Images should be:
- **Format**: SVG (recommended) or PNG
- **Naming**: Lowercase token symbol (e.g., `monstr.svg`, `mon.svg`, `wmon.svg`)
- See `public/coins/README.md` for more details

### Configuration Structure
All configuration is centralized in `src/config/contract.js` and indexed by chain ID. Each network config includes:

**Network Info:**
- `chainId`, `chainName`, `rpcUrl`, `explorerUrl`

**Token Info:**
- `strategyCoin` - { symbol, name, logo } (e.g., MONSTR)
- `nativeCoin` - { symbol, name, logo } (e.g., MON)
- `wrappedCoin` - { symbol, name, logo } (e.g., WMON)

**Branding:**
- `tagline`, `platformName`

**Colors:**
- `colors` - Complete color palette for the UI

**Links & Treasury:**
- `links` - External links (docs, repository, twitter, discord)
- `treasury` - Treasury wallet address

The `theme` export provides access to all these configs. Simply change `VITE_CHAIN_ID` to switch between networks - everything updates automatically.
- to memorize
- to memorize