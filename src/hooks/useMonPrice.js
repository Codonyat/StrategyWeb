import { useState, useEffect, useCallback } from 'react';

const POLLING_INTERVAL = 60000; // 60 seconds for price updates

/**
 * Hook to fetch MON price from the serverless proxy.
 * The actual Alchemy API call happens server-side to keep the key secure.
 */
export function useMonPrice() {
  const [price, setPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch('/api/mon-price');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Handle serverless function response format
      if (data.price !== undefined) {
        setPrice(data.price);
        setError(null);
      }
      // Handle raw Alchemy response format (from Vite proxy in dev)
      else if (data?.data?.[0]?.prices?.[0]?.value) {
        const usdPrice = parseFloat(data.data[0].prices[0].value);
        setPrice(usdPrice);
        setError(null);
      } else if (data.error || data?.data?.[0]?.error) {
        setError(data.error || data.data[0].error);
        setPrice(null);
      } else {
        setError('Price not available');
        setPrice(null);
      }
    } catch (err) {
      console.error('Failed to fetch MON price:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return {
    price,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}
