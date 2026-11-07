import type { ReactNode } from 'react'

interface OrbProps {
  size?: number
  children: ReactNode
}

/** Big turquoise circle with two soft rings (location, verification call). */
export function Orb({ size = 150, children }: OrbProps) {
  const ring1 = Math.round(size * 0.093)
  const ring2 = Math.round(size * 0.2)
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink"
      style={{ width: size, height: size, boxShadow: `0 0 0 ${ring1}px rgb(63 227 210 / 0.3), 0 0 0 ${ring2}px rgb(63 227 210 / 0.15)` }}
    >
      {children}
    </div>
  )
}
