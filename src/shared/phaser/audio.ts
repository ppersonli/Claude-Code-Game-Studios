type SoundType = 'add' | 'perfect' | 'fail' | 'levelup' | 'tick' | 'full' | 'unlock'

class AudioEngineClass {
  private ctx: AudioContext | null = null
  private _muted = false
  private _resumeListenerAdded = false

  // BGM state
  private bgmOscillators: OscillatorNode[] = []
  private bgmGains: GainNode[] = []
  private bgmMasterGain: GainNode | null = null
  private bgmLfo: OscillatorNode | null = null
  private bgmPlaying = false

  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    // iOS Safari requires a user gesture to resume suspended AudioContext
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    // Ensure future user gestures can resume the context
    if (!this._resumeListenerAdded) {
      this._resumeListenerAdded = true
      document.addEventListener('touchend', () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume()
        }
      }, { once: false })
    }
  }

  get initialized(): boolean {
    return this.ctx !== null
  }

  get muted(): boolean {
    return this._muted
  }

  set muted(value: boolean) {
    this._muted = value
    if (this.bgmMasterGain) {
      this.bgmMasterGain.gain.linearRampToValueAtTime(
        value ? 0 : 0.04,
        (this.ctx?.currentTime ?? 0) + 0.3,
      )
    }
  }

  mute(): void {
    this.muted = true
  }

  unmute(): void {
    this.muted = false
  }

  /** Start looping ambient BGM. Safe to call multiple times. */
  startBGM(): void {
    if (this.bgmPlaying) return
    this.init()
    const ctx = this.ctx!
    this.bgmPlaying = true

    // Master gain for all BGM layers
    this.bgmMasterGain = ctx.createGain()
    this.bgmMasterGain.gain.value = this._muted ? 0 : 0.04
    this.bgmMasterGain.connect(ctx.destination)

    // Layer definitions: frequency, type, individual gain
    const layers: Array<{ freq: number; type: OscillatorType; gain: number }> = [
      { freq: 55,   type: 'sine',     gain: 0.6 },  // deep sub drone
      { freq: 110,  type: 'sine',     gain: 0.35 }, // low pad
      { freq: 165,  type: 'triangle', gain: 0.2 },  // fifth overtone
      { freq: 220,  type: 'sine',     gain: 0.15 }, // mid warmth
      { freq: 330,  type: 'sine',     gain: 0.08 }, // high shimmer
    ]

    for (const layer of layers) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = layer.type
      osc.frequency.value = layer.freq
      gain.gain.value = layer.gain

      osc.connect(gain)
      gain.connect(this.bgmMasterGain)
      osc.start()

      this.bgmOscillators.push(osc)
      this.bgmGains.push(gain)
    }

    // Slow LFO modulating the mid layer's frequency for movement
    this.bgmLfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    this.bgmLfo.type = 'sine'
    this.bgmLfo.frequency.value = 0.08 // ~12 second cycle
    lfoGain.gain.value = 4 // +/- 4 Hz modulation
    this.bgmLfo.connect(lfoGain)
    if (this.bgmGains[2]) {
      lfoGain.connect(this.bgmGains[2].gain)
    }
    this.bgmLfo.start()
  }

  /** Stop BGM with a smooth fade out. */
  stopBGM(): void {
    if (!this.bgmPlaying || !this.ctx) return
    const ctx = this.ctx
    const now = ctx.currentTime

    // Fade out master gain
    if (this.bgmMasterGain) {
      this.bgmMasterGain.gain.linearRampToValueAtTime(0, now + 1.0)
    }

    // Stop oscillators after fade
    const oscs = [...this.bgmOscillators]
    const lfo = this.bgmLfo
    setTimeout(() => {
      for (const o of oscs) { try { o.stop() } catch { /* already stopped */ } }
      if (lfo) try { lfo.stop() } catch { /* already stopped */ }
    }, 1200)

    this.bgmOscillators = []
    this.bgmGains = []
    this.bgmMasterGain = null
    this.bgmLfo = null
    this.bgmPlaying = false
  }

  get bgmActive(): boolean {
    return this.bgmPlaying
  }

  play(type: SoundType): void {
    if (this._muted) return
    this.init()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.value = 0.15

    switch (type) {
      case 'add':
        osc.frequency.value = 523
        osc.type = 'sine'
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        osc.start(); osc.stop(ctx.currentTime + 0.15)
        break

      case 'perfect':
        osc.frequency.value = 659
        osc.type = 'sine'
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start(); osc.stop(ctx.currentTime + 0.3)
        setTimeout(() => {
          const o2 = ctx.createOscillator()
          const g2 = ctx.createGain()
          o2.connect(g2); g2.connect(ctx.destination)
          o2.frequency.value = 784; o2.type = 'sine'; g2.gain.value = 0.15
          g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          o2.start(); o2.stop(ctx.currentTime + 0.3)
        }, 100)
        break

      case 'fail':
        osc.frequency.value = 200
        osc.type = 'sawtooth'
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start(); osc.stop(ctx.currentTime + 0.3)
        break

      case 'levelup':
        osc.frequency.value = 523
        osc.type = 'sine'
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        osc.start(); osc.stop(ctx.currentTime + 0.5)
        ;[659, 784, 1047].forEach((f, i) => {
          setTimeout(() => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.connect(g); g.connect(ctx.destination)
            o.frequency.value = f; o.type = 'sine'; g.gain.value = 0.15
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
            o.start(); o.stop(ctx.currentTime + 0.2)
          }, (i + 1) * 120)
        })
        break

      case 'tick':
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.value = 0.08
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
        osc.start(); osc.stop(ctx.currentTime + 0.05)
        break

      case 'full':
        osc.frequency.value = 300
        osc.type = 'square'
        gain.gain.value = 0.1
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
        osc.start(); osc.stop(ctx.currentTime + 0.1)
        break

      case 'unlock':
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.value = 0.15
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        osc.start(); osc.stop(ctx.currentTime + 0.4)
        ;[1175, 1568].forEach((f, i) => {
          setTimeout(() => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.connect(g); g.connect(ctx.destination)
            o.frequency.value = f; o.type = 'sine'; g.gain.value = 0.15
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
            o.start(); o.stop(ctx.currentTime + 0.2)
          }, (i + 1) * 150)
        })
        break
    }
  }
}

export const audioEngine = new AudioEngineClass()
