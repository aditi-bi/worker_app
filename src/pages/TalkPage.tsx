import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Orb } from '@/components/ui/Orb'
import { ProgressBars } from '@/components/ui/ProgressBars'
import { Tag } from '@/components/ui/Tag'
import { TextField } from '@/components/ui/TextField'
import { pick } from '@/lib/localized'
import { useLanguage } from '@/features/preferences/PreferencesContext'
import { ConsentField } from '@/features/profile/components/ConsentField'
import { ExperienceChips } from '@/features/profile/components/ExperienceChips'
import { SaveError } from '@/features/profile/components/SaveError'
import { useRegister } from '@/features/profile/useProfile'
import { useSectors } from '@/features/reference/useReferenceData'
import { type Answer, type AnswerStep, type Ctx, type Draft, STEPS, applyAnswer, describe, interpret } from '@/features/talk/answers'
import { parsePhone } from '@/features/talk/parse'
import { type ListenError, useSpeechRecognition } from '@/features/talk/useSpeechRecognition'
import { useSpeak } from '@/hooks/useSpeak'
import { Highlighted } from '@/lib/highlight'
import { cn } from '@/lib/cn'

/** How long the "I heard" card stays before Phala moves on by itself (no voice on the phone). */
const ADVANCE_MS = 2200
/** Pause after Phala has read the answer back, so the worker can still tap Change. */
const AFTER_READBACK_MS = 600
const MAX_TRIES = 2

type Phase = 'asking' | 'listening' | 'heard' | 'idle'
type Failure = ListenError | 'unclear' | 'unsupported'
interface Heard {
  answer: Answer
  label: string
}

function Bubble({ from, children }: { from: 'phala' | 'worker'; children: React.ReactNode }) {
  return (
    <div className={cn('flex items-start gap-2', from === 'worker' && 'justify-end')}>
      {from === 'phala' && (
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-night text-accent">
          <Icon name="mic" size={18} />
        </span>
      )}
      <p className={cn('max-w-[85%] px-4 py-3 text-lg font-bold', from === 'phala' ? 'rounded-[1.25rem_1.25rem_1.25rem_0.4rem] bg-surface text-ink' : 'rounded-[1.25rem_1.25rem_0.4rem_1.25rem] bg-accent text-accent-ink')}>{children}</p>
    </div>
  )
}

/**
 * Hands-free conversation. Phala asks (spoken and written) -> the phone starts listening by itself
 * -> the answer is read back quickly and Phala moves to the next question. The only controls are
 * "Change" (to say it again), the mic button (if the worker was silent) and the tapped form.
 * Nothing is a dead end: anything that cannot be heard falls back to the tapped form.
 * The mobile number comes last: said or typed, with a consent tick and a Finish button.
 */
export default function TalkPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const sectors = useSectors()
  const register = useRegister()
  const { speak, stop: stopVoice, speaking, supported: voiceSupported, preload } = useSpeak(language)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [draft, setDraft] = useState<Draft>({})
  const [done, setDone] = useState<{ step: AnswerStep; label: string }[]>([])
  const [heard, setHeard] = useState<Heard | null>(null)
  const [tries, setTries] = useState(0)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState(false)
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const step = STEPS[index]
  const sectorData = sectors.data
  const sectorList = useMemo(() => sectorData ?? [], [sectorData])
  const ctx: Ctx = useMemo(() => ({ sectors: sectorList, language, t }), [sectorList, language, t])
  const question = t(`talk.ask_${step}`)

  const hear = useCallback(
    (answer: Answer) => {
      setHeard({ answer, label: describe(answer, ctx) })
      setTries(0)
      setPhase('heard')
    },
    [ctx],
  )

  const retry = useCallback(
    (kind: 'unclear' | 'no_speech') => {
      const next = tries + 1
      setTries(next)
      if (next >= MAX_TRIES) {
        if (kind === 'unclear' && STEPS[index] !== 'mobile') return setFailure('unclear')
        return setPhase('idle')
      }
      setPhase('asking') // "Sorry, say that again", then it listens again by itself
    },
    [tries, index],
  )

  const onResult = useCallback(
    (text: string) => {
      if (step === 'mobile') {
        const parsed = parsePhone(text)
        if (!parsed) return retry('unclear')
        setPhone(parsed)
        setPhoneError(false)
        setTries(0)
        setPhase('idle')
        // Read the digits back so the worker can check them.
        return speak(parsed.split('').join(' '), { rate: 0.8 })
      }
      const answer = interpret(step, text, ctx)
      return answer ? hear(answer) : retry('unclear')
    },
    [step, ctx, hear, retry, speak],
  )

  const onError = useCallback(
    (error: ListenError) => (error === 'no_speech' ? retry('no_speech') : setFailure(error)),
    [retry],
  )

  const { supported, listening, thinking, interim, start: startListening, stop: stopListening } = useSpeechRecognition({ language, onResult, onError })

  // 1. Phala asks, then 2. the phone listens by itself.
  useEffect(() => {
    if (phase !== 'asking' || failure) return
    speak(tries > 0 ? t('talk.sayAgain') : question, { onEnd: () => setPhase('listening') })
    return stopVoice
  }, [phase, index, tries, failure, question, speak, stopVoice, t])

  useEffect(() => {
    if (phase !== 'listening' || failure || !supported) return
    startListening()
    return stopListening
  }, [phase, index, failure, supported, startListening, stopListening])

  // While the worker answers, the next question's voice is fetched so it plays without a pause.
  useEffect(() => {
    const next = STEPS[index + 1]
    if (next) preload(t(`talk.ask_${next}`))
    preload(t('talk.sayAgain'))
  }, [index, preload, t])

  // 3. Phala reads the answer back quickly and moves on by itself. "Change" cancels this.
  const commit = useCallback(() => {
    if (!heard) return
    setDraft((d) => applyAnswer(d, heard.answer))
    setDone((list) => [...list, { step: heard.answer.step, label: heard.label }])
    setHeard(null)
    setTries(0)
    setIndex((i) => i + 1)
    setPhase('asking')
  }, [heard])

  useEffect(() => {
    if (phase !== 'heard' || !heard) return
    let after: ReturnType<typeof setTimeout> | undefined
    const fallback = setTimeout(commit, voiceSupported ? 7000 : ADVANCE_MS)
    speak(heard.label, {
      rate: 1.2,
      onEnd: () => {
        clearTimeout(fallback)
        after = setTimeout(commit, AFTER_READBACK_MS)
      },
    })
    return () => {
      clearTimeout(fallback)
      clearTimeout(after)
      stopVoice()
    }
  }, [phase, heard, commit, speak, stopVoice, voiceSupported])

  const change = () => {
    stopVoice()
    setHeard(null)
    setTries(0)
    setPhase('listening')
  }

  const tapAnswer = (answer: Answer) => {
    stopVoice()
    stopListening()
    hear(answer)
  }

  const tapMic = () => {
    if (listening || thinking) {
      stopListening()
      return setPhase('idle')
    }
    stopVoice()
    setTries(0)
    setPhase('listening')
  }

  const tryAgain = () => {
    setFailure(null)
    setTries(0)
    setPhase('asking')
  }

  const back = () => {
    if (failure) return tryAgain()
    stopVoice()
    stopListening()
    if (heard) return change()
    if (index === 0) return navigate('/talk')
    const previous = done[done.length - 1]
    if (previous && index <= done.length) setDone((list) => list.slice(0, -1))
    setIndex(index - 1)
    setTries(0)
    setPhase('asking')
  }

  const finish = () => {
    const parsed = parsePhone(phone)
    setPhoneError(!parsed)
    setConsentError(!consent)
    const { name, work, experience, pay, home, relocate, workMode, stay } = draft
    if (!parsed || !consent || !name || !work || experience === undefined || !pay || !home || relocate === undefined || !workMode || stay === undefined) return
    register.mutate(
      {
        name,
        sectors: work,
        experienceYears: experience,
        expectedPay: pay,
        homePlace: home,
        willingToRelocate: relocate,
        age: draft.age ?? null,
        workMode,
        livesOnSite: stay,
        phone: parsed,
        consent: true,
        language,
      },
      { onSuccess: () => navigate('/profile', { replace: true, state: { first: true } }) },
    )
  }

  const shownFailure: Failure | null = failure ?? (!supported ? 'unsupported' : null)

  if (shownFailure) {
    return (
      <AppShell header={<PageHeader title={t('talk.title')} onBack={back} />}>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 text-center">
          <Orb size={110}>
            <Icon name="mic" size={46} />
          </Orb>
          <h1 className="mt-5 text-2xl leading-tight font-extrabold">
            <Highlighted text={t('talk.failTitle')} />
          </h1>
          <p className="text-muted">{t(`talk.fail_${shownFailure}`)}</p>
          {shownFailure !== 'unsupported' && (
            <Button arrow onClick={tryAgain} icon={<Icon name="mic" size={22} />}>
              {t('talk.tryAgain')}
            </Button>
          )}
          <Button variant={shownFailure === 'unsupported' ? 'primary' : 'secondary'} onClick={() => navigate('/talk/tap')}>
            {t('talk.tap')}
          </Button>
        </div>
      </AppShell>
    )
  }

  const status = thinking ? (
    <Tag className="self-center bg-accent-soft text-ink">{t('talk.thinking')}</Tag>
  ) : listening ? (
    <Tag className="self-center bg-[#ffd9d3] text-[#8a1f12]">{t('talk.listening')}</Tag>
  ) : speaking ? (
    <Tag tone="dark" className="self-center">
      <Icon name="speaker" size={13} />
      {t('talk.speaking')}
    </Tag>
  ) : null

  const yesNo = (make: (v: boolean) => Answer) => (
    <div className="flex gap-2">
      <Chip className="flex-1 justify-center text-lg" onClick={() => tapAnswer(make(true))}>
        {t('tap.yes')}
      </Chip>
      <Chip className="flex-1 justify-center text-lg" onClick={() => tapAnswer(make(false))}>
        {t('tap.no')}
      </Chip>
    </div>
  )

  return (
    <AppShell header={<PageHeader title={t('talk.title')} onBack={back} />}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3">
        <ProgressBars total={STEPS.length} current={index + 1} />
        <p className="sr-only" aria-live="polite">
          {t('tap.step', { current: index + 1, total: STEPS.length })}
        </p>
        <div className="flex flex-col items-center gap-2 py-1">
          <Orb size={84}>
            <Icon name={speaking ? 'speaker' : 'mic'} size={36} />
          </Orb>
          <div className="mt-3 min-h-6">{status}</div>
        </div>

        {done.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t('talk.answered')}>
            {done.map((d) => (
              <li key={d.step} className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-ink">
                {d.label}
              </li>
            ))}
          </ul>
        )}

        <Bubble from="phala">{question}</Bubble>
        {listening && interim && <Bubble from="worker">{interim}</Bubble>}

        {heard ? (
          <div className="flex flex-col gap-2 rounded-[1.25rem] border-2 border-ink bg-accent-soft p-4" aria-live="polite">
            <span className="text-sm font-bold text-muted">{t('talk.iHeard')}</span>
            <b className="text-2xl leading-tight">{heard.label}</b>
            <span aria-hidden="true" className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/70">
              <i className="phala-fill block h-full rounded-full bg-ink" style={{ animationDuration: `${ADVANCE_MS}ms` }} />
            </span>
            <Button variant="secondary" block onClick={change}>
              {t('talk.change')}
            </Button>
          </div>
        ) : (
          <>
            {step === 'work' && (
              <div className="flex flex-wrap gap-2">
                {sectorList.map((s) => (
                  <Chip key={s.id} className="min-h-14 px-5 text-lg" onClick={() => tapAnswer({ step: 'work', value: [s.id] })}>
                    {pick(s.name, language)}
                  </Chip>
                ))}
              </div>
            )}
            {step === 'experience' && <ExperienceChips value={undefined} onChange={(years) => tapAnswer({ step: 'experience', value: years })} />}
            {step === 'relocate' && yesNo((value) => ({ step: 'relocate', value }))}
            {step === 'stay' && yesNo((value) => ({ step: 'stay', value }))}
            {step === 'workMode' && (
              <div className="flex flex-wrap gap-2">
                {(['daily', 'contract', 'permanent'] as const).map((m) => (
                  <Chip key={m} className="min-h-14 px-5 text-lg" onClick={() => tapAnswer({ step: 'workMode', value: m })}>
                    {t(`profile.mode_${m}`)}
                  </Chip>
                ))}
              </div>
            )}
            {step === 'age' && (
              <Chip className="self-start" onClick={() => tapAnswer({ step: 'age', value: null })}>
                {t('talk.ageSkip')}
              </Chip>
            )}
          </>
        )}

        {step === 'mobile' && (
          <div className="flex flex-col gap-3">
            <TextField
              label={t('tap.phoneLabel')}
              prefix="+91"
              big
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={13}
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/[^\d\s]/g, ''))
                setPhoneError(false)
              }}
              error={phoneError ? t('tap.phoneInvalid') : tries > 0 && !phone ? t('talk.fail_unclear') : undefined}
            />
            <ConsentField checked={consent} onChange={(v) => { setConsent(v); setConsentError(false) }} error={consentError} />
            {register.isError && <SaveError error={register.error} />}
          </div>
        )}

        <div className="mt-auto flex flex-col items-center gap-3 pt-3">
          {step === 'mobile' && (
            <Button arrow block loading={register.isPending} onClick={finish}>
              {t('common.finish')}
            </Button>
          )}
          {!heard && (
            <>
              <button
                type="button"
                onClick={tapMic}
                aria-label={listening ? t('talk.stopMic') : t('talk.tapMic')}
                className={cn(
                  'flex size-[4.75rem] items-center justify-center rounded-full border-4 border-ink bg-night text-accent transition active:scale-95',
                  listening && 'shadow-[0_0_0_10px_rgb(63_227_210/0.35)]',
                  phase === 'idle' && 'animate-pulse',
                )}
              >
                <Icon name={listening ? 'stop' : 'mic'} size={32} />
              </button>
              <span className="text-sm font-bold">{listening ? t('talk.listening') : t('talk.tapMic')}</span>
              <button type="button" onClick={() => navigate('/talk/tap')} className="min-h-11 font-bold underline underline-offset-4">
                {t('talk.typeInstead')}
              </button>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
