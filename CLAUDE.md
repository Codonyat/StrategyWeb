# Strategy (MONSTR) Token Contract Summary

## Overview
Strategy.sol is an ERC20 token contract with the symbol **MONSTR**, backed by MON (Monad's native currency). The contract implements a sophisticated tokenomics system with lottery and auction mechanics.

## Development Guidelines
- **Prefer simplicity**: When possible, use simple, straightforward solutions instead of over-engineered ones
- Keep implementations minimal and easy to understand
- **Use relative paths for file operations**: When using Read, Edit, Write, or other file tools, always use relative paths (e.g., `src/config/abi.js`) instead of absolute paths. This ensures compatibility across different environments and systems.

## RPC and Chain ID Usage
**IMPORTANT**: The app uses different RPC/chain configurations for queries vs transactions:
- **Read queries** (e.g., `useReadContract`, `useBalance`): Use the internal RPC URL and chain ID from `.env` (`VITE_CHAIN_ID` and `VITE_RPC_URL` or network defaults). These queries work WITHOUT wallet connection.
- **Write transactions** (e.g., `useWriteContract`): Use the wallet's configured RPC and chain ID. The wallet must be connected and on the correct network to sign transactions.

This separation allows the app to display protocol stats and data regardless of wallet connection state or which chain the wallet is connected to.

## Key Mechanics

### Minting & Redemption
- **During minting period (first 24 hours)**: 1 MON = 1 MONSTR (1:1 ratio)
- **After minting period**: Minting still possible at the current backing ratio, but only if total supply is below the max supply cap (set at end of minting period). Burns create capacity for new minting.
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
- `src/config/contract-constants.json` - **Immutable contract constants** (fetched once during build)
- `.env.example` - Environment variable template

### Contract Constants (Build-Time Fetched)
**IMPORTANT**: The `deploymentTime` and `MINTING_PERIOD` constants are immutable values that are fetched once during the build process by `scripts/fetch-contract-constants.js` and saved to `src/config/contract-constants.json`.

**These constants should NEVER be refetched at runtime** - simply import them from the JSON file:
```javascript
import contractConstants from '../config/contract-constants.json';

const deploymentTime = Number(contractConstants.deploymentTime);
const mintingPeriod = Number(contractConstants.MINTING_PERIOD);
```

Since these values never change after deployment, there's no need to query the contract or use `useReadContract` hooks for them. Use the pre-fetched values from the build process instead.

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

## Modal Design Guidelines

### Overview
Modals in MONSTR follow a consistent design system with specific patterns for transaction-based interactions (Mint, Burn, Bid, etc.).

### Design Principles

#### 1. **Consistent Visual System**
- Use the same width (`max-width: 480px`), padding, and corner radius across all modals
- Header typography should be identical (font size, weight, alignment)
- Close icon (✕) always aligned to same position
- Use `var(--radius-xl)` for modal container, `var(--radius-md)` for inner elements

#### 2. **Color Semantics**
- **Deposit/Mint actions**: Green hover effects (`--color-success` to `--color-secondary`)
- **Burn/Destructive actions**: Red/pink hover effects (`--color-primary` to `--color-secondary`)
- **Neutral actions**: Purple hover effects (`--color-purple`)
- **Input focus states**: Neutral border (`--color-border-light`) - NO colored borders on focus to keep UI clean

#### 3. **Input Fields**
```css
/* Standard input styling */
- Remove browser number spinners completely
- Token symbol displayed inside input (right-aligned, matching input font size)
- Neutral border (`--color-border`) when unfocused
- Subtle neutral border (`--color-border-light`) on focus - NO colored glow
- Padding: `1rem 1.25rem`, with `padding-right: 90px` for token symbol
- Input class: Plain for deposit, `burn-input` for burn (but styling is the same)
```

#### 4. **Helper Elements**
- **Balance display**: Two formats available:
  - Simple: Single line with balance info (used when no shortcuts needed)
  - With shortcuts: `.balance-row` containing `.balance-info-text` and `.balance-shortcuts`
- **Shortcut buttons**: 25%, 50%, MAX pill buttons
  - Small, compact design (`padding: 0.25rem 0.625rem`, `font-size: 0.7rem`)
  - Purple hover/selected state (`--color-purple`) - universal for all modals
  - Clear selected state with visual feedback
  - Auto-deselect on manual input edit
- **Transaction info box**:
  - Zero vertical padding (`padding: 0 1rem`) for cleaner row alignment
  - `min-height: 2.5rem` on `.info-row` for consistent heights
  - Consistent `line-height: 1.5` on all row content

#### 5. **Button Design**
```javascript
// Modal buttons match landing page action buttons - NOT filled gradients
- Full width pill style (`border-radius: 9999px`)
- Dark background with border: `background: var(--color-background-card)`, `border: 2px solid var(--color-border-light)`
- Text color: `var(--color-text-primary)` (white)
- Gradient overlay on ::before pseudo-element (opacity 0 → 0.1 on hover)
  - Deposit: green gradient (`--color-success` to `--color-secondary`)
  - Burn: red gradient (`--color-primary` to `--color-secondary`)
- Hover: border color changes to action color, lift + scale + glow
- Active state: scale down slightly (0.99)
- Disabled: 50% opacity, no transform
- Loading state shows spinner + status text ("Waiting for approval", "Confirming")
- Labels should be concise: "Deposit MON", "Burn MONSTR" (not "Deposit & Mint")
- Button content needs `z-index: 1` to appear above gradient overlay

// Philosophy: Buttons are NOT filled with color - they have dark backgrounds with subtle gradient overlays on hover
```

#### 6. **Information Hierarchy**
```
Label (lighter gray #909090)          Value (white, right-aligned, bold)
─────────────────────────────────────────────────────────────────────
You will receive                       ~X MONSTR (plain span, no wrapper)
Exchange rate                          1:X.XX (use ratio notation, not Xx format)
Fee                                    1%

IMPORTANT:
- NO wrapper divs around "You will receive" value - keep it clean
- Use "Exchange rate" label (not "Backing ratio") with 1:X.XX notation for consistency
- Burn modal: 1:${backingRatio} (1 MONSTR → X MON)
- Mint modal: 1:1 or 1:${1/backingRatio} (1 MON → X MONSTR)
```

#### 7. **Destructive Action Warnings**
For burn/withdrawal modals:
```jsx
<div className="warning-message">
  ⚠ Burning MONSTR is irreversible. You will receive MON at the current backing ratio.
</div>
```
- Red-tinted background with icon
- Always shown, not conditional
- Clear, concise explanation of consequences

#### 8. **Interaction Details**
- **Auto-focus**: Input field receives focus when modal opens
- **Keyboard support**: Escape key closes modal
- **Backdrop click**: Closes modal
- **Form validation**: Button disabled when amount invalid or zero
- **Error clearing**: Errors clear when user starts typing
- **Auto-close**: Success state auto-closes after 2 seconds
- **Loading states**: Prevent double-submission, show spinner

#### 9. **Calculation Display**
Always show real-time calculations:
```javascript
// Mint example
const estimatedOutput = () => {
  if (!amount || parseFloat(amount) <= 0) return '0';
  const inputAmount = parseFloat(amount);

  if (isMintingPeriod) {
    return (inputAmount * 0.99).toFixed(6); // 1:1 minus fee
  } else {
    return (inputAmount / backingRatio * 0.99).toFixed(6);
  }
};
```

#### 10. **Micro-interactions**
- Modal entrance: `fadeIn` overlay + `slideUp` content with scale
- Button hover: Lift (`translateY(-2px)`) + brightness + stronger glow
- Button active: Slight scale down (`scale(0.98)`)
- Balance line: Cursor pointer + color change on hover
- All transitions use design tokens (`var(--transition-fast)`, `var(--transition-base)`)

### Modal Structure Template
```jsx
export function TransactionModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Hooks for blockchain data
  const { address } = useAccount();
  const { balance } = useBalance({ address });

  // Auto-focus on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Action Name</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Input field with token symbol and MAX button */}
          {/* Balance info (clickable) */}
          {/* Transaction breakdown (conditional on amount > 0) */}
          {/* Warning (if destructive) */}
          {/* Error/Success messages */}
          {/* Submit button with loading states */}
        </form>
      </div>
    </div>
  );
}
```

### Files Reference
- **Components**: `src/components/MintModal.jsx`, `src/components/BurnModal.jsx`
- **Styles**: `src/components/TransactionModal.css`
- **Hooks**: `src/hooks/useStrategyContract.js`, `src/hooks/useProtocolStats.js`

### Best Practices
1. **Always fetch real-time data** from blockchain for accurate calculations
2. **Show calculations before transaction** so users know exact outcomes
3. **Validate all inputs** and prevent invalid states
4. **Clear error messages** that explain what went wrong
5. **Consistent spacing** - use design tokens, not magic numbers
6. **Accessible** - proper aria labels, focus management, keyboard support
7. **Mobile responsive** - test at 375px width minimum

## UI Design System

### Design Philosophy
MONSTR uses a bold, vibrant design system inspired by punk.auction with high-contrast colors, smooth animations, and attention to micro-interactions. The aesthetic is modern, edgy, and engaging while maintaining professionalism for financial operations.

### Color Palette

#### Core Colors
```css
/* Backgrounds - Dark theme with layers */
--color-background: #0d0d0d           /* Main background, almost black */
--color-background-light: #1a1a1a    /* Elevated elements */
--color-background-card: #1f1f1f     /* Cards, modals */

/* Primary - Hot pink/red for important actions */
--color-primary: #ff3864              /* Main brand color */
--color-primary-hover: #ff1a4d        /* Hover state */
--color-primary-light: #ff5b7f        /* Lighter variant */

/* Secondary - Cyan for accents */
--color-secondary: #00d4ff            /* Accent color */
--color-secondary-hover: #00b8e6      /* Hover state */
--color-secondary-light: #33ddff      /* Lighter variant */

/* Purple - Brand accent */
--color-purple: #8a2be2               /* Brand purple */
--color-purple-hover: #9d4ced         /* Hover state */
--color-purple-light: #a561f1         /* Lighter variant */

/* Success - Bright green for positive actions */
--color-success: #00ff88              /* Mints, deposits, gains */

/* Warning/Accent - Gold */
--color-accent: #ffd700               /* Highlights, warnings */
--color-accent-hover: #ffed4e         /* Hover state */

/* Semantic colors */
--color-error: #ff3864                /* Same as primary, for burns/errors */
--color-warning: #ffd700              /* Same as accent */
--color-info: #00d4ff                 /* Same as secondary */

/* Text hierarchy */
--color-text-primary: #ffffff         /* Main text, headings */
--color-text-secondary: #b0b0b0       /* Secondary text, labels */
--color-text-muted: #707070           /* De-emphasized text, timestamps */

/* Borders */
--color-border: #2a2a2a               /* Default borders */
--color-border-light: #404040         /* Hover borders */
--color-border-hover: #555555         /* Active borders */
```

#### Color Usage Guidelines
- **Green (`#00ff88`)**: Positive actions (deposit, mint, gains, success)
- **Red/Pink (`#ff3864`)**: Destructive/negative actions (burn, withdraw, errors)
- **Purple (`#8a2be2`)**: Brand elements, large numbers, passive highlights
- **Cyan (`#00d4ff`)**: Secondary accents, links, info states
- **Gold (`#ffd700`)**: Warnings, special features, CTAs

### Typography

#### Font Families
```css
/* Primary: System fonts for UI */
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif

/* Monospace: For addresses, amounts */
'Courier New', monospace
'Space Grotesk', 'Inter', monospace  /* For transaction amounts */
```

#### Font Sizes & Weights
```css
/* Headings */
h1: 2.5rem - 3rem, font-weight: 700
h2: 2rem, font-weight: 700
h3: 1.5rem, font-weight: 600

/* Body */
Body: 1rem, font-weight: 400
Small: 0.875rem (14px)
Tiny: 0.75rem (12px)
Micro: 0.7rem (11.2px)

/* Letter spacing */
Tight: -0.02em to -0.01em (headings)
Normal: 0 (body text)
Wide: 0.05em - 0.1em (uppercase labels, buttons)
```

#### Text Hierarchy Patterns
```jsx
// Eyebrow text (labels above sections)
<span className="eyebrow">SECTION LABEL</span>
// Styles: 0.875rem, uppercase, tracking: 0.1em, secondary color, weight: 600

// Section titles
<h2 className="section-title">How it works</h2>
// Styles: 2rem, weight: 700, primary color, tracking: -0.01em

// Description text
<p className="description">Supporting text...</p>
// Styles: 1rem, secondary color, line-height: 1.7
```

### Spacing System
```css
--spacing-xs: 0.5rem    /* 8px - tight gaps, inline elements */
--spacing-sm: 1rem      /* 16px - small gaps, compact layouts */
--spacing-md: 1.5rem    /* 24px - medium gaps, standard sections */
--spacing-lg: 2rem      /* 32px - large gaps, major sections */
--spacing-xl: 3rem      /* 48px - extra large, page sections */
--spacing-2xl: 4rem     /* 64px - huge spacing, hero sections */
```

**Usage:** Always use spacing tokens, never hardcode pixel values.

### Border Radius System
```css
--radius-sm: 4px      /* Small elements, subtle rounding */
--radius-md: 8px      /* Standard cards, inputs */
--radius-lg: 12px     /* Large cards, containers */
--radius-xl: 16px     /* Modal containers, major sections */
9999px                /* Pills (buttons, badges, chips) */
```

### Button Patterns

#### 1. Pill Buttons (Primary Actions)
```css
/* Structure */
padding: 1rem 2rem
border-radius: 9999px
border: 2px solid var(--color-border-light)
background: var(--color-background-card)
position: relative
overflow: hidden

/* Gradient overlay (::before) */
background: linear-gradient(135deg, var(--color-primary), var(--color-secondary))
opacity: 0
transition: opacity 0.3s ease

/* Hover state */
transform: translateY(-3px) scale(1.02)
box-shadow: 0 10px 30px rgba(color, 0.3)
border-color: var(--action-color)
::before { opacity: 0.1 }
```

**Variants:**
- **Deposit/Mint**: Green gradient hover (`--color-success` to `--color-secondary`)
- **Burn/Withdraw**: Red gradient hover (`--color-primary` to `--color-secondary`)
- **Neutral**: Purple gradient hover

#### 2. Compact Buttons
```css
padding: 0.5rem 1rem
font-size: 0.75rem
font-weight: 700
text-transform: uppercase
letter-spacing: 0.05em
border-radius: 9999px
```

### Card/Container Patterns

#### Standard Card
```css
.card {
  background: var(--color-background-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(255, 56, 100, 0.15);
}
```

#### Transaction Row (Ledger Style)
```css
/* Compact, grid-based layout */
display: grid;
grid-template-columns: auto auto 1fr auto auto;
gap: var(--spacing-sm);
padding: 0.75rem var(--spacing-sm);
background: var(--color-background-card);
border-radius: 8px;
border-left: 2px solid transparent;
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Color indicator dot */
.tx-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--action-color);
  box-shadow: 0 0 8px rgba(color, 0.4);
}

/* Hover state */
border-left-color: var(--action-color);
background: rgba(action-color, 0.03);
```

### Animation & Transition Patterns

#### Timing Functions
```css
--transition-fast: 150ms ease       /* Quick interactions */
--transition-base: 250ms ease       /* Standard transitions */
--transition-slow: 350ms ease       /* Smooth, dramatic */

/* Custom easing */
cubic-bezier(0.4, 0, 0.2, 1)       /* Material Design easing */
```

#### Common Animations
```css
/* Lift on hover (cards, buttons) */
:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 30px rgba(color, 0.3);
}

/* Press feedback */
:active {
  transform: translateY(-1px) scale(0.98);
}

/* Fade entrance */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up entrance */
@keyframes slideUp {
  from {
    transform: translateY(30px) scale(0.96);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
```

### Glow Effects

#### Color-Based Glows
```css
/* Green glow (success, deposit) */
box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);  /* Elevated */

/* Red glow (error, burn) */
box-shadow: 0 0 12px rgba(255, 56, 100, 0.4);
box-shadow: 0 10px 30px rgba(255, 56, 100, 0.3);

/* Purple glow (brand) */
box-shadow: 0 0 12px rgba(138, 43, 226, 0.4);

/* Cyan glow (info) */
box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
```

#### Radial Background Glows
```css
/* Subtle background glow */
.section::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(
    circle,
    rgba(138, 43, 226, 0.08) 0%,
    rgba(138, 43, 226, 0.04) 30%,
    transparent 70%
  );
  pointer-events: none;
}
```

### Interactive Patterns

#### Hover States Checklist
- [ ] Transform: lift or scale (usually both)
- [ ] Border color change
- [ ] Box shadow (glow matching action color)
- [ ] Brightness or opacity shift
- [ ] Background gradient reveal (for buttons)

#### Focus States
```css
:focus-visible {
  outline: 2px solid rgba(action-color, 0.6);
  outline-offset: 2px;
  border-color: var(--action-color);
}
```

### Layout Patterns

#### Container Max-Width
```css
max-width: var(--max-width);  /* 1280px */
margin: 0 auto;
padding: 0 var(--spacing-lg);
width: 100%;
```

#### Grid Layouts
```css
/* Two-column hero */
display: grid;
grid-template-columns: 1fr 1fr;
gap: var(--spacing-lg);
align-items: center;

/* Four-column feature grid */
grid-template-columns: repeat(4, 1fr);
gap: var(--spacing-md);

/* Responsive breakpoint */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

### Visual Effects

#### Gradient Backgrounds
```css
/* Action gradients */
linear-gradient(135deg, var(--color-success), var(--color-secondary))  /* Deposit */
linear-gradient(135deg, var(--color-primary), var(--color-purple))     /* Burn */
linear-gradient(135deg, var(--color-primary), var(--color-secondary))  /* Neutral */
```

#### Mask/Fade Effects
```css
/* Fade out bottom of scrollable list */
mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
-webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
```

#### Blur for Depth
```css
/* Subtle blur on faded items */
filter: blur(0.3px);
opacity: 0.6;
```

### Accessibility Standards

#### Minimum Touch Targets
```css
min-height: 44px;  /* iOS standard */
min-width: 44px;
```

#### Focus Management
- All interactive elements must have visible focus states
- Use `:focus-visible` to hide focus ring on mouse clicks
- Focus ring should match action color
- Tab order must be logical

#### Color Contrast
- Text on dark background: Use `--color-text-primary` (#ffffff)
- Secondary text: `--color-text-secondary` (#b0b0b0) - WCAG AA compliant
- Never use colored text below 14px without sufficient contrast

### Mobile Responsive Patterns

#### Breakpoints
```css
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px)  { /* Mobile */ }
@media (max-width: 640px)  { /* Small mobile */ }
```

#### Mobile Adjustments
- Convert grids to single column
- Reduce spacing by 25-50%
- Increase touch target sizes
- Stack horizontal layouts vertically
- Use `clamp()` for fluid typography: `clamp(1.125rem, 2vw, 1.5rem)`

### Component-Specific Guidelines

#### Scrollbars (Webkit)
```css
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track {
  background: var(--color-background-card);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
```

#### Loading States
- Show skeleton screens or spinners
- Disable interactions during loading
- Provide visual feedback (spinner, progress)
- Maintain layout to prevent content shift

#### Empty States
- Use descriptive messages
- Provide call-to-action
- Include visual indicator (icon or illustration)
- Keep messaging encouraging, not negative

### Design Tokens Reference
All design tokens are defined in `src/index.css` and should be used consistently:
- Colors: `var(--color-*)`
- Spacing: `var(--spacing-*)`
- Radius: `var(--radius-*)`
- Transitions: `var(--transition-*)`

**Never hardcode these values.** Always use the CSS custom properties.

### Tooltip Pattern

MONSTR uses a clean, readable tooltip system for contextual help. Tooltips appear on hover with smooth animations.

#### Implementation

**Component (StatusChip example):**
```jsx
export function StatusChip({ label, value, type = 'default', tooltip }) {
  return (
    <div className={`status-chip status-chip-${type} ${tooltip ? 'has-tooltip' : ''}`}>
      <span className="status-chip-label">{label}</span>
      <span className="status-chip-value">{value}</span>
      {tooltip && <div className="status-chip-tooltip">{tooltip}</div>}
    </div>
  );
}
```

**Usage:**
```jsx
<StatusChip
  label="Backing"
  value={<>1:<DisplayFormattedNumber num={backingRatio} significant={3} /></>}
  type="active"
  tooltip={
    <>
      Backing ratio: <strong>1 MONSTR = <DisplayFormattedNumber num={backingRatio} significant={3} /> MON</strong>. Each MONSTR can be redeemed for this amount of MON from the reserve.
    </>
  }
/>
```

#### Styling
```css
.status-chip.has-tooltip {
  cursor: help;
}

.status-chip-tooltip {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: #3a3a3a;                    /* Mid-dark gray for readability */
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  font-size: 0.7rem;
  font-weight: 400;
  color: #ffffff;                         /* Pure white for contrast */
  white-space: normal;
  width: max-content;
  max-width: 200px;                       /* Limit width for shorter lines */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1000;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);  /* Soft shadow for separation */
  line-height: 1.4;
  text-transform: none;
  text-align: left;
}

.status-chip-tooltip strong {
  font-weight: 600;                       /* Emphasize key info */
  color: #ffffff;
}

/* Arrow - double layer for border effect */
.status-chip-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid var(--color-border-light);
}

.status-chip-tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid #3a3a3a;      /* Match tooltip background */
  margin-bottom: -1px;
}

.status-chip.has-tooltip:hover .status-chip-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(4px);
}
```

#### Design Guidelines
- **Background**: Mid-dark gray (`#3a3a3a`) instead of near-black for better readability
- **Text**: Pure white (`#ffffff`) for all text, use `font-weight: 600` for emphasis (not color changes)
- **Shadow**: Soft and prominent (`0 10px 30px rgba(0, 0, 0, 0.55)`) to separate from underlying UI
- **Arrow**: Double-layer technique (border + background) for seamless appearance
- **Width**: `max-width: 200px` to keep lines short and scannable
- **Padding**: 8px vertical, 12px horizontal for comfortable spacing
- **Typography**: 0.7rem font size, line-height 1.4, left-aligned
- **Animation**: Fade in with slight downward motion (4px translateY)
- **Position**: Appears below the trigger element to avoid overflow on nav bars

#### Content Guidelines
- Keep copy concise and scannable
- Use `<strong>` tags to emphasize key numbers or ratios
- Left-align text for better readability
- Include both the concept and practical implication
- Example: "Backing ratio: **1 MONSTR = X MON**. Each MONSTR can be redeemed for this amount of MON from the reserve."

**Files Reference:**
- Component: `src/components/StatusChip.jsx`
- Styles: `src/components/StatusChip.css`
- Usage: `src/components/Header.jsx`

## CSS Best Practices & Common Pitfalls

### CSS Specificity and Inheritance Issues

**CRITICAL LESSON**: In React/Vite apps, all CSS files are bundled together regardless of which page is active. Unscoped class names in page-specific CSS files can cause conflicts across different pages.

#### The Problem
When multiple page CSS files use the same class names (e.g., `.section-title`), the last loaded CSS rule wins due to CSS cascade order, not based on which page is currently rendered.

**Example of the issue:**
```css
/* Landing.css */
.section-title {
  font-size: 2rem;  /* Global rule - affects ALL pages */
}

/* Lottery.css */
.section-title {
  font-size: 2rem;  /* Also global - affects ALL pages */
}

/* HowItWorks.css */
.section-header {
  font-size: 1rem;  /* Applied to button */
}

.section-title {
  /* No font-size specified - inherits from global 2rem, not from parent button! */
}
```

**What happens:**
- The button (`.section-header`) has the correct `font-size: 1rem`
- The text inside the button is wrapped in a span with class `.section-title`
- The span picks up the global `font-size: 2rem` from Landing.css/Lottery.css instead of inheriting from its parent button
- Result: Text appears at 32px instead of 16px

#### The Solution

**Option 1: Force inheritance (Quick Fix)**
```css
.how-it-works-page .section-title {
  font-size: inherit !important;  /* Force child to inherit from parent */
  font-weight: inherit !important;
}
```

**Option 2: Scope all CSS selectors (Best Practice)**
```css
/* Landing.css */
.landing-page .section-title {
  font-size: 2rem;
}

/* Lottery.css */
.lottery-page .section-title {
  font-size: 2rem;
}

/* HowItWorks.css */
.how-it-works-page .section-title {
  font-size: 1rem;
}
```

#### Best Practices to Follow

1. **Always scope page-specific styles** with the page container class
   - Bad: `.section-title { ... }`
   - Good: `.how-it-works-page .section-title { ... }`

2. **Use inheritance explicitly when needed**
   - If a child element should inherit from its parent, explicitly set `font-size: inherit` rather than relying on default inheritance

3. **Avoid global class names** unless they're truly global utilities
   - Classes like `.section-title`, `.card`, `.button` should always be scoped to their page/component

4. **Use `!important` sparingly** but when you do, document why
   - Only use when fighting specificity issues or overriding third-party styles
   - Always add a comment explaining the reason

5. **Check for CSS conflicts** when styles aren't applying as expected
   - Search the entire codebase for the class name to find conflicting rules
   - Use browser DevTools to inspect which CSS rules are being applied and from which files

#### Debugging CSS Issues Checklist

When styles aren't applying as expected:

1. ✅ **Check browser DevTools** - Inspect the element and see which CSS rules are applied and which are overridden
2. ✅ **Search for class name globally** - `grep -r "\.className" src/` to find all occurrences
3. ✅ **Check CSS specificity** - More specific selectors win
4. ✅ **Check cascade order** - Later rules override earlier ones with same specificity
5. ✅ **Check for inline styles** - Inline styles override CSS files
6. ✅ **Hard refresh browser** - `Ctrl+Shift+R` to clear cached CSS
7. ✅ **Restart dev server** - Vite may not hot-reload CSS changes in some cases
8. ✅ **Check inheritance** - Child elements may not inherit properties you expect

#### CSS Scoping Reference

**Current page classes:**
- Landing: `.landing-page`
- Lottery: `.lottery-page`
- Auctions: `.auctions-page`
- FAQ/How It Works: `.how-it-works-page`

**Always prefix page-specific styles with these classes to prevent conflicts.**

- to memorize
- to memorize
- to memorize