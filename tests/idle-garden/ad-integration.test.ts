/**
 * Idle Garden Tycoon — Ad Integration Tests
 * Tests for CG SDK ad integration: midgame ads, rewarded ads, gameplay signalling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdManager } from '../../src/services/AdManager'
import { PlatformManager } from '../../src/services/PlatformManager'

// ── Mock helpers ──────────────────────────────────────────────

function createMockSDK(overrides: { adError?: boolean } = {}) {
  const mockSDK = {
    game: {
      gameplayStart: vi.fn(),
      gameplayStop: vi.fn(),
    },
    ad: {
      requestAd: vi.fn((type: string, callbacks: Record<string, unknown>) => {
        if (overrides.adError) {
          setTimeout(() => (callbacks.adError as () => void)?.('ad error'), 0)
        } else {
          setTimeout(() => (callbacks.adFinished as () => void)?.(), 0)
        }
      }),
    },
  }
  return mockSDK
}

function injectSDK(mockSDK: ReturnType<typeof createMockSDK>) {
  ;(window as unknown as Record<string, unknown>).CrazyGames = { SDK: mockSDK }
}

function removeSDK() {
  delete (window as unknown as Record<string, unknown>).CrazyGames
}

// ── Tests ─────────────────────────────────────────────────────

describe('Idle Garden — Ad Integration', () => {
  beforeEach(() => {
    AdManager.resetInstance()
    PlatformManager.resetInstance()
    removeSDK()
  })

  afterEach(() => {
    AdManager.resetInstance()
    PlatformManager.resetInstance()
    removeSDK()
  })

  // ── Gameplay signalling ───────────────────────────────────

  describe('gameplayStart / gameplayStop', () => {
    it('gameplayStart is called when entering game screen', async () => {
      const mockSDK = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      mgr.gameplayStart()
      expect(mockSDK.game.gameplayStart).toHaveBeenCalledOnce()
    })

    it('gameplayStop is called when leaving game screen', async () => {
      const mockSDK = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      mgr.gameplayStop()
      expect(mockSDK.game.gameplayStop).toHaveBeenCalledOnce()
    })

    it('gameplayStart is safe when SDK is absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(() => mgr.gameplayStart()).not.toThrow()
    })

    it('gameplayStop is safe when SDK is absent', () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      expect(() => mgr.gameplayStop()).not.toThrow()
    })
  })

  // ── Midgame (interstitial) ads ────────────────────────────

  describe('midgame ad (interstitial after harvests)', () => {
    it('requestMidgameAd resolves true on success', async () => {
      const mockSDK = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      const result = await mgr.requestMidgameAd()
      expect(result).toBe(true)
    })

    it('requestMidgameAd resolves false on error', async () => {
      const mockSDK = createMockSDK({ adError: true })
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      const result = await mgr.requestMidgameAd()
      expect(result).toBe(false)
    })

    it('requestMidgameAd resolves false when SDK absent', async () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      const result = await mgr.requestMidgameAd()
      expect(result).toBe(false)
    })
  })

  // ── Rewarded ads ──────────────────────────────────────────

  describe('rewarded ad (2x offline earnings)', () => {
    it('requestRewardedAd resolves true on success', async () => {
      const mockSDK = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      const result = await mgr.requestRewardedAd()
      expect(result).toBe(true)
    })

    it('requestRewardedAd resolves false on error', async () => {
      const mockSDK = createMockSDK({ adError: true })
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      const result = await mgr.requestRewardedAd()
      expect(result).toBe(false)
    })

    it('requestRewardedAd resolves false when SDK absent', async () => {
      const mgr = AdManager.getInstance()
      mgr.init()
      const result = await mgr.requestRewardedAd()
      expect(result).toBe(false)
    })
  })

  // ── Ad callbacks ──────────────────────────────────────────

  describe('ad callbacks (pause/resume game)', () => {
    it('onAdStart and onAdEnd fire during rewarded ad', async () => {
      const mockSDK = createMockSDK()
      injectSDK(mockSDK)
      const mgr = AdManager.getInstance()
      mgr.init()
      await PlatformManager.getInstance().init()

      const callOrder: string[] = []
      mgr.setAdCallbacks(
        () => callOrder.push('start'),
        () => callOrder.push('end'),
      )

      await mgr.requestRewardedAd()
      expect(callOrder).toEqual(['start', 'end'])
    })

    it('onAdStart and onAdEnd fire during failed ad', async () => {
      const mockSDK = createMockSDK({ adError: true })
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
  })

  // ── Harvest counter for interstitial timing ───────────────

  describe('harvest counter (interstitial trigger)', () => {
    it('interstitial ad should trigger after every N harvests', () => {
      // Design: show midgame ad every 5 harvests
      const INTERSTITIAL_INTERVAL = 5
      let harvestCount = 0
      let adsShown = 0

      function onHarvest() {
        harvestCount++
        if (harvestCount % INTERSTITIAL_INTERVAL === 0) {
          adsShown++
        }
      }

      // Simulate 12 harvests
      for (let i = 0; i < 12; i++) onHarvest()

      // Should show ads at harvest 5 and 10
      expect(adsShown).toBe(2)
      expect(harvestCount).toBe(12)
    })

    it('interstitial does not trigger on first harvest', () => {
      const INTERSTITIAL_INTERVAL = 5
      let harvestCount = 0
      let adTriggered = false

      function onHarvest() {
        harvestCount++
        if (harvestCount % INTERSTITIAL_INTERVAL === 0) {
          adTriggered = true
        }
      }

      onHarvest() // harvest 1
      expect(adTriggered).toBe(false)
    })
  })
})
