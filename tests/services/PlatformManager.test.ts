import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlatformManager } from '../../src/services/PlatformManager'

// ─── Mock SDK factories ───────────────────────────────────────────────

function mockPokiSDK(adSuccess = true) {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    gameplayStart: vi.fn(),
    gameplayStop: vi.fn(),
    commercialBreak: vi.fn().mockResolvedValue(undefined),
    rewardedBreak: vi.fn().mockResolvedValue(adSuccess),
  }
}

function mockCrazyGamesSDK(adSuccess = true) {
  return {
    SDK: {
      game: {
        gameplayStart: vi.fn(),
        gameplayStop: vi.fn(),
      },
      ad: {
        requestAd: vi.fn((_type: string, callbacks: Record<string, unknown>) => {
          if (adSuccess) {
            setTimeout(() => (callbacks.adFinished as () => void)?.(), 0)
          } else {
            setTimeout(() => (callbacks.adError as () => void)?.('error'), 0)
          }
        }),
      },
    },
  }
}

describe('PlatformManager', () => {
  beforeEach(() => {
    PlatformManager.resetInstance()
    // Clear window globals
    delete (window as any).PokiSDK
    delete (window as any).CrazyGames
  })

  afterEach(() => {
    PlatformManager.resetInstance()
    delete (window as any).PokiSDK
    delete (window as any).CrazyGames
  })

  // ─── Singleton ──────────────────────────────────────────────────────

  describe('singleton', () => {
    it('test_same_instance', () => {
      const a = PlatformManager.getInstance()
      const b = PlatformManager.getInstance()
      expect(a).toBe(b)
    })
    it('test_reset_creates_new', () => {
      const a = PlatformManager.getInstance()
      PlatformManager.resetInstance()
      const b = PlatformManager.getInstance()
      expect(a).not.toBe(b)
    })
  })

  // ─── Platform detection ─────────────────────────────────────────────

  describe('platform detection', () => {
    it('test_local_by_default', async () => {
      const pm = PlatformManager.getInstance()
      await pm.init()
      expect(pm.platform).toBe('local')
      expect(pm.isInitialized).toBe(true)
    })

    it('test_detects_poki', async () => {
      ;(window as any).PokiSDK = mockPokiSDK()
      const pm = PlatformManager.getInstance()
      await pm.init()
      expect(pm.platform).toBe('poki')
      expect(pm.isInitialized).toBe(true)
    })

    it('test_detects_crazygames', async () => {
      ;(window as any).CrazyGames = mockCrazyGamesSDK()
      const pm = PlatformManager.getInstance()
      await pm.init()
      expect(pm.platform).toBe('crazygames')
      expect(pm.isInitialized).toBe(true)
    })

    it('test_poki_takes_priority', async () => {
      ;(window as any).PokiSDK = mockPokiSDK()
      ;(window as any).CrazyGames = mockCrazyGamesSDK()
      const pm = PlatformManager.getInstance()
      await pm.init()
      expect(pm.platform).toBe('poki')
    })

    it('test_poki_init_failure_falls_to_cg', async () => {
      const pokiSDK = mockPokiSDK()
      pokiSDK.init.mockRejectedValue(new Error('init failed'))
      ;(window as any).PokiSDK = pokiSDK
      ;(window as any).CrazyGames = mockCrazyGamesSDK()
      const pm = PlatformManager.getInstance()
      await pm.init()
      expect(pm.platform).toBe('crazygames')
    })

    it('test_init_is_idempotent', async () => {
      const pm = PlatformManager.getInstance()
      await pm.init()
      await pm.init()
      expect(pm.isInitialized).toBe(true)
    })
  })

  // ─── Gameplay signals ───────────────────────────────────────────────

  describe('gameplay signals', () => {
    it('test_gameplayStart_calls_poki', async () => {
      const pokiSDK = mockPokiSDK()
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.gameplayStart()
      expect(pokiSDK.gameplayStart).toHaveBeenCalledOnce()
    })

    it('test_gameplayStop_calls_poki', async () => {
      const pokiSDK = mockPokiSDK()
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.gameplayStop()
      expect(pokiSDK.gameplayStop).toHaveBeenCalledOnce()
    })

    it('test_gameplayStart_calls_cg', async () => {
      const cgSDK = mockCrazyGamesSDK()
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.gameplayStart()
      expect(cgSDK.SDK.game.gameplayStart).toHaveBeenCalledOnce()
    })

    it('test_gameplayStop_calls_cg', async () => {
      const cgSDK = mockCrazyGamesSDK()
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.gameplayStop()
      expect(cgSDK.SDK.game.gameplayStop).toHaveBeenCalledOnce()
    })

    it('test_gameplayStart_noop_local', async () => {
      const pm = PlatformManager.getInstance()
      await pm.init()
      // Should not throw
      expect(() => pm.gameplayStart()).not.toThrow()
    })
  })

  // ─── Ad requests ────────────────────────────────────────────────────

  describe('ad requests', () => {
    it('test_midgameAd_poki_success', async () => {
      const pokiSDK = mockPokiSDK(true)
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestMidgameAd()
      expect(result).toBe(true)
      expect(pokiSDK.commercialBreak).toHaveBeenCalledOnce()
    })

    it('test_midgameAd_poki_failure', async () => {
      const pokiSDK = mockPokiSDK()
      pokiSDK.commercialBreak.mockRejectedValue(new Error('no ad'))
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestMidgameAd()
      expect(result).toBe(false)
    })

    it('test_rewardedAd_poki_success', async () => {
      const pokiSDK = mockPokiSDK(true)
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestRewardedAd()
      expect(result).toBe(true)
      expect(pokiSDK.rewardedBreak).toHaveBeenCalledOnce()
    })

    it('test_rewardedAd_poki_failure', async () => {
      const pokiSDK = mockPokiSDK(false)
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestRewardedAd()
      expect(result).toBe(false)
    })

    it('test_midgameAd_cg_success', async () => {
      const cgSDK = mockCrazyGamesSDK(true)
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestMidgameAd()
      expect(result).toBe(true)
    })

    it('test_midgameAd_cg_failure', async () => {
      const cgSDK = mockCrazyGamesSDK(false)
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestMidgameAd()
      expect(result).toBe(false)
    })

    it('test_rewardedAd_cg_success', async () => {
      const cgSDK = mockCrazyGamesSDK(true)
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestRewardedAd()
      expect(result).toBe(true)
    })

    it('test_rewardedAd_cg_failure', async () => {
      const cgSDK = mockCrazyGamesSDK(false)
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestRewardedAd()
      expect(result).toBe(false)
    })

    it('test_midgameAd_local_returns_false', async () => {
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestMidgameAd()
      expect(result).toBe(false)
    })

    it('test_rewardedAd_local_returns_false', async () => {
      const pm = PlatformManager.getInstance()
      await pm.init()
      const result = await pm.requestRewardedAd()
      expect(result).toBe(false)
    })
  })

  // ─── Ad callbacks ───────────────────────────────────────────────────

  describe('ad callbacks', () => {
    it('test_callbacks_fired_on_cg_midgame', async () => {
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const cgSDK = mockCrazyGamesSDK(true)
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.setAdCallbacks(onStart, onEnd)
      await pm.requestMidgameAd()
      expect(onStart).toHaveBeenCalled()
      expect(onEnd).toHaveBeenCalled()
    })

    it('test_callbacks_fired_on_cg_failure', async () => {
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const cgSDK = mockCrazyGamesSDK(false)
      ;(window as any).CrazyGames = cgSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.setAdCallbacks(onStart, onEnd)
      await pm.requestMidgameAd()
      expect(onStart).toHaveBeenCalled()
      expect(onEnd).toHaveBeenCalled()
    })

    it('test_callbacks_fired_on_poki', async () => {
      const onStart = vi.fn()
      const onEnd = vi.fn()
      const pokiSDK = mockPokiSDK(true)
      ;(window as any).PokiSDK = pokiSDK
      const pm = PlatformManager.getInstance()
      await pm.init()
      pm.setAdCallbacks(onStart, onEnd)
      await pm.requestMidgameAd()
      expect(onStart).toHaveBeenCalled()
      expect(onEnd).toHaveBeenCalled()
    })
  })
})
