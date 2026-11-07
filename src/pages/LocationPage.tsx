import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/errors'
import { api } from '@/api/endpoints'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Hint } from '@/components/ui/Hint'
import { Orb } from '@/components/ui/Orb'
import { ReadAloudButton } from '@/components/ui/ReadAloudButton'
import { getCurrentPosition, GeolocationError } from '@/features/location/hooks/useGeolocation'
import { useAuth } from '@/features/auth/AuthContext'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { Highlighted } from '@/lib/highlight'

type Status = 'idle' | 'locating' | 'error'
type ErrorKey = 'timeout' | 'unavailable' | 'failed'

/**
 * Location permission screen. The only things we keep are the district and
 * (optionally) the taluka - never the coordinates.
 */
export default function LocationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setArea, area, profileSkipped } = usePreferences()
  const { signedIn } = useAuth()
  // At the start of the app the profile questions come next; later it goes straight back to jobs.
  const next = signedIn || profileSkipped ? '/jobs' : '/talk'
  const [status, setStatus] = useState<Status>('idle')
  const [errorKey, setErrorKey] = useState<ErrorKey>('failed')
  const abortRef = useRef<AbortController | null>(null)

  const goManual = (notice?: 'denied' | 'notCovered') => navigate('/location/area', { state: { notice } })

  const share = async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setStatus('locating')
    try {
      const coords = await getCurrentPosition()
      const result = await api.resolveArea(coords, controller.signal)
      setArea({ areaId: result.area.id, talukaId: result.talukaId, source: 'gps' })
      navigate(next, { replace: true })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      if (error instanceof GeolocationError) {
        if (error.reason === 'denied') return goManual('denied')
        setErrorKey(error.reason)
      } else if (error instanceof ApiError && error.kind === 'not_found') {
        return goManual('notCovered')
      } else {
        setErrorKey('failed')
      }
      setStatus('error')
    }
  }

  const locating = status === 'locating'
  const title = t('location.title')

  return (
    <AppShell header={area ? <PageHeader title={t('location.headerTitle')} onBack={() => navigate(-1)} /> : undefined}>
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center">
        <Orb size={150}>
          <Icon name="pin" size={72} strokeWidth={2.2} />
        </Orb>
        <h1 className="mt-3 text-4xl leading-tight font-extrabold">
          <Highlighted text={title} />
        </h1>
        <p className="max-w-sm text-lg text-ink/80">{t('location.body')}</p>
        <ReadAloudButton text={`${title.replace(/\*/g, '')}. ${t('location.speech')}`} />

        {status === 'error' && <Hint role="alert">{t(`location.${errorKey}`)}</Hint>}
        {locating && (
          <p role="status" className="font-bold">
            {t('location.locating')}
          </p>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button arrow onClick={() => void share()} loading={locating}>
            {status === 'error' ? t('common.retry') : t('location.share')}
          </Button>
          <Button variant="secondary" onClick={() => goManual()} disabled={locating}>
            {t('location.manual')}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
