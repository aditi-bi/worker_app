import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components/icons/Icon'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Highlighted } from '@/lib/highlight'

interface Props {
  open: boolean
  onClose: () => void
}

/** Shown when a worker without a profile taps Full details, I want this job, or Applied. Nothing is lost: they come back to the job. */
export function NeedProfileSheet({ open, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <BottomSheet open={open} title={t('needProfile.title')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-muted">
          <Highlighted text={t('needProfile.body')} />
        </p>
        <Button arrow icon={<Icon name="mic" size={22} />} onClick={() => navigate('/talk/voice')}>
          {t('talk.start')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/talk/tap')}>
          {t('talk.tap')}
        </Button>
        <Button variant="secondary" icon={<Icon name="phone" size={22} />} onClick={() => navigate('/talk/call')}>
          {t('call.option')}
        </Button>
      </div>
    </BottomSheet>
  )
}
