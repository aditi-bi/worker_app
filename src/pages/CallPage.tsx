import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/errors'
import { PHONE_PATTERN } from '@/api/workerTypes'
import { workerApi, type ProfileCheck } from '@/api/workerEndpoints'
import { Icon } from '@/components/icons/Icon'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Hint } from '@/components/ui/Hint'
import { Orb } from '@/components/ui/Orb'
import { Spinner } from '@/components/ui/Spinner'
import { TextField } from '@/components/ui/TextField'
import { setContact } from '@/features/applications/localStore'
import { useAuth } from '@/features/auth/AuthContext'
import { ConsentField } from '@/features/profile/components/ConsentField'
import { waitForProfile } from '@/features/profile/waitForProfile'
import { formatPhone } from '@/features/talk/parse'
import { Highlighted } from '@/lib/highlight'

/** Look every 5 seconds for up to 6 minutes; a short call plus processing is usually done well before that. */
const CHECK_EVERY_MS = 5_000
const GIVE_UP_AFTER_MS = 6 * 60_000

type Phase = 'form' | 'starting' | 'waiting' | 'timeout' | 'error'

/** The worker gets a call from Phala instead of filling the form. Phala asks the questions; the profile appears here when the call ends. */
export default function CallPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [phase, setPhase] = useState<Phase>('form')
  const [already, setAlready] = useState(false)
  const [notYet, setNotYet] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const control = useRef<AbortController | null>(null)

  useEffect(() => () => control.current?.abort(), [])

  const fresh = () => {
    control.current?.abort()
    control.current = new AbortController()
    return control.current.signal
  }

  const finish = (found: ProfileCheck) => {
    control.current?.abort()
    setContact({ name: found.worker.name, phone })
    signIn(found.id)
    navigate('/profile', { replace: true, state: { first: true } })
  }

  const wait = async () => {
    const signal = fresh()
    setPhase('waiting')
    const found = await waitForProfile({
      check: async (s) => {
        const result = await workerApi.checkProfile(phone, s)
        return result?.filled ? result : null
      },
      intervalMs: CHECK_EVERY_MS,
      timeoutMs: GIVE_UP_AFTER_MS,
      signal,
    })
    if (signal.aborted) return
    if (found) finish(found)
    else setPhase('timeout')
  }

  const startCall = async () => {
    setError(null)
    setNotYet(false)
    setPhase('starting')
    const signal = fresh()
    try {
      // A profile that already has its details needs no call.
      const existing = await workerApi.checkProfile(phone, signal)
      if (existing?.filled) return finish(existing)
      const { alreadyCalling } = await workerApi.requestCall(phone)
      if (signal.aborted) return
      setAlready(alreadyCalling)
      await wait()
    } catch (cause) {
      if (signal.aborted) return
      setError(cause)
      setPhase('error')
    }
  }

  const submit = () => {
    const valid = PHONE_PATTERN.test(phone)
    setPhoneError(!valid)
    setConsentError(!consent)
    if (valid && consent) void startCall()
  }

  const checkNow = async () => {
    setChecking(true)
    setNotYet(false)
    try {
      const result = await workerApi.checkProfile(phone)
      if (result?.filled) return finish(result)
      setNotYet(true)
    } catch {
      setNotYet(true)
    } finally {
      setChecking(false)
    }
  }

  const changeNumber = () => {
    control.current?.abort()
    setPhase('form')
  }

  const reason = error instanceof ApiError ? [error.kind, error.status].filter(Boolean).join(' ') : ''
  const tapInstead = (
    <Button variant="secondary" onClick={() => navigate('/talk/tap')}>
      {t('talk.tap')}
    </Button>
  )

  return (
    <AppShell header={<PageHeader title={t('call.title')} onBack={() => navigate('/talk')} />}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4">
        {phase === 'form' && (
          <form
            noValidate
            className="flex flex-1 flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <h1 className="text-2xl leading-tight font-extrabold">
              <Highlighted text={t('call.heading')} />
            </h1>
            <p className="text-muted">{t('call.body')}</p>
            <TextField
              label={t('tap.phoneLabel')}
              prefix="+91"
              big
              autoFocus
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              error={phoneError ? t('tap.phoneInvalid') : undefined}
            />
            <ConsentField textKey="call.consent" checked={consent} onChange={setConsent} error={consentError} />
            <div className="mt-auto flex flex-col gap-3">
              <Button type="submit" block arrow icon={<Icon name="phone" size={22} />}>
                {t('call.button')}
              </Button>
              {tapInstead}
            </div>
          </form>
        )}

        {phase === 'starting' && (
          <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Spinner size={40} />
            <p className="text-lg font-bold">{t('call.starting')}</p>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="flex flex-1 flex-col justify-center gap-4 text-center">
            <Orb size={110}>
              <Icon name="phone" size={46} />
            </Orb>
            <h1 className="mt-5 text-2xl leading-tight font-extrabold" aria-live="polite">
              <Highlighted text={t('call.calling', { phone: formatPhone(phone) })} />
            </h1>
            <p className="text-muted">{t('call.callingBody')}</p>
            {already && <Hint>{t('call.already')}</Hint>}
            {notYet && (
              <p role="status" className="text-sm font-semibold text-muted">
                {t('call.notYet')}
              </p>
            )}
            <div className="mt-2 flex flex-col gap-3">
              <Button variant="secondary" loading={checking} onClick={() => void checkNow()}>
                {t('call.checkNow')}
              </Button>
              {tapInstead}
              <button type="button" onClick={changeNumber} className="min-h-12 font-bold underline underline-offset-4">
                {t('call.changeNumber')}
              </button>
            </div>
          </div>
        )}

        {phase === 'timeout' && (
          <div className="flex flex-1 flex-col justify-center gap-4 text-center">
            <h1 className="text-2xl leading-tight font-extrabold">
              <Highlighted text={t('call.timeoutTitle')} />
            </h1>
            <p className="text-muted">{t('call.timeoutBody')}</p>
            <div className="mt-2 flex flex-col gap-3">
              <Button loading={checking} onClick={() => void checkNow()}>
                {t('call.checkNow')}
              </Button>
              <Button variant="secondary" onClick={() => void startCall()}>
                {t('call.again')}
              </Button>
              {tapInstead}
            </div>
            {notYet && (
              <p role="status" className="text-sm font-semibold text-muted">
                {t('call.notYet')}
              </p>
            )}
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-1 flex-col justify-center gap-4 text-center">
            <h1 className="text-2xl leading-tight font-extrabold">
              <Highlighted text={t('call.failedTitle')} />
            </h1>
            <p className="text-muted">{t('call.failedBody')}</p>
            {reason && <p className="text-xs text-muted">{reason}</p>}
            <div className="mt-2 flex flex-col gap-3">
              <Button onClick={() => void startCall()}>{t('common.retry')}</Button>
              {tapInstead}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
