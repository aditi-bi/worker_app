import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { voiceProxy } from './voice-proxy'

/**
 * Testing only (npm run dev, never in a build): with JOBS_SNAPSHOT_FILE set in .env.local, /jobs-api/api/jobs/ is answered from a saved
 * copy of the job list instead of the live address. Remove the setting to go back to the live list.
 */
function jobsSnapshot(file: string | undefined): Plugin {
  return {
    name: 'phala-jobs-snapshot',
    apply: 'serve',
    configureServer(server) {
      if (!file) return
      const path = resolve(process.cwd(), file)
      server.config.logger.warn(`[jobs] using the saved copy ${file}, not the live job list`)
      server.middlewares.use('/jobs-api/api/jobs', async (_req, res) => {
        try {
          const body = await readFile(path)
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(body)
        } catch {
          res.statusCode = 404
          res.end('{"error":"snapshot_missing"}')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), voiceProxy(env), jobsSnapshot(env.JOBS_SNAPSHOT_FILE)],
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
