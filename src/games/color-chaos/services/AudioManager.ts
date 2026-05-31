/**
 * AudioManager - procedural sound effects using Web Audio API.
 * No external audio files needed - all sounds are generated programmatically.
 */
export class AudioManager {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _muted: boolean = false
  private _volume: number = 0.5

  /**
   * Initialize the audio context.
   * Must be called after a user gesture (click/tap) due to browser autoplay policy.
   */
  init(): void {
    if (this.context) return

    try {
      this.context = new AudioContext()
      this.masterGain = this.context.createGain()
      this.masterGain.gain.value = this._volume
      this.masterGain.connect(this.context.destination)
    } catch {
      this.context = null
    }
  }

  /**
   * Resume the audio context if it was suspended.
   */
  resume(): void {
    if (this.context?.state === 'suspended') {
      this.context.resume()
    }
  }

  /**
   * Check if audio is available.
   */
  isAvailable(): boolean {
    return this.context !== null && this.masterGain !== null
  }

  get muted(): boolean {
    return this._muted
  }

  set muted(value: boolean) {
    this._muted = value
    if (this.masterGain) {
      this.masterGain.gain.value = value ? 0 : this._volume
    }
  }

  get volume(): number {
    return this._volume
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value))
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this._volume
    }
  }

  /**
   * Play a pour sound - short rising tone (100ms).
   */
  playPour(): void {
    if (!this.isAvailable() || this._muted) return
    const ctx = this.context!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Play a click/tap sound (50ms).
   */
  playClick(): void {
    if (!this.isAvailable() || this._muted) return
    const ctx = this.context!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.05)
  }

  /**
   * Play a win sound - cheerful ascending notes (500ms).
   */
  playWin(): void {
    if (!this.isAvailable() || this._muted) return
    const ctx = this.context!
    const now = ctx.currentTime

    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    const noteDuration = 0.12

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      const startTime = now + i * noteDuration
      osc.frequency.setValueAtTime(freq, startTime)

      gain.gain.setValueAtTime(0.3, startTime)
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration + 0.05)

      osc.connect(gain)
      gain.connect(this.masterGain!)

      osc.start(startTime)
      osc.stop(startTime + noteDuration + 0.05)
    })
  }

  /**
   * Play an undo sound - soft descending tone (100ms).
   */
  playUndo(): void {
    if (!this.isAvailable() || this._muted) return
    const ctx = this.context!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.12)
  }

  /**
   * Play a settle/wobble sound (for when liquid lands).
   */
  playSettle(): void {
    if (!this.isAvailable() || this._muted) return
    const ctx = this.context!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(250, now)
    osc.frequency.setValueAtTime(350, now + 0.03)
    osc.frequency.setValueAtTime(250, now + 0.06)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.08)
  }

  /**
   * Play an error sound (invalid move).
   */
  playError(): void {
    if (!this.isAvailable() || this._muted) return
    const ctx = this.context!
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.setValueAtTime(150, now + 0.08)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    osc.connect(gain)
    gain.connect(this.masterGain!)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  /**
   * Destroy and clean up audio resources.
   */
  destroy(): void {
    if (this.context) {
      this.context.close()
      this.context = null
      this.masterGain = null
    }
  }
}
