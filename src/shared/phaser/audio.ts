type SoundType = 'add' | 'perfect' | 'fail' | 'levelup' | 'tick' | 'full' | 'unlock'

class AudioEngineClass {
  private ctx: AudioContext | null = null
  private _muted = false

  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
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
  }

  mute(): void {
    this._muted = true
  }

  unmute(): void {
    this._muted = false
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
