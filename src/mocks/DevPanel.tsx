import { useState } from 'react'
import { seedDemo } from './db'
import { getScenario, isScenario, SCENARIOS, setScenario } from './scenarios'

/**
 * Development-only switch for mock scenarios (empty list, server error, slow
 * network...). Only rendered when the mock API is on; never in a real build.
 */
export function DevPanel() {
  const [open, setOpen] = useState(false)
  const [scenario, setLocal] = useState(getScenario)
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return null

  return (
    <div className="fixed bottom-20 left-2 z-40 text-sm">
      {open ? (
        <div className="w-56 rounded-xl border border-line bg-surface p-3 shadow-card">
          <label className="mb-1 block font-semibold text-ink" htmlFor="dev-scenario">
            Mock scenario
          </label>
          <select
            id="dev-scenario"
            className="mb-2 w-full rounded-lg border border-line bg-bg p-2 text-ink"
            value={scenario}
            onChange={(e) => {
              if (isScenario(e.target.value)) {
                setScenario(e.target.value)
                setLocal(e.target.value)
              }
            }}
          >
            {SCENARIOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="mb-2 flex gap-2">
            <button className="flex-1 rounded-lg border border-line px-2 py-2 text-ink" onClick={() => { seedDemo(); window.location.reload() }}>
              Seed demo
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-brand px-2 py-2 font-semibold text-brand-ink" onClick={() => window.location.reload()}>
              Apply (reload)
            </button>
            <button className="rounded-lg border border-line px-3 py-2 text-ink" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-bg opacity-70 hover:opacity-100"
          aria-label="Open developer mock panel"
        >
          Dev · {scenario}
        </button>
      )}
    </div>
  )
}
