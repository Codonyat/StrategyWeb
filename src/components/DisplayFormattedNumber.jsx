import { useMemo } from 'react';
import { formatNumber } from '../utils/formatNumber';

/**
 * DisplayFormattedNumber - Intelligently format numbers across all magnitude ranges
 * 
 * @param {Object} props
 * @param {number|string|bigint} props.num - The number to format
 * @param {number} [props.significant=3] - Number of significant digits
 * @returns {JSX.Element}
 * 
 * @example
 * // Very small numbers - Subscript notation
 * <DisplayFormattedNumber num={0.0000456} significant={3} />
 * // Output: 0.0₄56
 * 
 * @example
 * // Large numbers - Abbreviated
 * <DisplayFormattedNumber num={1234567} significant={3} />
 * // Output: 1.23M
 */
export function DisplayFormattedNumber({ num, significant = 3 }) {
  const formattedData = useMemo(() => {
    const formatted = formatNumber(num, significant);

    // Check if result is SmallNumberFormat object
    if (typeof formatted === 'object' && formatted.type === 'small') {
      return (
        <>
          {formatted.sign}0.0<sub>{formatted.zeroCount}</sub>{formatted.sigDigits}
        </>
      );
    }

    // Otherwise it's a string
    return formatted;
  }, [num, significant]);

  return <>{formattedData}</>;
}

export default DisplayFormattedNumber;
