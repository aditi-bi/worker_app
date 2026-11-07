import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { voiceProxy } from './voice-proxy'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), voiceProxy(env)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      host: true,
      port: 5173,
      // Allow tunnel links (ngrok) to reach the dev server.
      allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io'],
      // When the real FastAPI backend is used (VITE_USE_MOCKS=false), forward /api to it.
      proxy: {
        ...(env.VITE_API_PROXY_TARGET ? { '/api': { target: env.VITE_API_PROXY_TARGET, changeOrigin: true } } : {}),
        // The job list: /jobs-api/* goes to JOBS_API_PROXY_TARGET (for example the tunnel link). Use VITE_JOBS_API_URL=/jobs-api.
        ...(env.JOBS_API_PROXY_TARGET ? { '/jobs-api': { target: env.JOBS_API_PROXY_TARGET, changeOrigin: true, rewrite: (path: string) => path.replace(/^\/jobs-api/, '') } } : {}),
        // Profile calls only: /profile-api/* goes to the real backend (PROFILE_API_PROXY_TARGET) with its token added here, so no CORS
        // setup and no token in the browser while developing. Use VITE_PROFILE_API_URL=/profile-api.
        ...(env.PROFILE_API_PROXY_TARGET
          ? {
              '/profile-api': {
                target: env.PROFILE_API_PROXY_TARGET,
                changeOrigin: true,
                rewrite: (path: string) => path.replace(/^\/profile-api/, ''),
                configure: (proxy: { on: (event: string, handler: (req: { setHeader: (name: string, value: string) => void }) => void) => void }) => {
                  if (env.PROFILE_API_TOKEN) proxy.on('proxyReq', (req) => req.setHeader('Authorization', `Bearer ${env.PROFILE_API_TOKEN}`))
                },
              },
            }
          : {}),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
      css: false,
    },
  }
})
