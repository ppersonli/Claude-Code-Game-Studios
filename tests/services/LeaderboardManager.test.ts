import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LeaderboardManager, type LeaderboardEntry } from '../../src/services/LeaderboardManager'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

describe('LeaderboardManager', () => {
  let lb: LeaderboardManager

  beforeEach(() => {
    localStorage.clear()
    lb = new LeaderboardManager({ gameSlug: 'test-game', maxEntries: 5 })
    delete (window as any).CrazyGames
  })

  // ─── Constructor ─────────────────────────────────────────────────

  describe('constructor', () => {
    it('test_default_max_entries', () => {
      const mgr = new LeaderboardManager({ gameSlug: 'x' })
      // Default is 10, submit 11 scores
      for (let i = 0; i < 11; i++) mgr.submitScore(i)
      const entries = mgr.getTopScores()
      expect(entries).toHaveLength(10)
    })
    it('test_custom_max_entries', () => {
      const entries = lb.getTopScores()
      expect(entries).toHaveLength(0)
    })
  })

  // ─── Submit score ────────────────────────────────────────────────

  describe('submitScore', () => {
    it('test_stores_score_locally', async () => {
      await lb.submitScore(100)
      const entries = lb.getTopScores()
      expect(entries).toHaveLength(1)
      expect(entries[0].score).toBe(100)
    })

    it('test_stores_multiple_scores', async () => {
      await lb.submitScore(100)
      await lb.submitScore(200)
      await lb.submitScore(150)
      const entries = lb.getTopScores()
      expect(entries).toHaveLength(3)
    })

    it('test_scores_sorted_descending', async () => {
      await lb.submitScore(100)
      await lb.submitScore(300)
      await lb.submitScore(200)
      const entries = lb.getTopScores()
      expect(entries[0].score).toBe(300)
      expect(entries[1].score).toBe(200)
      expect(entries[2].score).toBe(100)
    })

    it('test_trims_to_max_entries', async () => {
      for (let i = 1; i <= 8; i++) await lb.submitScore(i * 100)
      const entries = lb.getTopScores()
      expect(entries).toHaveLength(5)
      expect(entries[0].score).toBe(800)
    })

    it('test_returns_true', async () => {
      const result = await lb.submitScore(50)
      expect(result).toBe(true)
    })

    it('test_timestamp_is_set', async () => {
      const before = Date.now()
      await lb.submitScore(100)
      const entries = lb.getTopScores()
      expect(entries[0].timestamp).toBeGreaterThanOrEqual(before)
    })
  })

  // ─── Get scores ──────────────────────────────────────────────────

  describe('getTopScores', () => {
    it('test_empty_by_default', () => {
      expect(lb.getTopScores()).toEqual([])
    })

    it('test_returns_all_stored', async () => {
      await lb.submitScore(100)
      await lb.submitScore(200)
      expect(lb.getTopScores()).toHaveLength(2)
    })
  })

  describe('getBestScore', () => {
    it('test_zero_by_default', () => {
      expect(lb.getBestScore()).toBe(0)
    })

    it('test_returns_highest', async () => {
      await lb.submitScore(100)
      await lb.submitScore(300)
      await lb.submitScore(200)
      expect(lb.getBestScore()).toBe(300)
    })
  })

  describe('isHighScore', () => {
    it('test_true_when_empty', () => {
      expect(lb.isHighScore(100)).toBe(true)
    })

    it('test_true_when_below_max', async () => {
      await lb.submitScore(100)
      await lb.submitScore(200)
      expect(lb.isHighScore(250)).toBe(true)
    })

    it('test_true_when_better_than_worst', async () => {
      for (let i = 1; i <= 5; i++) await lb.submitScore(i * 100)
      expect(lb.isHighScore(600)).toBe(true)
    })

    it('test_false_when_worse_than_all', async () => {
      for (let i = 1; i <= 5; i++) await lb.submitScore(i * 100)
      expect(lb.isHighScore(50)).toBe(false)
    })

    it('test_true_when_not_full', async () => {
      await lb.submitScore(100)
      expect(lb.isHighScore(50)).toBe(true) // room for more entries
    })
  })

  // ─── Reset ───────────────────────────────────────────────────────

  describe('reset', () => {
    it('test_clears_all_scores', async () => {
      await lb.submitScore(100)
      await lb.submitScore(200)
      lb.reset()
      expect(lb.getTopScores()).toEqual([])
      expect(lb.getBestScore()).toBe(0)
    })
  })

  // ─── CG SDK integration ──────────────────────────────────────────

  describe('CrazyGames SDK', () => {
    it('test_submits_to_cg_when_available', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      ;(window as any).CrazyGames = {
        SDK: { user: { submitScore: mockSubmit } },
      }
      const lb = new LeaderboardManager({ gameSlug: 'test' })
      await lb.submitScore(500)
      expect(mockSubmit).toHaveBeenCalledWith({ score: 500, encryptedScore: '500' })
    })

    it('test_stores_locally_even_with_cg', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined)
      ;(window as any).CrazyGames = {
        SDK: { user: { submitScore: mockSubmit } },
      }
      const lb = new LeaderboardManager({ gameSlug: 'test' })
      await lb.submitScore(500)
      expect(lb.getBestScore()).toBe(500)
    })

    it('test_cg_failure_does_not_break', async () => {
      ;(window as any).CrazyGames = {
        SDK: { user: { submitScore: vi.fn().mockRejectedValue(new Error('fail')) } },
      }
      const lb = new LeaderboardManager({ gameSlug: 'test' })
      const result = await lb.submitScore(500)
      expect(result).toBe(true)
      expect(lb.getBestScore()).toBe(500)
    })
  })
})
