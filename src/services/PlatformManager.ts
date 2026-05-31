/**
 * PlatformManager — dual-platform SDK abstraction for CrazyGames + Poki.
 *
 * Detects which platform SDK is available and provides a unified API.
 * Games call one interface; it works on both platforms.
 *
 * Platform detection priority: Poki > CrazyGames > Local dev (no-op).
 */

export type PlatformId = 'poki' | 'crazygames' | 'local'

interface PokiSDK {
  init(): Promise<void>
  gameplayStart(): void
  gameplayStop(): void
  commercialBreak(callback?: () => void): Promise<void>
  rewardedBreak(options?: { size?: string; onStart?: () => void }): Promise<boolean>
}

interface CrazyGamesSDK {
  game: {
    gameplayStart(): void
    gameplayStop(): void
  }
  ad: {
    requestAd(type: 'midgame' | 'rewarded', callbacks: {
      adStarted?: () => void
      adFinished?: () => void
      adError?: (error: unknown) => void
    }): void
  }
}

declare global {
  interface Window {
    PokiSDK?: PokiSDK
    CrazyGames?: {
      SDK?: CrazyGamesSDK
    }
  }
}

type AdCallback = () => void

export class PlatformManager {
  private static instance: PlatformManager | null = null

  private _platform: PlatformId = 'local'
  private _initialized = false
  private _onAdStart: AdCallback | null = null
  private _onAdEnd: AdCallback | null = null

  private constructor() {}

  static getInstance(): PlatformManager {
    if (!PlatformManager.instance) {
      PlatformManager.instance = new PlatformManager()
    }
    return PlatformManager.instance
  }

  static resetInstance(): void {
    PlatformManager.instance = null
  }

  // ─── Platform detection ─────────────────────────────────────────────

  get platform(): PlatformId {
    return this._platform
  }

  get isInitialized(): boolean {
    return this._initialized
  }

  /**
   * Detect platform and initialize the appropriate SDK.
   * Must be called once at app startup.
   */
  async init(): Promise<void> {
    if (this._initialized) return

    // Poki detection
    if (typeof window !== 'undefined' && window.PokiSDK) {
      try {
        await window.PokiSDK.init()
        this._platform = 'poki'
        this._initialized = true
        return
      } catch {
        // Poki init failed, try CrazyGames
      }
    }

    // CrazyGames detection
    if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game && window.CrazyGames.SDK.ad) {
      this._platform = 'crazygames'
      this._initialized = true
      return
    }

    // Local dev
    this._platform = 'local'
    this._initialized = true
  }

  // ─── Callbacks ──────────────────────────────────────────────────────

  setAdCallbacks(onStart: AdCallback, onEnd: AdCallback): void {
    this._onAdStart = onStart
    this._onAdEnd = onEnd
  }

  // ─── Gameplay signals ───────────────────────────────────────────────

  gameplayStart(): void {
    try {
      if (this._platform === 'poki') {
        window.PokiSDK?.gameplayStart()
      } else if (this._platform === 'crazygames') {
        window.CrazyGames?.SDK?.game.gameplayStart()
      }
    } catch { /* swallow */ }
  }

  gameplayStop(): void {
    try {
      if (this._platform === 'poki') {
        window.PokiSDK?.gameplayStop()
      } else if (this._platform === 'crazygames') {
        window.CrazyGames?.SDK?.game.gameplayStop()
      }
    } catch { /* swallow */ }
  }

  // ─── Ad requests ────────────────────────────────────────────────────

  /**
   * Request a midroll/interstitial ad.
   * Returns true if an ad was shown.
   */
  requestMidgameAd(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        this._onAdStart?.()

        if (this._platform === 'poki') {
          window.PokiSDK?.commercialBreak(() => {
            // pause callback - Poki calls this when ad starts
          }).then(() => {
            this._onAdEnd?.()
            resolve(true)
          }).catch(() => {
            this._onAdEnd?.()
            resolve(false)
          })
        } else if (this._platform === 'crazygames') {
          if (!window.CrazyGames?.SDK?.ad) {
            this._onAdEnd?.()
            resolve(false)
            return
          }
          window.CrazyGames.SDK.ad.requestAd('midgame', {
            adStarted: () => {},
            adFinished: () => {
              this._onAdEnd?.()
              resolve(true)
            },
            adError: () => {
              this._onAdEnd?.()
              resolve(false)
            },
          })
        } else {
          this._onAdEnd?.()
          resolve(false)
        }
      } catch {
        this._onAdEnd?.()
        resolve(false)
      }
    })
  }

  /**
   * Request a rewarded video ad.
   * Returns true if the user watched the full ad.
   */
  requestRewardedAd(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        this._onAdStart?.()

        if (this._platform === 'poki') {
          window.PokiSDK?.rewardedBreak({
            size: 'medium',
            onStart: () => {},
          }).then((success) => {
            this._onAdEnd?.()
            resolve(success)
          }).catch(() => {
            this._onAdEnd?.()
            resolve(false)
          })
        } else if (this._platform === 'crazygames') {
          if (!window.CrazyGames?.SDK?.ad) {
            this._onAdEnd?.()
            resolve(false)
            return
          }
          window.CrazyGames.SDK.ad.requestAd('rewarded', {
            adStarted: () => {},
            adFinished: () => {
              this._onAdEnd?.()
              resolve(true)
            },
            adError: () => {
              this._onAdEnd?.()
              resolve(false)
            },
          })
        } else {
          this._onAdEnd?.()
          resolve(false)
        }
      } catch {
        this._onAdEnd?.()
        resolve(false)
      }
    })
  }
}
