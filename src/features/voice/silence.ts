/**
 * Decides when the worker has finished speaking, from the loudness of the microphone (one reading per interval).
 * It learns the room's background level first, so a noisy site does not keep the recording open for ever.
 */
export interface SilenceOptions {
  /** Time between readings. */
  intervalMs: number
  /** Time at the start used to learn the background noise. */
  calibrateMs: number
  /** Loud time needed before it counts as speech. */
  minSpeechMs: number
  /** Quiet time after speech that ends the recording. */
  endSilenceMs: number
  /** Give up when nothing was said for this long. */
  noSpeechMs: number
  /** Never record longer than this. */
  maxMs: number
  /** Lowest loudness that can count as speech (0 to 1). */
  floor: number
  /** How much louder than the background counts as speech. */
  factor: number
}

export const DEFAULT_SILENCE: SilenceOptions = {
  intervalMs: 100,
  calibrateMs: 300,
  minSpeechMs: 200,
  endSilenceMs: 1300,
  noSpeechMs: 7000,
  maxMs: 15000,
  floor: 0.02,
  factor: 2.5,
}

export type Verdict = 'wait' | 'stop' | 'no_speech'

export function createSilenceDetector(overrides: Partial<SilenceOptions> = {}) {
  const o = { ...DEFAULT_SILENCE, ...overrides }
  let elapsed = 0
  let noise = Infinity
  let loudMs = 0
  let quietMs = 0
  let heard = false

  return {
    /** Feed one loudness reading (0 to 1). */
    feed(rms: number): Verdict {
      elapsed += o.intervalMs
      if (elapsed <= o.calibrateMs) {
        noise = Math.min(noise, rms) // the quietest moment is the room, even if the worker already started
        return 'wait'
      }
      const threshold = Math.max(o.floor, (Number.isFinite(noise) ? noise : 0) * o.factor)
      if (rms > threshold) {
        loudMs += o.intervalMs
        quietMs = 0
        if (loudMs >= o.minSpeechMs) heard = true
      } else {
        if (!heard) loudMs = 0
        else quietMs += o.intervalMs
      }
      if (heard && quietMs >= o.endSilenceMs) return 'stop'
      if (elapsed >= o.maxMs) return heard ? 'stop' : 'no_speech'
      if (!heard && elapsed >= o.noSpeechMs) return 'no_speech'
      return 'wait'
    },
    get heardSpeech(): boolean {
      return heard
    },
  }
}
