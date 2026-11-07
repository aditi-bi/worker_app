import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { AppShell } from '@/components/layout/AppShell'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageHeader } from '@/components/layout/PageHeader'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ListRow } from '@/components/ui/ListRow'
import { ReadAloudButton } from '@/components/ui/ReadAloudButton'

const TOPICS = [
  { key: 'payLate', icon: 'rupee' },
  { key: 'safe', icon: 'shield' },
  { key: 'askJob', icon: 'phone' },
  { key: 'changeNumber', icon: 'user' },
] as const

/** PLACEHOLDER number: set VITE_SUPPORT_PHONE to the real support line. */
const SUPPORT_PHONE = (import.meta.env.VITE_SUPPORT_PHONE as string | undefined) ?? ''

export default function HelpPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useState<(typeof TOPICS)[number]['key'] | null>(null)
  return (
    <AppShell header={<PageHeader title={t('help.title')} onBack={() => navigate('/jobs')} />} footer={<BottomNav />}>
      <div className="flex flex-col gap-2.5">
        {TOPICS.map((topic) => (
          <ListRow key={topic.key} icon={topic.icon} onClick={() => setOpen(topic.key)}>
            {t(`help.${topic.key}`)}
          </ListRow>
        ))}
        {SUPPORT_PHONE && (
          <a href={`tel:${SUPPORT_PHONE}`} className="mt-2 flex min-h-14 items-center justify-center gap-2 rounded-full bg-night px-6 text-lg font-bold text-white">
            <Icon name="phone" size={22} className="text-accent" />
            {t('help.support')}
          </a>
        )}
      </div>
      {open && (
        <BottomSheet open title={t(`help.${open}`)} onClose={() => setOpen(null)}>
          <div className="flex flex-col gap-3">
            <p className="text-lg">{t(`help.${open}Answer`)}</p>
            <ReadAloudButton text={`${t(`help.${open}`)}. ${t(`help.${open}Answer`)}`} />
          </div>
        </BottomSheet>
      )}
    </AppShell>
  )
}
