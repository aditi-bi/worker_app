import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAreas } from '@/features/reference/useReferenceData'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { ProfileDetails } from '@/features/profile/components/ProfileDetails'
import { useMe } from '@/features/profile/useProfile'

/** "Your details" - what the call (or the tapped form) collected, with a pencil on every row. */
export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const first = (location.state as { first?: boolean } | null)?.first === true
  const { area: selected, pendingJobId, setPendingJobId, setProfileSkipped } = usePreferences()
  const me = useMe()
  const areas = useAreas()

  const worker = me.data
  const area = areas.data?.find((a) => a.id === selected?.areaId)

  if (!first) return <Navigate to="/me" replace />

  const done = () => {
    setProfileSkipped(false)
    if (first && pendingJobId && selected) {
      const id = pendingJobId
      setPendingJobId(null)
      navigate(`/jobs/${id}`, { replace: true })
    } else navigate(selected ? '/jobs' : '/location', { replace: true })
  }

  return (
    <AppShell header={<PageHeader title={t('profile.title')} onBack={first ? undefined : () => navigate(-1)} />} footer={first ? undefined : <BottomNav />}>
      {me.isPending ? (
        <div role="status" aria-busy="true" aria-label={t('common.loading')} className="h-64 animate-pulse rounded-[1.25rem] bg-surface-2" />
      ) : !worker ? (
        <ErrorState onRetry={() => void me.refetch()} retrying={me.isRefetching} />
      ) : (
        <div className="flex flex-col gap-4">
          <ProfileDetails worker={worker} area={area} />
          <p className="text-sm text-muted">{t(first ? 'profile.noteFirst' : 'profile.note')}</p>
          <Button arrow onClick={done}>
            {first ? t('profile.looksRight') : t('common.done')}
          </Button>
        </div>
      )}
    </AppShell>
  )
}
