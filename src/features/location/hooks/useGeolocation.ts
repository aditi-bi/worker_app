import type { Coordinates } from '@/lib/geo'

export type GeolocationFailure = 'denied' | 'timeout' | 'unavailable'

export class GeolocationError extends Error {
  readonly reason: GeolocationFailure
  constructor(reason: GeolocationFailure) {
    super(reason)
    this.name = 'GeolocationError'
    this.reason = reason
  }
}

/** Ask the browser for the current position, with a plain failure reason we can show in the worker's language. */
export function getCurrentPosition(timeoutMs = 12000, fresh = false): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeolocationError('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new GeolocationError('denied'))
        else if (err.code === err.TIMEOUT) reject(new GeolocationError('timeout'))
        else reject(new GeolocationError('unavailable'))
      },
      // Finding a district needs only a rough, cached position. A live position (when applying) is read fresh.
      fresh ? { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 } : { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    )
  })
}
