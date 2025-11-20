# Strategy (MONSTR) Token Contract Summary

## Overview
Strategy.sol is an ERC20 token contract with the symbol **MONSTR**, backed by MON (Monad's native currency). The contract implements a sophisticated tokenomics system with lottery and auction mechanics.

## Development Guidelines
- **Prefer simplicity**: When possible, use simple, straightforward solutions instead of over-engineered ones
- Keep implementations minimal and easy to understand

## RPC and Chain ID Usage
**IMPORTANT**: The app uses different RPC/chain configurations for queries vs transactions:
- **Read queries** (e.g., `useReadContract`, `useBalance`): Use the internal RPC URL and chain ID from `.env` (`VITE_CHAIN_ID` and `VITE_RPC_URL` or network defaults). These queries work WITHOUT wallet connection.
- **Write transactions** (e.g., `useWriteContract`): Use the wallet's configured RPC and chain ID. The wallet must be connected and on the correct network to sign transactions.

This separation allows the app to display protocol stats and data regardless of wallet connection state or which chain the wallet is connected to.

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
- **Deposit/Mint actions**: Green gradient (`--color-success` to `--color-secondary`)
- **Burn/Destructive actions**: Red-to-purple gradient (`--color-primary` to `--color-purple`)
- **Neutral actions**: Use default system colors
- Focus states: Match the action color (green for deposit, red for burn)

#### 3. **Input Fields**
```css
/* Standard input styling */
- Remove browser number spinners completely
- Token symbol displayed inside input (right-aligned, matching input font size)
- Neutral border (`--color-border`) when unfocused
- Colored border + glow on focus (green/red depending on action)
- Padding: `1rem 1.25rem`, with `padding-right: 120px` to prevent overlap
```

#### 4. **Helper Elements**
- **Balance line**: Lighter gray (`#808080`), clickable to set max, shows hover state
- **MAX button**: Pill-shaped, uppercase, hovers to action color with glow
- **Quick amount buttons** (for burn): 25%, 50%, 75% options below balance
- **Transaction info box**: Separate section with `margin-top: 1.5rem`, smaller radius than modal

#### 5. **Button Design**
```javascript
// Primary action buttons in modals - calmer than hero CTAs
- Full width pill style (`border-radius: 9999px`)
- Single-hue gradient for semantic clarity (not rainbow)
  - Deposit: green → darker green (#00e887 → #00b366)
  - Burn: magenta → darker magenta (#ff3864 → #cc2d50)
- No shadow by default (cleaner for modal context)
- Uppercase text with tight letter spacing (`0.02em`)
- Subtle hover: slight lift (1px) + 1% scale + brightness
- Active state: scale down slightly (0.99)
- Disabled: 50% opacity, no transform
- Loading state shows spinner + status text ("Waiting for approval", "Confirming")
- Labels should be concise: "Deposit MON", "Burn MONSTR" (not "Deposit & Mint")

// Philosophy: Hero buttons are stars (loud gradients), modal buttons are confirmations (calm, semantic)
```

#### 6. **Information Hierarchy**
```
Label (lighter gray #909090)          Value (white, right-aligned, bold)
─────────────────────────────────────────────────────────────────────
You will receive                       ~X MONSTR (highlighted in action color)
Exchange rate / Backing ratio          1:1 or Xx
Fee                                    1%
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

- to memorize
- to memorize