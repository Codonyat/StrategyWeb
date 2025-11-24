/**
 * Vercel Serverless Function - Goldsky Subgraph Proxy
 *
 * This function proxies GraphQL requests to the private Goldsky subgraph endpoint,
 * adding the authentication token server-side to keep it secure.
 *
 * Environment Variables Required:
 * - GOLDSKY_SUBGRAPH_URL: The private Goldsky subgraph endpoint
 * - GOLDSKY_API_TOKEN: Your Goldsky API token (server-side only, NOT prefixed with VITE_)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const GOLDSKY_SUBGRAPH_URL = process.env.GOLDSKY_SUBGRAPH_URL;
  const GOLDSKY_API_TOKEN = process.env.GOLDSKY_API_TOKEN;

  // Validate environment variables
  if (!GOLDSKY_SUBGRAPH_URL) {
    console.error('GOLDSKY_SUBGRAPH_URL is not configured');
    return res.status(500).json({ error: 'Subgraph endpoint not configured' });
  }

  if (!GOLDSKY_API_TOKEN) {
    console.error('GOLDSKY_API_TOKEN is not configured');
    return res.status(500).json({ error: 'Authentication token not configured' });
  }

  try {
    // Forward the GraphQL request to Goldsky with authentication
    const response = await fetch(GOLDSKY_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GOLDSKY_API_TOKEN}`,
      },
      body: JSON.stringify(req.body),
    });

    // Get the response data
    const data = await response.json();

    // Forward the status code and response
    if (!response.ok) {
      console.error('Goldsky API error:', response.status, data);
      return res.status(response.status).json(data);
    }

    // Set CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from subgraph',
      message: error.message
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export const config = {
  api: {
    bodyParser: true,
  },
};
