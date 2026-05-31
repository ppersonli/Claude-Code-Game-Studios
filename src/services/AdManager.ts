/**
 * AdManager — CrazyGames SDK v3 integration singleton.
 *
 * Provides midgame + rewarded ads with graceful degradation.
 * If the SDK is unavailable, every call becomes a safe no-op so the game
 * continues running without interruption.
 */

type AdCallback = () => void

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
    CrazyGames?: {
      SDK?: CrazyGamesSDK
    }
  }
}

export class AdManager {
  private static instance: AdManager | null = null

  private _sdkAvailable = false
  private _adblockDetected = false
  private _onAdStart: AdCallback | null = null
  private _onAdEnd: AdCallback | null = null

  private constructor() {}

  /* ------------------------------------------------------------------ */
  /*  Singleton                                                          */
  /* ------------------------------------------------------------------ */

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager()
    }
    return AdManager.instance
  }

  /** Reset the singleton (useful in tests). */
  static resetInstance(): void {
    AdManager.instance = null
  }

  /* ------------------------------------------------------------------ */
  /*  Initialisation                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Detect whether the CrazyGames SDK is available.
   * Must be called once after the SDK script has loaded.
   */
  init(): void {
    try {
      if (
        typeof window !== 'undefined' &&
        window.CrazyGames?.SDK?.game &&
        window.CrazyGames.SDK.ad
      ) {
        this._sdkAvailable = true
        this._detectAdblock()
      } else {
        this._sdkAvailable = false
      }
    } catch {
      this._sdkAvailable = false
    }
  }

  private _detectAdblock(): void {
    try {
      // CrazyGames SDK exposes an adblock flag after initialisation.
      // If unavailable we default to "no adblock detected".
      const sdk = window.CrazyGames?.SDK as unknown as Record<string, unknown>
      if (sdk && typeof sdk === 'object' && 'hasAdblock' in sdk) {
        this._adblockDetected = Boolean((sdk as { hasAdblock?: boolean }).hasAdblock)
      }
    } catch {
      this._adblockDetected = false
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public getters                                                     */
  /* ------------------------------------------------------------------ */

  /** Whether the SDK is available. `false` → graceful no-op mode. */
  get isEnabled(): boolean {
    return this._sdkAvailable && !this._adblockDetected
  }

  /** Whether an ad-blocker was detected. */
  get adblockDetected(): boolean {
    return this._adblockDetected
  }

  /* ------------------------------------------------------------------ */
  /*  Gameplay signalling                                                */
  /* ------------------------------------------------------------------ */

  gameplayStart(): void {
    try {
      if (this._sdkAvailable) {
        window.CrazyGames!.SDK!.game.gameplayStart()
      }
    } catch { /* swallow */ }
  }

  gameplayStop(): void {
    try {
      if (this._sdkAvailable) {
        window.CrazyGames!.SDK!.game.gameplayStop()
      }
    } catch { /* swallow */ }
  }

  /* ------------------------------------------------------------------ */
  /*  Ad requests                                                        */
  /* ------------------------------------------------------------------ */

  /** Request a midgame (interstitial) ad. Resolves `true` if the player watched the full ad. */
  requestMidgameAd(): Promise<boolean> {
    return this._requestAd('midgame')
  }

  /** Request a rewarded ad. Resolves `true` if the player watched the full ad. */
  requestRewardedAd(): Promise<boolean> {
    return this._requestAd('rewarded')
  }

  /* ------------------------------------------------------------------ */
  /*  Callback injection                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Register callbacks that fire when *any* ad starts / ends.
   * The game should pause audio & input on start, and resume on end.
   */
  setAdCallbacks(onStart: AdCallback, onEnd: AdCallback): void {
    this._onAdStart = onStart
    this._onAdEnd = onEnd
  }

  /* ------------------------------------------------------------------ */
  /*  Internals                                                          */
  /* ------------------------------------------------------------------ */

  private _requestAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      try {
        if (!this._sdkAvailable || !window.CrazyGames?.SDK?.ad) {
          resolve(false)
          return
        }

        this._onAdStart?.()

        window.CrazyGames.SDK.ad.requestAd(type, {
          adStarted: () => {
            // ad has started — nothing extra needed here
          },
          adFinished: () => {
            this._onAdEnd?.()
            resolve(true)
          },
          adError: () => {
            this._onAdEnd?.()
            resolve(false)
          },
        })
      } catch {
        this._onAdEnd?.()
        resolve(false)
      }
    })
  }
}
