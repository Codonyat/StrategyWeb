# Strategy (MONSTR) - Developer Reference

## Development Rules
- Prefer simplicity over complexity
- Use relative paths for file operations (e.g., `src/config/abi.js`)
- Read queries: Use internal RPC from `.env` (work without wallet)
- Write transactions: Use wallet's RPC (requires connection)
- **Number formatting**: Use 3 significant digits by default via `<DisplayFormattedNumber num={value} significant={3} />`

## Contract Mechanics

### Core Operations
- **Minting period (24h)**: 1 MON = 1 MONSTR (1:1)
- **Post-minting**: Minting at backing ratio (if below max supply cap)
- **Redemption**: Burn MONSTR → receive proportional MON
- **Fee**: 1% on all mints, burns, transfers

### Lottery & Auctions
- **Lottery**: Daily (25h pseudo-day), weighted by balance, 1min delay required
  - Minting period: Gets 100% fees
  - Post-minting: Gets 50% fees
- **Auctions**: Post-minting only, 50% fees, uses WMON, 10% bid increment, 50% min bid
- **Prizes**: 7-day rolling arrays, unclaimed → treasury

### Key Addresses
- `FEES_POOL`: `0x00000000000fee50000000AdD2E5500000000000`
- `LOT_POOL`: `0x0000000000010700000000aDD2E5500000000000`
- `Treasury`: `0x5000Ff6Cc1864690d947B864B9FB0d603E8d1F1A`

### Key Functions
**Write:** `mint()`, `mintFeeFree()`, `redeem(uint256)`, `executeLottery()`, `claim()`, `bid(uint256)`
**Read:** `balanceOf()`, `totalSupply()`, `getCurrentDay()`, `getMyClaimableAmount()`, `getAllUnclaimedPrizes()`, `currentAuction()`, `currentLotteryPool()`

## Configuration

### File Structure
- `src/config/abi.js` - Contract ABI
- `src/config/contract.js` - Chain-indexed config (network, tokens, branding, colors)
- `src/config/contract-constants.json` - Build-time constants (deploymentTime, MINTING_PERIOD)
- `api/` - Vercel serverless functions (production)
- `.env` - Runtime config

### API Routes / Serverless Functions
**Development** (`npm run dev`): Vite proxies in `vite.config.js` handle `/api/*` routes, forwarding requests to external services with server-side env vars.

**Production** (Vercel): Serverless functions in `api/` folder handle the same routes.

**Pattern**: When adding a new API route:
1. Create serverless function in `api/{route}.js`
2. Add corresponding Vite proxy in `vite.config.js` under `server.proxy`
3. Hook/component fetches from `/api/{route}` - works in both environments

**Current routes:**
- `/api/rpc` → Alchemy RPC (uses `RPC_URL`)
- `/api/subgraph` → Goldsky GraphQL (uses `GOLDSKY_SUBGRAPH_URL`, `GOLDSKY_API_TOKEN`)
- `/api/mon-price` → Alchemy Price API (extracts key from `RPC_URL`)

### Contract Constants
**CRITICAL**: `deploymentTime` and `MINTING_PERIOD` are fetched at build time and saved to `contract-constants.json`. Never refetch at runtime.

```js
import contractConstants from '../config/contract-constants.json';
const deploymentTime = Number(contractConstants.deploymentTime);
```

### Networks
- **Testnet**: Chain ID 10143
- **Mainnet**: Chain ID 143

### Coin Image Assets
**IMPORTANT**: Use the correct image files for each context:

**For inline text, balances, and UI elements:**
- MON: `/coins/mon-logo.png`
- MONSTR: `/coins/monstr-logo.png`

**For animated logo component only:**
- MONSTR icon: `/coins/monstr-icon.png` (used with AnimatedLogo)

**For hero sections and coin flip:**
- MON: `/coins/mon.png`
- MONSTR: `/coins/monstr.png`

**Naming convention:**
- `{token}-logo.png` - Inline use (balances, text)
- `{token}-icon.png` - Special components (animated logo)
- `{token}.png` - Large hero sections

## Modal Design

### Structure
- Width: `max-width: 480px`
- Radii: `var(--radius-xl)` container, `var(--radius-md)` inner elements
- Auto-focus input on open
- Escape key + backdrop click to close
- Auto-close success after 2s

### Color Semantics
- **Deposit/Mint**: Green gradients (`--color-success` → `--color-secondary`)
- **Burn/Destructive**: Red gradients (`--color-primary` → `--color-secondary`)
- **Neutral**: Purple (`--color-purple`)
- **Input focus**: Neutral border (`--color-border-light`), NO colored glow

### Inputs
- No number spinners
- Token symbol inside (right-aligned)
- Padding: `1rem 1.25rem`, `padding-right: 90px`
- Shortcut buttons (25%, 50%, MAX): Purple hover, auto-deselect on manual edit

### Buttons
- Full-width pill (`border-radius: 9999px`)
- Dark bg (`--color-background-card`) + border (`--color-border-light`)
- Gradient overlay via `::before` (opacity 0 → 0.1 on hover)
- Hover: lift + scale + glow + border color change
- Loading: spinner + status text
- Labels: Concise ("Deposit MON", not "Deposit & Mint")

### Info Display
```
Label (#909090)                Value (white, bold, right-aligned)
You will receive               ~X MONSTR (plain span, no wrapper)
Exchange rate                  1:X.XX (ratio notation)
Fee                            1%
```

### Calculations
Always show real-time calculations. During minting: `amount * 0.99`. Post-minting: `amount / backingRatio * 0.99`.

### Error Messages
- **Reserved space**: Use `.error-text-reserved` (min-height: 1.75rem) to prevent layout shifts
- **Simple text**: Display errors as plain text (`.error-text`), NO boxes or backgrounds
- **Color**: `--color-primary` (red/pink) for errors
- **Pattern**:
```jsx
<div className="error-text-reserved">
  {error && <span className="error-text">{error}</span>}
</div>
```

### State Management
- **Reset on open**: Always reset `amount`, `error`, and `selectedPercentage` when modal opens
- **Pattern**:
```jsx
useEffect(() => {
  if (isOpen) {
    setAmount('');
    setError('');
    setSelectedPercentage(null);
  }
}, [isOpen]);
```
- **Auto-close on success**: Clear state and close after 2s delay

### Conditional Elements
- Only show warnings/messages when relevant (e.g., backing ratio warning only post-minting)
- Use conditional rendering: `{!isMintingPeriod && <div>...</div>}`

## Page Structure Standards

### Page Header Section
**CRITICAL**: All pages must use standardized header classes for the tagline/subtitle at the top.

**HTML Structure:**
```jsx
<div className="{page-name}-page">
  <section className="page-header-section">
    <div className="page-header-content">
      <p className="page-tagline">
        Your tagline text here.
      </p>
    </div>
  </section>
  {/* Rest of page content */}
</div>
```

**Shared Classes (defined in index.css):**
- `.page-header-section` - Outer section wrapper
- `.page-header-content` - Inner content wrapper (centers and constrains width)
- `.page-tagline` - The tagline/subtitle text

**Page-Specific Customizations:**
If a page needs custom styling, scope it with the page class:
```css
.landing-page .page-header-section {
  /* Landing-specific overrides */
}
```

**Example:** The Landing page adds a radial gradient background via `.landing-page .page-header-section::before`

## Design System

### Colors
```css
/* Backgrounds */
--color-background: #0d0d0d
--color-background-light: #1a1a1a
--color-background-card: #1f1f1f

/* Brand */
--color-primary: #ff3864        /* Pink/red - burns, errors */
--color-secondary: #00d4ff      /* Cyan - accents */
--color-purple: #8a2be2         /* Brand purple */
--color-success: #00ff88        /* Green - mints, gains */
--color-accent: #ffd700         /* Gold - warnings */

/* Text */
--color-text-primary: #ffffff
--color-text-secondary: #b0b0b0
--color-text-muted: #707070

/* Borders */
--color-border: #2a2a2a
--color-border-light: #404040
--color-border-hover: #555555
```

**Usage:**
- Green: Deposits, mints, success
- Red/Pink: Burns, withdrawals, errors
- Purple: Brand elements, large numbers
- Cyan: Links, info
- Gold: Warnings, CTAs

### Typography
```css
/* Headings */
h1: 2.5-3rem, weight 700
h2: 2rem, weight 700
h3: 1.5rem, weight 600

/* Body */
1rem (400), 0.875rem, 0.75rem, 0.7rem

/* Spacing */
Tight: -0.02em to -0.01em (headings)
Wide: 0.05em-0.1em (labels, buttons)
```

### Spacing & Radius
```css
--spacing-xs: 0.5rem    /* 8px */
--spacing-sm: 1rem      /* 16px */
--spacing-md: 1.5rem    /* 24px */
--spacing-lg: 2rem      /* 32px */
--spacing-xl: 3rem      /* 48px */
--spacing-2xl: 4rem     /* 64px */

--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
/* Pills: 9999px */
```

### Buttons
**Pill (Primary):**
```css
padding: 1rem 2rem; border-radius: 9999px
border: 2px solid var(--color-border-light)
background: var(--color-background-card)
::before gradient (opacity 0 → 0.1 on hover)
Hover: translateY(-3px) scale(1.02) + glow
```

**Compact:**
```css
padding: 0.5rem 1rem; font-size: 0.75rem
font-weight: 700; text-transform: uppercase
letter-spacing: 0.05em; border-radius: 9999px
```

### Cards
```css
background: var(--color-background-card)
border: 1px solid var(--color-border)
border-radius: var(--radius-xl)
padding: var(--spacing-lg)
Hover: lift (-4px) + glow + border color change
```

### Animations
```css
--transition-fast: 150ms ease
--transition-base: 250ms ease
--transition-slow: 350ms ease
cubic-bezier(0.4, 0, 0.2, 1)  /* Material easing */

/* Hover: lift + scale */
transform: translateY(-3px) scale(1.02)

/* Press */
transform: translateY(-1px) scale(0.98)
```

### Glows
```css
/* Green */ box-shadow: 0 0 12px rgba(0, 255, 136, 0.4)
/* Red */   box-shadow: 0 0 12px rgba(255, 56, 100, 0.4)
/* Purple */ box-shadow: 0 0 12px rgba(138, 43, 226, 0.4)
/* Cyan */  box-shadow: 0 0 12px rgba(0, 212, 255, 0.4)
```

### Tooltips
```css
.status-chip-tooltip {
  background: #3a3a3a; color: #ffffff
  padding: 8px 12px; font-size: 0.7rem
  max-width: 200px; line-height: 1.4
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55)
}
/* Use <strong> for emphasis, not color */
```

### Accessibility
- Min touch target: 44px × 44px
- Use `:focus-visible` for focus states
- Text contrast: `#ffffff` on dark, `#b0b0b0` for secondary (WCAG AA)

### Responsive
```css
@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px)  { /* Mobile */ }
@media (max-width: 640px)  { /* Small */ }
```
Mobile: Single column grids, reduce spacing 25-50%, increase touch targets, use `clamp()` for fluid type

## CSS Best Practices

### Critical: CSS Scoping
**Problem:** In React/Vite, all CSS bundles together. Unscoped class names conflict across pages.

**Bad:**
```css
.section-title { font-size: 2rem; }  /* Affects ALL pages */
```

**Good:**
```css
.landing-page .section-title { font-size: 2rem; }
.lottery-page .section-title { font-size: 2rem; }
```

**Page classes:**
- `.landing-page`
- `.lottery-page`
- `.auctions-page`
- `.how-it-works-page`

**Quick fix:** Use `font-size: inherit !important` to force parent inheritance

### Debugging Checklist
1. DevTools → see which rules apply/override
2. Search class globally: `grep -r "\.className" src/`
3. Check specificity, cascade order, inline styles
4. Hard refresh (`Ctrl+Shift+R`)
5. Restart dev server
6. Check inheritance (children may not inherit as expected)

---

**Design tokens:** All in `src/index.css`. Always use `var(--*)`, never hardcode values.
