import '@/mocks/freshStart'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import '@/i18n'
import App from '@/app/App'

/** With VITE_USE_MOCKS=true the in-browser mock API (MSW) answers /api requests; otherwise the real FastAPI is called. */
async function prepare() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { startMockServer } = await import('@/mocks/browser')
    await startMockServer()
  }
}

void prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
