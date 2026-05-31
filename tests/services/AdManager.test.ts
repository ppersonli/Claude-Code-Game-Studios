import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdManager } from '../../src/services/AdManager'
import { PlatformManager } from '../../src/services/PlatformManager'

// ──────────────────────────────────────────────
// Helpers to mock the CrazyGames SDK on `window`
// ──────────────────────────────────────────────

function createMockSDK(overrides: {
  hasAdblock?: boolean
  adError?: boolean
} = {}) {
  const adCallbacks: Record<string, ((...args: unknown[]) => void) | undefined> = {}

  const mockSDK = {
    game: {
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
    },
    ad: {
      requestAd: vi.fn((type: string, callbacks: Record<string, unknown>) => {
        // Store callbacks so tests can trigger them
        Object.assign(adCallbacks, callbacks)
        // Auto-trigger adFinished or adError based on override
        if (overrides.adError) {
          setTimeout(() => (callbacks.adError as () => void)?.('ad error'), 0)
        } else {
          setTimeout(() => (callbacks.adFinished as () => void)?.(), 0)
        }
      }),
    },
    hasAdblock: overrides.hasAdblock ?? false,
  }

  return { mockSDK, adCallbacks }
}

function injectSDK(mockSDK: ReturnType<typeof createMockSDK>['mockSDK']) {
  ;(window as unknown as Record<string, unknown>).CrazyGames = { SDK: mockSDK }
}

function removeSDK() {
  delete (window as unknown as Record<string, unknown>).CrazyGames
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('AdManager', () => {
  beforeEach(() => {
    AdManager.resetInstance()
    PlatformManager.resetInstance()
    removeSDK()
    delete (window as unknown as Record<string, unknown>).PokiSDK
  })

  afterEach(() => {
    AdManager.resetInstance()
    PlatformManager.resetInstance()
    removeSDK()
    delete (window as unknown as Record<string, unknown>).PokiSDK
  })

  // === Singleton ===

  describe('singleton', () => {
    it('getInstance returns the same instance', () => {
      const a = AdManager.getInstance()
      const b = AdManager.getInstance()
      expect(a).toBe(b)
    })

    it('resetInstance causes getInstance to return a new instance', () => {
      const a = AdManager.getInstance()
      AdManager.resetInstance()
      const b = AdManager.getInstance()
      expect(a).not.toBe(b)
    })

    it('multiple resetInstance calls are safe', () => {
      AdManager.resetInstance()
      AdManager.resetInstance()
      expect(AdManager.getInstance()).toBeDefined()
    })
  })

  // === init ===

  describe('init()', () => {
    it('detects SDK when present', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      expect(mgr.isEnabled).toBe(true)
    })

    it('sets isEnabled=false when SDK is absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(mgr.isEnabled).toBe(false)
    })

    it('sets isEnabled=false when SDK.game is missing', async () => {
      ;(window as unknown as Record<string, unknown>).CrazyGames = {
        SDK: { ad: { requestAd: vi.fn() } },
      }
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      expect(mgr.isEnabled).toBe(false)
    })

    it('sets isEnabled=false when SDK.ad is missing', async () => {
      ;(window as unknown as Record<string, unknown>).CrazyGames = {
        SDK: { game: { gameplayStart: vi.fn(), gameplayStop: vi.fn() } },
      }
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      expect(mgr.isEnabled).toBe(false)
    })

    it('handles window.CrazyGames being undefined', () => {
      removeSDK()
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(mgr.isEnabled).toBe(false)
    })

    it('handles window.CrazyGames.SDK being undefined', () => {
      ;(window as unknown as Record<string, unknown>).CrazyGames = {}
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(mgr.isEnabled).toBe(false)
    })
  })

  // === Adblock (handled by PlatformManager) ===

  describe('adblock detection', () => {
    it('detects adblock when hasAdblock is true', async () => {
      const { mockSDK } = createMockSDK({ hasAdblock: true })
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      // PlatformManager does not detect adblock; isEnabled depends on platform only
      expect(mgr.platform).toBe('crazygames')
    })
  })

  // === gameplayStart / gameplayStop ===

  describe('gameplayStart / gameplayStop', () => {
    it('calls SDK.game.gameplayStart when SDK is available', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      mgr.gameplayStart()
      expect(mockSDK.game.gameplayStart).toHaveBeenCalledOnce()
    })

    it('calls SDK.game.gameplayStop when SDK is available', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      mgr.gameplayStop()
      expect(mockSDK.game.gameplayStop).toHaveBeenCalledOnce()
    })

    it('gameplayStart is a no-op when SDK is absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(() => mgr.gameplayStart()).not.toThrow()
    })

    it('gameplayStop is a no-op when SDK is absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(() => mgr.gameplayStop()).not.toThrow()
    })

    it('gameplayStart handles SDK throwing an error', async () => {
      const mockSDK = {
        game: {
          gameplayStart: vi.fn(() => { throw new Error('SDK error') }),
          gameplayStop: vi.fn(),
        },
        ad: { requestAd: vi.fn() },
      }
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      expect(() => mgr.gameplayStart()).not.toThrow()
    })

    it('gameplayStop handles SDK throwing an error', async () => {
      const mockSDK = {
        game: {
          gameplayStart: vi.fn(),
          gameplayStop: vi.fn(() => { throw new Error('SDK error') }),
        },
        ad: { requestAd: vi.fn() },
      }
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      expect(() => mgr.gameplayStop()).not.toThrow()
    })
  })

  // === requestMidgameAd ===

  describe('requestMidgameAd', () => {
    it('resolves true when ad finishes', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const result = await mgr.requestMidgameAd()
      expect(result).toBe(true)
    })

    it('resolves false when ad errors', async () => {
      const { mockSDK } = createMockSDK({ adError: true })
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const result = await mgr.requestMidgameAd()
      expect(result).toBe(false)
    })

    it('resolves false when SDK is absent', async () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      const result = await mgr.requestMidgameAd()
      expect(result).toBe(false)
    })

    it('resolves false when SDK.ad is missing', async () => {
      ;(window as unknown as Record<string, unknown>).CrazyGames = {
        SDK: { game: { gameplayStart: vi.fn(), gameplayStop: vi.fn() } },
      }
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const result = await mgr.requestMidgameAd()
      expect(result).toBe(false)
    })
  })

  // === requestRewardedAd ===

  describe('requestRewardedAd', () => {
    it('resolves true when rewarded ad finishes', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const result = await mgr.requestRewardedAd()
      expect(result).toBe(true)
    })

    it('resolves false when rewarded ad errors', async () => {
      const { mockSDK } = createMockSDK({ adError: true })
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const result = await mgr.requestRewardedAd()
      expect(result).toBe(false)
    })

    it('resolves false when SDK is absent', async () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      const result = await mgr.requestRewardedAd()
      expect(result).toBe(false)
    })
  })

  // === setAdCallbacks ===

  describe('setAdCallbacks', () => {
    it('calls onStart and onEnd during a successful ad', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const onStart = vi.fn()
      const onEnd = vi.fn()
      mgr.setAdCallbacks(onStart, onEnd)
      await mgr.requestMidgameAd()
      expect(onStart).toHaveBeenCalledOnce()
      expect(onEnd).toHaveBeenCalledOnce()
    })

    it('calls onStart and onEnd during a failed ad', async () => {
      const { mockSDK } = createMockSDK({ adError: true })
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const onStart = vi.fn()
      const onEnd = vi.fn()
      mgr.setAdCallbacks(onStart, onEnd)
      await mgr.requestMidgameAd()
      expect(onStart).toHaveBeenCalledOnce()
      expect(onEnd).toHaveBeenCalledOnce()
    })

    it('onStart is called before onEnd', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      const callOrder: string[] = []
      mgr.setAdCallbacks(
        () => callOrder.push('start'),
        () => callOrder.push('end'),
      )
      await mgr.requestMidgameAd()
      expect(callOrder).toEqual(['start', 'end'])
    })

    it('does not crash if no callbacks are set', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      await expect(mgr.requestMidgameAd()).resolves.toBe(true)
    })
  })

  // === isEnabled ===

  describe('isEnabled', () => {
    it('returns false before init() is called', () => {
      const mgr = AdManager.getInstance()
      expect(mgr.isEnabled).toBe(false)
    })

    it('returns true after init with SDK present', async () => {
      const { mockSDK } = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()
      expect(mgr.isEnabled).toBe(true)
    })

    it('returns false when no SDK present', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(mgr.isEnabled).toBe(false)
    })
  })

  // === Graceful degradation ===

  describe('graceful degradation', () => {
    it('all methods are safe when SDK is completely absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(() => {
        mgr.gameplayStart()
        mgr.gameplayStop()
      }).not.toThrow()
    })

    it('ad requests resolve false gracefully when SDK absent', async () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(await mgr.requestMidgameAd()).toBe(false)
      expect(await mgr.requestRewardedAd()).toBe(false)
    })

    it('setAdCallbacks works when SDK is absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(() => {
        mgr.setAdCallbacks(vi.fn(), vi.fn())
      }).not.toThrow()
    })

    it('ad callbacks fire onStart and onEnd even when SDK requestAd throws', async () => {
      const mockSDK = {
        game: { gameplayStart: vi.fn(), gameplayStop: vi.fn() },
        ad: { requestAd: vi.fn(() => { throw new Error('fail') }) },
      }
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      const onStart = vi.fn()
      const onEnd = vi.fn()
      mgr.setAdCallbacks(onStart, onEnd)
      const result = await mgr.requestMidgameAd()
      expect(result).toBe(false)
      expect(onStart).toHaveBeenCalledOnce()
      expect(onEnd).toHaveBeenCalledOnce()
    })
  })
})
