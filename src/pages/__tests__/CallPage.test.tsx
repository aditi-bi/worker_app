import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ApiError } from '@/api/errors'
import type { Worker } from '@/api/workerTypes'
import { AuthProvider } from '@/features/auth/AuthContext'
import { getToken } from '@/features/auth/tokenStore'
import { getContact } from '@/features/applications/localStore'
import { PreferencesProvider } from '@/features/preferences/PreferencesContext'
import { STORAGE_KEYS, writeStorage } from '@/lib/storage'
import CallPage from '../CallPage'

const { checkProfile, requestCall } = vi.hoisted(() => ({ checkProfile: vi.fn(), requestCall: vi.fn() }))
vi.mock('@/api/workerEndpoints', () => ({ workerApi: { checkProfile, requestCall } }))

const worker: Worker = {
  id: 'p1', name: 'Ramesh', phoneMasked: '+91 98•••••210', sectors: ['construction'], skills: [], experienceYears: 6,
  expectedPay: { amount: 800, type: 'daily' }, homePlace: 'Bhiwandi', willingToRelocate: true, age: null, workMode: 'daily', livesOnSite: false,
}

function setup() {
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <PreferencesProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={['/talk/call']}>
              <Routes>
                <Route path="/talk/call" element={<CallPage />} />
                <Route path="/profile" element={<p>PROFILE SCREEN</p>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </PreferencesProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const fill = (phone: string, consent = true) => {
  fireEvent.change(screen.getByLabelText(/mobile number/i), { target: { value: phone } })
  if (consent) fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: /call me/i }))
}

describe('Get a call', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    writeStorage(STORAGE_KEYS.language, 'en')
    checkProfile.mockReset()
    requestCall.mockReset()
    await i18n.changeLanguage('en')
  })
  afterEach(() => vi.clearAllMocks())

  it("does not call without a valid number and the worker's agreement", () => {
    setup()
    fill('12345', false)
    expect(requestCall).not.toHaveBeenCalled()
    expect(screen.getByText(/10-digit|10 digit/i)).toBeInTheDocument()
    expect(screen.getByText(/tick the box/i)).toBeInTheDocument()
  })

  it('places the call, waits for the answers, then opens the new profile', async () => {
    checkProfile.mockResolvedValueOnce(null).mockResolvedValue({ id: 'p1', worker, filled: true })
    requestCall.mockResolvedValue({ profileId: 'p1', alreadyCalling: false })
    setup()
    fill('9876543210')
    await waitFor(() => expect(screen.getByText('PROFILE SCREEN')).toBeInTheDocument())
    expect(requestCall).toHaveBeenCalledWith('9876543210')
    expect(getToken()).toBe('p1')
    expect(getContact()).toMatchObject({ name: 'Ramesh', phone: '9876543210' })
  })

  it('skips the call when the number already has its details', async () => {
    checkProfile.mockResolvedValue({ id: 'p1', worker, filled: true })
    setup()
    fill('9876543210')
    await waitFor(() => expect(screen.getByText('PROFILE SCREEN')).toBeInTheDocument())
    expect(requestCall).not.toHaveBeenCalled()
  })

  it('says so when a call was already started, and keeps waiting', async () => {
    checkProfile.mockResolvedValue(null)
    requestCall.mockResolvedValue({ profileId: 'p1', alreadyCalling: true })
    setup()
    fill('9876543210')
    expect(await screen.findByText(/already started/i)).toBeInTheDocument()
    expect(screen.getByText(/Phala is calling/i)).toBeInTheDocument()
  })

  it('offers another try and the tapped form when the call cannot start', async () => {
    checkProfile.mockResolvedValue(null)
    requestCall.mockRejectedValue(new ApiError('server', { status: 502 }))
    setup()
    fill('9876543210')
    expect(await screen.findByText(/Could not start/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tapping/i })).toBeInTheDocument()
  })
})
