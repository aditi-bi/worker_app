import type { ReactNode } from 'react'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'

interface AppShellProps {
  header?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/**
 * Page frame: a centred column that is phone-width on phones and comfortably
 * wide (max 768px) on tablets and desktops, with an optional sticky bottom nav.
 */
export function AppShell({ header, children, footer }: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-bg">
      <OfflineBanner />
      {header}
      <main className="flex min-w-0 flex-1 flex-col px-4 pb-6 pt-4 md:px-8 lg:px-12">{children}</main>
      {footer}
    </div>
  )
}
