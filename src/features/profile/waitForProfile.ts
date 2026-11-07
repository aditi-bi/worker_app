export interface WaitOptions<T> {
  /** One look at the server. Returns the result once it is ready, or null while the call is still going. */
  check: (signal: AbortSignal) => Promise<T | null>
  intervalMs: number
  timeoutMs: number
  signal: AbortSignal
}

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(done, ms)
    function done() {
      clearTimeout(timer)
      signal.removeEventListener('abort', done)
      resolve()
    }
    signal.addEventListener('abort', done)
  })

/**
 * Looks again and again until the result is ready or time runs out. A failed look (bad signal, server hiccup) does not stop
 * the wait: the worker is on a phone call and the answers may arrive a minute later. Returns null on timeout or when stopped.
 */
export async function waitForProfile<T>({ check, intervalMs, timeoutMs, signal }: WaitOptions<T>): Promise<T | null> {
  const started = Date.now()
  while (!signal.aborted) {
    try {
      const result = await check(signal)
      if (result) return result
    } catch {
      /* keep waiting; the next look may work */
    }
    if (Date.now() - started >= timeoutMs) return null
    await sleep(intervalMs, signal)
  }
  return null
}
