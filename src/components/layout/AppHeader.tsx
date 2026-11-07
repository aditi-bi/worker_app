import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { Logo } from '@/components/icons/Logo'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ListRow } from '@/components/ui/ListRow'
import { useAuth } from '@/features/auth/AuthContext'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { useMe } from '@/features/profile/useProfile'

const LANGUAGE_NAME = { hi: 'हिंदी', mr: 'मराठी', en: 'English' } as const

/**
 * Top of the main screens: the Phala logo on the left, the profile button on the right.
 * With a profile the button opens the My profile page (details, help, language, rates).
 * A guest (profile skipped) has no profile page, so the button opens a small menu instead.
 */
export function AppHeader({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const { signedIn } = useAuth()
  const me = useMe()
  const [guestMenu, setGuestMenu] = useState(false)
  const initial = Array.from(me.data?.name ?? '')[0]?.toUpperCase()

  return (
    <>
      <header className="sticky top-0 z-30 bg-bg px-4 pt-3 pb-1 md:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => (signedIn ? navigate('/me') : setGuestMenu(true))}
            aria-label={t('menu.open')}
            className="flex size-12 items-center justify-center rounded-full bg-night text-lg font-extrabold text-accent transition active:scale-95"
          >
            {initial ? <span aria-hidden="true">{initial}</span> : <Icon name="user" size={24} />}
          </button>
        </div>
        {children}
      </header>
      {!signedIn && (
        <BottomSheet open={guestMenu} title={t('menu.title')} onClose={() => setGuestMenu(false)}>
          <div className="flex flex-col gap-2">
            <ListRow icon="mic" to="/talk">
              {t('menu.makeProfile')}
            </ListRow>
            <ListRow icon="globe" to="/language" value={LANGUAGE_NAME[language]}>
              {t('me.language')}
            </ListRow>
            <ListRow icon="rupee" to="/rates">
              {t('nav.rates')}
            </ListRow>
            <ListRow icon="help" to="/help">
              {t('nav.help')}
            </ListRow>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
