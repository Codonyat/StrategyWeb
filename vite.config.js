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
        // Proxy /api/subgraph to Goldsky in development
        '/api/subgraph': {
          target: env.GOLDSKY_SUBGRAPH_URL,
          changeOrigin: true,
          rewrite: (path) => '', // Remove /api/subgraph prefix, send directly to Goldsky
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Add authentication header using server-side env var
              const token = env.GOLDSKY_API_TOKEN;
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
      },
    },
  }
})
