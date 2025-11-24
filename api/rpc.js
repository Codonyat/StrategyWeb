/**
 * Vercel Serverless Function - RPC Proxy
 *
 * This function proxies JSON-RPC requests to the private RPC endpoint,
 * keeping the RPC URL secure on the server side.
 *
 * Environment Variables Required:
 * - RPC_URL: The private RPC endpoint (server-side only, NOT prefixed with VITE_)
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const RPC_URL = process.env.RPC_URL;

  // Validate environment variable
  if (!RPC_URL) {
    console.error('RPC_URL is not configured');
    return res.status(500).json({ error: 'RPC endpoint not configured' });
  }

  try {
    // Forward the JSON-RPC request to the private RPC
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Get the response data
    const data = await response.json();

    // Forward the status code and response
    if (!response.ok) {
      console.error('RPC error:', response.status, data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('RPC proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from RPC',
      message: error.message
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
