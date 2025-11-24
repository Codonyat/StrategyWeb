# Coin Images

This directory contains coin/token logos for MONSTR and MON.

## Files

- `monstr.png` - Main MONSTR token logo
- `monstr-logo.png` - MONSTR logo for inline use (balances, text)
- `monstr-icon.png` - MONSTR icon for animated logo component
- `mon.png` - Main MON token logo
- `mon-logo.png` - MON logo for inline use (balances, text)

## Adding Coin Images

1. Provide versions of each token logo:
   - **Large logo**: `{token}.png` (e.g., `monstr.png`) - For hero sections, coin flip
   - **Inline logo**: `{token}-logo.png` (e.g., `monstr-logo.png`) - For inline use in balances, text
   - **Icon**: `{token}-icon.png` (e.g., `monstr-icon.png`) - For special components (animated logo)

## File Formats & Sizes

**Recommended: SVG**
- Scales perfectly to any size without quality loss
- Small file size
- Large logos: Design at 512x512px reference size
- Small icons: Design at 128x128px reference size

**Alternative: PNG**
- Large logos: 512x512px or 1024x1024px for retina displays
- Small icons: 128x128px or 256x256px for retina displays

## Usage in Code

The configuration includes paths to images:

```javascript
import { theme } from './config/contract';

// Large logos (hero sections, coin flip)
theme.strategyCoin.logo      // → /coins/monstr.png
theme.nativeCoin.logo        // → /coins/mon.png
theme.wrappedCoin.logo       // → /coins/mon.png

// Inline logos (balances, inline text)
theme.strategyCoin.logoSmall // → /coins/monstr-logo.png
theme.nativeCoin.logoSmall   // → /coins/mon-logo.png
theme.wrappedCoin.logoSmall  // → /coins/mon-logo.png
```

**Example usage:**
```jsx
// Large logo in hero
<img src={theme.strategyCoin.logo} alt={theme.strategyCoin.name} />

// Small icon inline with text
<img src={theme.nativeCoin.logoSmall} className="inline-icon" />
```
