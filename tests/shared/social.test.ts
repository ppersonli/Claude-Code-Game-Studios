import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectPlatform,
  getShareUrl,
  shareGame,
  getFavorites,
  isFavorite,
  toggleFavorite,
  type ShareConfig,
} from '../../src/shared/vue/social'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// Mock navigator
const mockShare = vi.fn().mockResolvedValue(undefined)
const mockWriteText = vi.fn().mockResolvedValue(undefined)
vi.stubGlobal('navigator', { share: mockShare, clipboard: { writeText: mockWriteText } })

const config: ShareConfig = {
  gameName: 'Test Game',
  gameSlug: 'test-game',
  shareText: 'Come play!',
}

// ===== Platform Detection =====

describe('detectPlatform', () => {
  beforeEach(() => {
    delete (window as any).PokiSDK
    delete (window as any).CrazyGames
  })

  it('test_local_by_default', () => { expect(detectPlatform()).toBe('local') })
  it('test_detects_poki', () => {
    ;(window as any).PokiSDK = {}
    expect(detectPlatform()).toBe('poki')
  })
  it('test_detects_crazygames', () => {
    ;(window as any).CrazyGames = { SDK: {} }
    expect(detectPlatform()).toBe('crazygames')
  })
  it('test_poki_takes_priority', () => {
    ;(window as any).PokiSDK = {}
    ;(window as any).CrazyGames = { SDK: {} }
    expect(detectPlatform()).toBe('poki')
  })
})

// ===== Share URL =====

describe('getShareUrl', () => {
  beforeEach(() => {
    delete (window as any).PokiSDK
    delete (window as any).CrazyGames
  })

  it('test_local_returns_current_url', async () => {
    const url = await getShareUrl(config)
    expect(url).toBe(window.location.href)
  })

  it('test_poki_calls_shareableURL', async () => {
    const mockPoki = { shareableURL: vi.fn().mockResolvedValue('https://poki.com/g/test-game') }
    ;(window as any).PokiSDK = mockPoki
    const url = await getShareUrl(config)
    expect(url).toBe('https://poki.com/g/test-game')
    expect(mockPoki.shareableURL).toHaveBeenCalledWith({ id: 'test-game', type: 'game' })
  })

  it('test_poki_fallback_on_error', async () => {
    const mockPoki = { shareableURL: vi.fn().mockRejectedValue(new Error('fail')) }
    ;(window as any).PokiSDK = mockPoki
    const url = await getShareUrl(config)
    expect(url).toBe(window.location.href)
  })

  it('test_crazygames_returns_current_url', async () => {
    ;(window as any).CrazyGames = { SDK: {} }
    const url = await getShareUrl(config)
    expect(url).toBe(window.location.href)
  })
})

// ===== Share Game =====

describe('shareGame', () => {
  beforeEach(() => {
    delete (window as any).PokiSDK
    delete (window as any).CrazyGames
    mockShare.mockClear()
    mockWriteText.mockClear()
  })

  it('test_uses_navigator_share_when_available', async () => {
    const result = await shareGame(config)
    expect(result).toBe(true)
    expect(mockShare).toHaveBeenCalledOnce()
  })

  it('test_falls_back_to_clipboard_when_share_rejects', async () => {
    mockShare.mockRejectedValueOnce(new Error('cancelled'))
    const result = await shareGame(config)
    expect(result).toBe(true)
    expect(mockWriteText).toHaveBeenCalledOnce()
  })

  it('test_returns_true_on_success', async () => {
    const result = await shareGame(config)
    expect(result).toBe(true)
  })
})

// ===== Favorites =====

describe('favorites', () => {
  beforeEach(() => { localStorage.clear() })

  it('test_getFavorites_empty_by_default', () => {
    expect(getFavorites()).toEqual([])
  })

  it('test_isFavorite_false_by_default', () => {
    expect(isFavorite('test-game')).toBe(false)
  })

  it('test_toggleFavorite_adds', () => {
    const result = toggleFavorite('test-game')
    expect(result).toBe(true)
    expect(isFavorite('test-game')).toBe(true)
  })

  it('test_toggleFavorite_removes', () => {
    toggleFavorite('test-game')
    const result = toggleFavorite('test-game')
    expect(result).toBe(false)
    expect(isFavorite('test-game')).toBe(false)
  })

  it('test_multiple_favorites', () => {
    toggleFavorite('game-a')
    toggleFavorite('game-b')
    const favs = getFavorites()
    expect(favs).toContain('game-a')
    expect(favs).toContain('game-b')
    expect(favs).toHaveLength(2)
  })

  it('test_favorites_persist_in_localStorage', () => {
    toggleFavorite('test-game')
    const raw = localStorage.getItem('cc-games-favorites')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toContain('test-game')
  })

  it('test_getFavorites_handles_corrupted', () => {
    localStorage.setItem('cc-games-favorites', 'NOT_JSON')
    expect(getFavorites()).toEqual([])
  })
})
