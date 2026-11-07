import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/ui/IconButton'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  action?: ReactNode
}

/** Header for inner screens: back button, title and an optional action (e.g. read aloud). */
export function PageHeader({ title, onBack, action }: PageHeaderProps) {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-30 flex items-center gap-1 bg-bg px-2 py-2 md:px-6 lg:px-10">
      {onBack && <IconButton icon="arrowLeft" label={t('common.back')} onClick={onBack} />}
      <h1 className="flex-1 truncate px-2 text-xl font-bold text-ink">{title}</h1>
      {action}
    </header>
  )
}
