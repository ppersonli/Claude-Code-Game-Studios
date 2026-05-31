/**
 * CrazyGames SDK wrapper – singleton.
 * Falls back gracefully when the SDK is unavailable.
 */
export class AdManager {
  private static instance: AdManager
  private sdk: any = null
  private onPause: (() => void) | null = null
  private onResume: (() => void) | null = null

  private constructor() {}

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager()
    }
    return AdManager.instance
  }

  init(): void {
    try {
      const w = window as any
      if (w.CrazyGames?.SDK) {
        this.sdk = w.CrazyGames.SDK
      }
    } catch {
      /* noop */
    }
  }

  setAdCallbacks(onPause: () => void, onResume: () => void): void {
    this.onPause = onPause
    this.onResume = onResume
  }

  gameplayStart(): void {
    try {
      this.sdk?.game?.gameplayStart()
    } catch {
      /* noop */
    }
  }

  gameplayStop(): void {
    try {
      this.sdk?.game?.gameplayStop()
    } catch {
      /* noop */
    }
  }

  requestAd(type: 'midgame' | 'rewarded' = 'midgame'): void {
    try {
      this.onPause?.()
      this.sdk?.ad?.requestAd(type)
    } catch {
      this.onResume?.()
    }
  }

  async requestRewardedAd(): Promise<boolean> {
    try {
      this.onPause?.()
      await this.sdk?.ad?.requestAd('rewarded')
      this.onResume?.()
      return true
    } catch {
      this.onResume?.()
      return false
    }
  }
}
