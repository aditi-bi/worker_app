import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <AppShell>
      <div className="my-auto">
        <EmptyState icon="alert" title={t('notFound.title')} body={t('notFound.body')}>
          <Button onClick={() => navigate('/', { replace: true })}>{t('notFound.home')}</Button>
        </EmptyState>
      </div>
    </AppShell>
  )
}
