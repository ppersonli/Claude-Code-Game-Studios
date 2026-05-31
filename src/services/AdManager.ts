/**
 * AdManager — Multi-platform SDK integration singleton.
 *
 * Delegates to PlatformManager which auto-detects Poki, CrazyGames,
 * or falls back to local dev (no-op).
 *
 * Provides midgame + rewarded ads with graceful degradation.
 * If no SDK is available, every call becomes a safe no-op so the game
 * continues running without interruption.
 */

import { PlatformManager } from './PlatformManager'

type AdCallback = () => void

export class AdManager {
  private static instance: AdManager | null = null

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
    PlatformManager.resetInstance()
  }

  /* ------------------------------------------------------------------ */
  /*  Initialisation                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Detect available platform SDK and initialize.
   * Delegates to PlatformManager for dual-platform support.
   * Must be called once after SDK scripts have loaded.
   */
  init(): void {
    // Sync init — PlatformManager handles async init separately
    // via initAsync() called in main.ts
    PlatformManager.getInstance()
  }

  /**
   * Async initialization — detects Poki/CrazyGames SDK.
   * Call this in main.ts before mounting the Vue app.
   */
  async initAsync(): Promise<void> {
    const pm = PlatformManager.getInstance()
    await pm.init()
    // Wire callbacks if already set
    if (this._onAdStart && this._onAdEnd) {
      pm.setAdCallbacks(this._onAdStart, this._onAdEnd)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public getters                                                     */
  /* ------------------------------------------------------------------ */

  /** Whether any SDK is available. `false` → graceful no-op mode. */
  get isEnabled(): boolean {
    const pm = PlatformManager.getInstance()
    return pm.platform !== 'local'
  }

  /** Which platform is active. */
  get platform() {
    return PlatformManager.getInstance().platform
  }

  /* ------------------------------------------------------------------ */
  /*  Gameplay signalling                                                */
  /* ------------------------------------------------------------------ */

  gameplayStart(): void {
    PlatformManager.getInstance().gameplayStart()
  }

  gameplayStop(): void {
    PlatformManager.getInstance().gameplayStop()
  }

  /* ------------------------------------------------------------------ */
  /*  Ad requests                                                        */
  /* ------------------------------------------------------------------ */

  /** Request a midgame (interstitial) ad. Resolves `true` if the player watched the full ad. */
  requestMidgameAd(): Promise<boolean> {
    return PlatformManager.getInstance().requestMidgameAd()
  }

  /** Request a rewarded ad. Resolves `true` if the player watched the full ad. */
  requestRewardedAd(): Promise<boolean> {
    return PlatformManager.getInstance().requestRewardedAd()
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
    PlatformManager.getInstance().setAdCallbacks(onStart, onEnd)
  }
}
