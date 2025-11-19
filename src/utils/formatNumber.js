/**
 * Format result for very small numbers using subscript notation
 * @typedef {Object} SmallNumberFormat
 * @property {'small'} type - Type identifier
 * @property {string} sign - Sign of the number ("-" or "")
 * @property {number} zeroCount - Number of leading zeros after decimal
 * @property {string} sigDigits - Significant digits
 */

/**
 * Format a number intelligently based on its magnitude
 * @param {number|string|bigint} input - The number to format
 * @param {number} significant - Number of significant digits (default: 3)
 * @returns {string|SmallNumberFormat} Formatted number or object for subscript rendering
 */
export function formatNumber(input, significant = 3) {
  // Step 1: Input validation and conversion
  let num;

  if (typeof input === 'bigint') {
    num = parseFloat(input.toString());
  } else if (typeof input === 'string') {
    num = parseFloat(input);
  } else {
    num = input;
  }

  // Handle invalid numbers
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return "0";
  }

  // Handle zero
  if (num === 0) {
    return "0";
  }

  // Extract sign
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);

  // Step 2: Route to appropriate formatter based on magnitude

  // Case 1: Very small numbers (< 0.001) - Use subscript notation
  if (absNum < 0.001) {
    return formatSmallNumber(absNum, sign, significant);
  }

  // Case 2: Small numbers (0.001 - 0.999) - Decimal with precision
  if (absNum < 1) {
    const formatted = absNum.toPrecision(significant);
    return sign + parseFloat(formatted).toString();
  }

  // Case 3: Regular numbers (1 - 999) - Standard decimal
  if (absNum < 1000) {
    const formatted = absNum.toPrecision(significant);
    return sign + parseFloat(formatted).toString();
  }

  // Case 4: Large numbers (>= 1000) - Abbreviated with K/M/B/T/Q
  return formatLargeNumber(absNum, sign, significant);
}

/**
 * Format very small numbers with subscript notation
 * @private
 */
function formatSmallNumber(absNum, sign, significant) {
  const numStr = absNum.toString();

  // Handle scientific notation (e.g., "1.23e-5")
  if (numStr.includes('e-')) {
    const [mantissa, exponent] = numStr.split('e-');
    const exp = parseInt(exponent, 10);
    const mantissaDigits = mantissa.replace('.', '');

    // Zero count = exponent - 1
    const zeroCount = exp - 1;

    // Get significant digits
    const sigDigits = mantissaDigits.slice(0, significant);

    return {
      type: 'small',
      sign,
      zeroCount,
      sigDigits
    };
  }

  // Handle decimal notation (e.g., "0.0001234")
  // Count leading zeros after decimal point
  const afterDecimal = numStr.split('.')[1] || '';
  let zeroCount = 0;

  for (let i = 0; i < afterDecimal.length; i++) {
    if (afterDecimal[i] === '0') {
      zeroCount++;
    } else {
      break;
    }
  }

  // Extract significant digits (non-zero digits)
  const nonZeroDigits = afterDecimal.slice(zeroCount);
  const sigDigits = nonZeroDigits.slice(0, significant);

  return {
    type: 'small',
    sign,
    zeroCount,
    sigDigits
  };
}

/**
 * Format large numbers with K/M/B/T/Q suffixes
 * @private
 */
function formatLargeNumber(absNum, sign, significant) {
  // Calculate order of magnitude
  const magnitude = Math.floor(Math.log10(absNum));

  // Determine decimal places needed to maintain significant digits
  const decimalPlaces = Math.max(0, significant - magnitude % 3 - 1);

  // Define suffixes
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Q'];
  const tier = Math.floor(magnitude / 3);
  const suffix = suffixes[Math.min(tier, suffixes.length - 1)] || '';

  // Scale the number
  const scale = Math.pow(10, tier * 3);
  const scaled = absNum / scale;

  // Format with appropriate decimal places
  let formatted = scaled.toFixed(decimalPlaces);

  // Clean up trailing zeros
  formatted = formatted.replace(/\.0+$/, '');  // Remove .0, .00, etc.
  formatted = formatted.replace(/(\.\d*?)0+$/, '$1');  // Remove trailing zeros after decimal
  formatted = formatted.replace(/\.$/, '');  // Remove empty decimal point

  return sign + formatted + suffix;
}
