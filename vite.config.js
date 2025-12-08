import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy /api/rpc to Alchemy in development
        '/api/rpc': {
          target: env.RPC_URL,
          changeOrigin: true,
          rewrite: (path) => '', // Remove /api/rpc prefix, send directly to RPC
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (req.method === 'POST') {
                proxyReq.setHeader('Content-Type', 'application/json');
              }
            });
          },
        },
        // Proxy /api/subgraph to subgraph provider (TheGraph, Goldsky, etc.) in development
        '/api/subgraph': {
          target: env.SUBGRAPH_URL,
          changeOrigin: true,
          rewrite: (path) => '', // Remove /api/subgraph prefix, send directly to subgraph
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add authentication header using server-side env var
              const token = env.SUBGRAPH_API_TOKEN;
              if (token) {
                proxyReq.setHeader('Authorization', `Bearer ${token}`);
              }
              // Ensure content-type is set
              if (req.method === 'POST') {
                proxyReq.setHeader('Content-Type', 'application/json');
              }
            });
          },
        },
        // Proxy /api/native-price to Alchemy Price API in development
        '/api/native-price': {
          target: 'https://api.g.alchemy.com',
          changeOrigin: true,
          rewrite: (path) => '/prices/v1/tokens/by-symbol?symbols=MEGA',
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const apiKey = env.ALCHEMY_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
              proxyReq.setHeader('Accept', 'application/json');
            });
          },
        },
      },
    },
  }
})
