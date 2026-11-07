import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitForProfile } from '../waitForProfile'

describe('waitForProfile', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns as soon as the answers have arrived', async () => {
    const check = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce('profile')
    const result = waitForProfile({ check, intervalMs: 5000, timeoutMs: 60_000, signal: new AbortController().signal })
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(result).resolves.toBe('profile')
    expect(check).toHaveBeenCalledTimes(3)
  })

  it('keeps waiting through a failed look, and gives up after the time limit', async () => {
    const check = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(null)
    const result = waitForProfile({ check, intervalMs: 5000, timeoutMs: 20_000, signal: new AbortController().signal })
    await vi.advanceTimersByTimeAsync(25_000)
    await expect(result).resolves.toBeNull()
    expect(check.mock.calls.length).toBeGreaterThanOrEqual(4)
  })

  it('stops when the worker leaves the screen', async () => {
    const controller = new AbortController()
    const check = vi.fn().mockResolvedValue(null)
    const result = waitForProfile({ check, intervalMs: 5000, timeoutMs: 600_000, signal: controller.signal })
    await vi.advanceTimersByTimeAsync(6000)
    controller.abort()
    await expect(result).resolves.toBeNull()
    const calls = check.mock.calls.length
    await vi.advanceTimersByTimeAsync(60_000)
    expect(check).toHaveBeenCalledTimes(calls)
  })
})
