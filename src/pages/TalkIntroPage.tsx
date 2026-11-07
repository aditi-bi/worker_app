import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/icons/Icon'
import { Button } from '@/components/ui/Button'
import { Orb } from '@/components/ui/Orb'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { Highlighted } from '@/lib/highlight'

/** Right after language: Phala asks a few questions by voice. Tapping, or skipping to browse, is always available. */
export default function TalkIntroPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { area, setProfileSkipped } = usePreferences()

  const skip = () => {
    setProfileSkipped(true)
    navigate(area ? '/jobs' : '/location', { replace: true })
  }

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 py-4 text-center">
        <Orb size={120}>
          <Icon name="mic" size={50} />
        </Orb>
        <h1 className="mt-5 text-3xl leading-tight font-extrabold">
          <Highlighted text={t('talk.introTitle')} />
        </h1>
        <p className="text-lg text-muted">{t('talk.introBody')}</p>
        <div className="mt-2 flex flex-col gap-3">
          <Button arrow onClick={() => navigate('/talk/voice')} icon={<Icon name="mic" size={22} />}>
            {t('talk.start')}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/talk/tap')}>
            {t('talk.tap')}
          </Button>
          <Button variant="secondary" icon={<Icon name="phone" size={22} />} onClick={() => navigate('/talk/call')}>
            {t('call.option')}
          </Button>
          <button type="button" onClick={skip} className="min-h-12 font-bold underline underline-offset-4">
            {t('talk.skip')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
