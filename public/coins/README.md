# Coin Images

This directory contains coin/token logos organized by chain ID.

## Directory Structure

```
coins/
├── 143/          # Monad Mainnet
│   ├── monstr.svg           # Large logo (512x512px)
│   ├── monstr-icon.svg      # Small icon (128x128px)
│   ├── mon.svg
│   ├── mon-icon.svg
│   ├── wmon.svg
│   └── wmon-icon.svg
└── 10143/        # Monad Testnet
    ├── monstr.svg
    ├── monstr-icon.svg
    ├── mon.svg
    ├── mon-icon.svg
    ├── wmon.svg
    └── wmon-icon.svg
```

## Adding Coin Images

1. Place your coin images in the appropriate chain ID directory
2. Provide two versions of each token logo:
   - **Large logo**: `{token}.svg` (e.g., `monstr.svg`) - 512x512px for hero sections, coin flip
   - **Small icon**: `{token}-icon.svg` (e.g., `monstr-icon.svg`) - 128x128px for inline use, headers
3. Images are automatically loaded based on `VITE_CHAIN_ID` environment variable

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

The configuration includes full paths to images:

```javascript
import { theme } from './config/contract';

// Large logos (hero sections, coin flip)
theme.strategyCoin.logo      // → /coins/10143/monstr.svg
theme.nativeCoin.logo        // → /coins/10143/mon.svg
theme.wrappedCoin.logo       // → /coins/10143/wmon.svg

// Small icons (inline text, headers, buttons)
theme.strategyCoin.logoSmall // → /coins/10143/monstr-icon.svg
theme.nativeCoin.logoSmall   // → /coins/10143/mon-icon.svg
theme.wrappedCoin.logoSmall  // → /coins/10143/wmon-icon.svg
```

**Example usage:**
```jsx
// Large logo in hero
<img src={theme.strategyCoin.logo} alt={theme.strategyCoin.name} />

// Small icon inline with text
<img src={theme.nativeCoin.logoSmall} className="inline-icon" />
```

## Notes

- Switching networks (changing `VITE_CHAIN_ID`) automatically loads images from the corresponding directory
- If an image is missing, the browser will show a broken image icon
- Consider using the same design across both networks for consistency
