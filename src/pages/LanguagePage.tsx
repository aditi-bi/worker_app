import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Logo } from '@/components/icons/Logo'
import { Icon } from '@/components/icons/Icon'
import { LANGUAGES, type Language } from '@/i18n'
import { useAuth } from '@/features/auth/AuthContext'
import { usePreferences } from '@/features/preferences/PreferencesContext'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { OptionRow } from '@/components/ui/OptionRow'

/** Each language is always written in its own script so anyone can find theirs. */
const OPTIONS: Record<Language, { native: string; hint: string }> = {
  hi: { native: 'हिंदी', hint: 'हिंदी में बात करेंगे' },
  mr: { native: 'मराठी', hint: 'मराठीत बोलूया' },
  en: { native: 'English', hint: 'We will talk in English' },
}

export default function LanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { language, setLanguage, area, profileSkipped } = usePreferences()
  const { signedIn } = useAuth()
  // Opened from the home screen to change language -> show a back button and return there.
  const changing = Boolean(language && area)
  const [picked, setPicked] = useState<Language | null>(language ?? null)

  const choose = (next: Language) => {
    setLanguage(next)
    // First visit: location permission comes first, then Phala's questions. Anyone who already has a profile (or skipped it) carries on.
    const target = !area ? '/location' : !signedIn && !profileSkipped ? '/talk' : '/jobs'
    navigate(target, { replace: true, state: location.state })
  }

  return (
    <AppShell header={changing ? <PageHeader title={t('language.current')} onBack={() => navigate(-1)} /> : undefined}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pt-24 pb-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo variant="stacked" size={110} />
          <p className="font-semibold text-ink" lang="hi">
            काम, भरोसे से
          </p>
          <h1 className="mt-3 text-4xl font-extrabold" style={{ color: '#0f8a82' }}>
            Namaste
          </h1>
          <p className="font-bold text-ink">
            <span lang="hi">अपनी भाषा चुनो</span> · <span lang="en">Choose your language</span>
          </p>
        </div>
        <div role="radiogroup" aria-label={t('language.title')} className="flex flex-col gap-3">
          {LANGUAGES.map((code) => (
            <OptionRow key={code} lang={code} title={OPTIONS[code].native} hint={OPTIONS[code].hint} selected={picked === code} onSelect={() => setPicked(code)} />
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-3">
          <Button arrow block disabled={!picked} onClick={() => picked && choose(picked)}>
            {t('language.continue')}
          </Button>
          <p className="flex items-center gap-1.5 text-sm text-muted" lang="hi">
            <Icon name="lock" size={14} />
            आपकी जानकारी इसी फ़ोन में रहती है
          </p>
        </div>
      </div>
    </AppShell>
  )
}
