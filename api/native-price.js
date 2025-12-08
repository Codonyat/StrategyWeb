/**
 * Vercel Serverless Function - MON Price Proxy
 *
 * This function fetches the MON price from Alchemy's Price API,
 * keeping the API key secure on the server side.
 *
 * Environment Variables Required:
 * - ALCHEMY_API_KEY: The Alchemy API key
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

  if (!ALCHEMY_API_KEY) {
    console.error('ALCHEMY_API_KEY environment variable not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      'https://api.g.alchemy.com/prices/v1/tokens/by-symbol?symbols=MEGA',
      {
        headers: {
          'Authorization': `Bearer ${ALCHEMY_API_KEY}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Alchemy Price API error:', response.status);
      return res.status(response.status).json({ error: 'Failed to fetch price' });
    }

    const data = await response.json();

    // Extract USD price from response
    if (data?.data?.[0]?.prices?.[0]?.value) {
      const usdPrice = parseFloat(data.data[0].prices[0].value);
      return res.status(200).json({
        price: usdPrice,
        lastUpdatedAt: data.data[0].prices[0].lastUpdatedAt,
      });
    } else if (data?.data?.[0]?.error) {
      return res.status(404).json({ error: data.data[0].error });
    } else {
      return res.status(404).json({ error: 'Price not available' });
    }
  } catch (error) {
    console.error('MON price proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch price',
      message: error.message,
    });
  }
}
