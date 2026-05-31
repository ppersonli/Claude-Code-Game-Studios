/**
 * AdManager - wrapper around CrazyGames SDK v3.
 * Handles midgame/rewarded ads, adblock detection, and game lifecycle events.
 * Gracefully degrades when SDK is unavailable (local dev, adblock).
 */
export class AdManager {
  private static instance: AdManager | undefined
  private _initialized = false
  private _hasAdblock = false
  private _sdkAvailable = false

  /** Callbacks set by the game scene to pause/resume during ads */
  private onAdStart: (() => void) | null = null
  private onAdEnd: (() => void) | null = null

  /** Track whether a rewarded ad was used this session for shop scene */
  private _shopRewardClaimed = false

  private constructor() {}

  /**
   * Get the singleton instance.
   */
  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager()
    }
    return AdManager.instance
  }

  /**
   * Reset the singleton (for testing).
   */
  static resetInstance(): void {
    AdManager.instance = undefined
  }

  /**
   * Initialize the AdManager. Checks for SDK availability and adblock.
   * Safe to call multiple times.
   */
  init(): void {
    if (this._initialized) return
    this._initialized = true

    try {
      const sdk = this.getSdk()
      this._sdkAvailable = !!sdk
    } catch {
      this._sdkAvailable = false
    }

    if (!this._sdkAvailable) {
      this._hasAdblock = false
      return
    }

    this.detectAdblock()
  }

  /**
   * Set callbacks for when ads start/end.
   */
  setAdCallbacks(onStart: () => void, onEnd: () => void): void {
    this.onAdStart = onStart
    this.onAdEnd = onEnd
  }

  get hasAdblock(): boolean {
    return this._hasAdblock
  }

  get isEnabled(): boolean {
    return this._initialized && this._sdkAvailable && !this._hasAdblock
  }

  get shopRewardClaimed(): boolean {
    return this._shopRewardClaimed
  }

  set shopRewardClaimed(value: boolean) {
    this._shopRewardClaimed = value
  }

  /**
   * Notify the SDK that gameplay has started/resumed.
   */
  gameplayStart(): void {
    try {
      const sdk = this.getSdk()
      if (sdk?.game?.gameplayStart) {
        sdk.game.gameplayStart()
      }
    } catch {
      // SDK unavailable
    }
  }

  /**
   * Notify the SDK that gameplay has stopped/paused.
   */
  gameplayStop(): void {
    try {
      const sdk = this.getSdk()
      if (sdk?.game?.gameplayStop) {
        sdk.game.gameplayStop()
      }
    } catch {
      // SDK unavailable
    }
  }

  /**
   * Request a midgame ad (between levels).
   */
  requestMidgameAd(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!this.isEnabled) {
        resolve(false)
        return
      }

      try {
        const sdk = this.getSdk()
        if (!sdk?.ad?.requestAd) {
          resolve(false)
          return
        }

        const callbacks = {
          adStarted: () => {
            this.onAdStart?.()
          },
          adFinished: () => {
            this.onAdEnd?.()
            resolve(true)
          },
          adError: (_error: string, _errorData?: unknown) => {
            this.onAdEnd?.()
            resolve(false)
          },
        }

        sdk.ad.requestAd('midgame', callbacks)
      } catch {
        this.onAdEnd?.()
        resolve(false)
      }
    })
  }

  /**
   * Request a rewarded ad (user-initiated).
   */
  requestRewardedAd(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!this.isEnabled) {
        resolve(false)
        return
      }

      try {
        const sdk = this.getSdk()
        if (!sdk?.ad?.requestAd) {
          resolve(false)
          return
        }

        const callbacks = {
          adStarted: () => {
            this.onAdStart?.()
          },
          adFinished: () => {
            this.onAdEnd?.()
            resolve(true)
          },
          adError: (_error: string, _errorData?: unknown) => {
            this.onAdEnd?.()
            resolve(false)
          },
        }

        sdk.ad.requestAd('rewarded', callbacks)
      } catch {
        this.onAdEnd?.()
        resolve(false)
      }
    })
  }

  /**
   * Get the CrazyGames SDK reference from the global scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSdk(): any {
    if (typeof window !== 'undefined' && (window as any).CrazyGames?.SDK) {
      return (window as any).CrazyGames.SDK
    }
    return null
  }

  /**
   * Detect adblock by attempting a test ad request.
   */
  private detectAdblock(): void {
    try {
      const sdk = this.getSdk()
      if (!sdk?.ad?.requestAd) {
        this._hasAdblock = false
        return
      }

      const callbacks = {
        adStarted: () => {
          this._hasAdblock = false
        },
        adFinished: () => {
          this._hasAdblock = false
        },
        adError: (error: string) => {
          if (typeof error === 'string' && error.toLowerCase().includes('adblock')) {
            this._hasAdblock = true
          }
        },
      }

      sdk.ad.requestAd('midgame', callbacks)
    } catch {
      this._hasAdblock = false
    }
  }
}
