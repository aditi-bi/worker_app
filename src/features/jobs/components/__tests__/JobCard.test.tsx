import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { PreferencesProvider } from '@/features/preferences/PreferencesContext'
import { AREAS } from '@/mocks/fixtures/areas'
import { GUEST_JOBS } from '@/mocks/fixtures/jobs'
import { JobCard } from '../JobCard'

function setup(onOpen = vi.fn(), override: Partial<(typeof GUEST_JOBS)[number]> = {}) {
  const job = { ...GUEST_JOBS[0], ...override }
  render(
    <I18nextProvider i18n={i18n}>
      <PreferencesProvider>
        <JobCard job={job} area={AREAS.find((a) => a.id === job.areaId)} onOpen={onOpen} />
      </PreferencesProvider>
    </I18nextProvider>,
  )
  return { job, onOpen }
}

describe('JobCard (guest view)', () => {
  it('shows title, place and wage, with Full details and I want this job', () => {
    const { job, onOpen } = setup()
    expect(screen.getByText(job.title.hi)).toBeInTheDocument()
    expect(screen.getByText(/₹850–₹950/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /यह काम चाहिए/ }))
    expect(onOpen).toHaveBeenCalledWith(job)
    fireEvent.click(screen.getByRole('button', { name: /पूरी जानकारी/ }))
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('never shows ratings, reviews or payment promises', () => {
    setup()
    expect(document.body.textContent).not.toMatch(/★|rating|review|guarantee|रेटिंग|गारंटी/i)
  })

  it('shows no posting time (and no "Invalid Date") when the source has no date', () => {
    setup(vi.fn(), { postedAt: null })
    expect(document.body.textContent).not.toMatch(/Invalid|NaN|undefined|null/)
    expect(document.body.textContent).not.toMatch(/पोस्ट|Posted/)
  })
})
