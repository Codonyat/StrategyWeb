/**
 * Vercel Serverless Function - Subgraph Proxy
 *
 * This function proxies GraphQL requests to the subgraph endpoint,
 * adding the authentication token server-side to keep it secure.
 *
 * Works with any GraphQL subgraph provider that uses Bearer token auth:
 * - TheGraph (https://api.studio.thegraph.com/query/...)
 * - Goldsky (https://api.goldsky.com/api/private/...)
 *
 * Environment Variables Required:
 * - SUBGRAPH_URL: The subgraph GraphQL endpoint
 * - SUBGRAPH_API_TOKEN: Your API token (server-side only, NOT prefixed with VITE_)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const SUBGRAPH_URL = process.env.SUBGRAPH_URL;
  const SUBGRAPH_API_TOKEN = process.env.SUBGRAPH_API_TOKEN;

  // Validate environment variables
  if (!SUBGRAPH_URL) {
    console.error('SUBGRAPH_URL is not configured');
    return res.status(500).json({ error: 'Subgraph endpoint not configured' });
  }

  if (!SUBGRAPH_API_TOKEN) {
    console.error('SUBGRAPH_API_TOKEN is not configured');
    return res.status(500).json({ error: 'Authentication token not configured' });
  }

  try {
    // Forward the GraphQL request to subgraph with authentication
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUBGRAPH_API_TOKEN}`,
      },
      body: JSON.stringify(req.body),
    });

    // Get the response data
    const data = await response.json();

    // Forward the status code and response
    if (!response.ok) {
      console.error('Subgraph API error:', response.status, data);
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
