import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LevelManager } from '../../src/games/color-chaos/services/LevelManager'
import { SkinManager } from '../../src/games/color-chaos/services/SkinManager'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// ===== LevelManager =====

describe('LevelManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getDifficultyRange', () => {
    it('test_levelManager_range_clamps_low', () => {
      const range = LevelManager.getDifficultyRange(0)
      expect(range.colorCount).toBe(3)
    })

    it('test_levelManager_range_clamps_high', () => {
      const range = LevelManager.getDifficultyRange(200)
      expect(range.colorCount).toBe(9)
    })

    it('test_levelManager_range_level1', () => {
      const range = LevelManager.getDifficultyRange(1)
      expect(range.colorCount).toBe(3)
      expect(range.tubeCapacity).toBe(4)
      expect(range.emptyTubes).toBe(2)
    })

    it('test_levelManager_range_level15', () => {
      const range = LevelManager.getDifficultyRange(15)
      expect(range.colorCount).toBe(4)
    })

    it('test_levelManager_range_level50', () => {
      const range = LevelManager.getDifficultyRange(50)
      expect(range.colorCount).toBe(5)
    })

    it('test_levelManager_range_level75', () => {
      const range = LevelManager.getDifficultyRange(75)
      expect(range.colorCount).toBe(7)
    })

    it('test_levelManager_range_level100', () => {
      const range = LevelManager.getDifficultyRange(100)
      expect(range.colorCount).toBe(9)
    })
  })

  describe('getColorCountForLevel', () => {
    it('test_levelManager_colors_level1_is_3', () => {
      expect(LevelManager.getColorCountForLevel(1)).toBe(3)
    })

    it('test_levelManager_colors_level10_is_3', () => {
      expect(LevelManager.getColorCountForLevel(10)).toBe(3)
    })

    it('test_levelManager_colors_level11_is_4', () => {
      expect(LevelManager.getColorCountForLevel(11)).toBe(4)
    })

    it('test_levelManager_colors_level25_is_4', () => {
      expect(LevelManager.getColorCountForLevel(25)).toBe(4)
    })

    it('test_levelManager_colors_level26_is_5', () => {
      expect(LevelManager.getColorCountForLevel(26)).toBe(5)
    })

    it('test_levelManager_colors_level50_interpolates', () => {
      const colors = LevelManager.getColorCountForLevel(50)
      expect(colors).toBeGreaterThanOrEqual(5)
      expect(colors).toBeLessThanOrEqual(6)
    })

    it('test_levelManager_colors_level76_is_9', () => {
      expect(LevelManager.getColorCountForLevel(76)).toBe(9)
    })

    it('test_levelManager_colors_level100_is_12', () => {
      expect(LevelManager.getColorCountForLevel(100)).toBe(12)
    })
  })

  describe('getOptimalMoves', () => {
    it('test_levelManager_optimal_formula', () => {
      // Level 1: 3 colors → 3*2+1 = 7
      expect(LevelManager.getOptimalMoves(1)).toBe(7)
    })

    it('test_levelManager_optimal_increases_with_level', () => {
      const opt1 = LevelManager.getOptimalMoves(1)
      const opt100 = LevelManager.getOptimalMoves(100)
      expect(opt100).toBeGreaterThan(opt1)
    })
  })

  describe('calculateStars', () => {
    it('test_levelManager_3stars_when_at_optimal', () => {
      const optimal = LevelManager.getOptimalMoves(1)
      expect(LevelManager.calculateStars(optimal, 1)).toBe(3)
    })

    it('test_levelManager_3stars_when_below_optimal', () => {
      const optimal = LevelManager.getOptimalMoves(1)
      expect(LevelManager.calculateStars(optimal - 1, 1)).toBe(3)
    })

    it('test_levelManager_2stars_when_moderate', () => {
      const optimal = LevelManager.getOptimalMoves(1) // 7
      // 2 stars: moves <= floor(7 * 1.5) = 10
      expect(LevelManager.calculateStars(10, 1)).toBe(2)
    })

    it('test_levelManager_1star_when_many_moves', () => {
      expect(LevelManager.calculateStars(100, 1)).toBe(1)
    })
  })

  describe('getMaxReasonableMoves', () => {
    it('test_levelManager_maxReasonable_is_3x_optimal', () => {
      const optimal = LevelManager.getOptimalMoves(1)
      expect(LevelManager.getMaxReasonableMoves(1)).toBe(optimal * 3)
    })
  })

  describe('getNextLevel', () => {
    it('test_levelManager_nextLevel_increments', () => {
      expect(LevelManager.getNextLevel(1)).toBe(2)
    })

    it('test_levelManager_nextLevel_null_at_100', () => {
      expect(LevelManager.getNextLevel(100)).toBeNull()
    })
  })

  describe('isLevelUnlocked', () => {
    it('test_levelManager_level1_always_unlocked', () => {
      expect(LevelManager.isLevelUnlocked(1, new Map())).toBe(true)
    })

    it('test_levelManager_level2_needs_level1_complete', () => {
      const progress = new Map()
      expect(LevelManager.isLevelUnlocked(2, progress)).toBe(false)
      progress.set(1, { completed: true, stars: 3, bestMoves: 5 })
      expect(LevelManager.isLevelUnlocked(2, progress)).toBe(true)
    })
  })

  describe('getHighestUnlockedLevel', () => {
    it('test_levelManager_highest_starts_at_1', () => {
      expect(LevelManager.getHighestUnlockedLevel(new Map())).toBe(1)
    })

    it('test_levelManager_highest_with_progress', () => {
      const progress = new Map()
      progress.set(1, { completed: true, stars: 3, bestMoves: 5 })
      progress.set(2, { completed: true, stars: 2, bestMoves: 8 })
      expect(LevelManager.getHighestUnlockedLevel(progress)).toBe(3)
    })
  })

  describe('persistence', () => {
    it('test_levelManager_saveLevelProgress_persists', () => {
      const result = LevelManager.saveLevelProgress(1, 7)
      expect(result.completed).toBe(true)
      expect(result.stars).toBe(3) // 7 <= optimal(7)

      const loaded = LevelManager.loadProgress()
      expect(loaded.get(1)?.bestMoves).toBe(7)
    })

    it('test_levelProgress_bestMoves_keeps_minimum', () => {
      LevelManager.saveLevelProgress(1, 10)
      LevelManager.saveLevelProgress(1, 5)
      const loaded = LevelManager.loadProgress()
      expect(loaded.get(1)?.bestMoves).toBe(5)
    })

    it('test_levelProgress_stars_keeps_max', () => {
      LevelManager.saveLevelProgress(1, 50) // 1 star
      LevelManager.saveLevelProgress(1, 7)  // 3 stars
      const loaded = LevelManager.loadProgress()
      expect(loaded.get(1)?.stars).toBe(3)
    })

    it('test_levelManager_loadProgress_handles_empty', () => {
      const progress = LevelManager.loadProgress()
      expect(progress.size).toBe(0)
    })

    it('test_levelManager_loadProgress_handles_corrupted', () => {
      localStorage.setItem('color-chaos-progress', 'NOT_JSON')
      const progress = LevelManager.loadProgress()
      expect(progress.size).toBe(0)
    })

    it('test_levelManager_saveLoadCurrentLevel', () => {
      LevelManager.saveCurrentLevel(5)
      expect(LevelManager.loadCurrentLevel()).toBe(5)
    })

    it('test_levelManager_loadCurrentLevel_handles_invalid', () => {
      localStorage.setItem('color-chaos-current-level', 'abc')
      expect(LevelManager.loadCurrentLevel()).toBe(1)
    })

    it('test_levelManager_loadCurrentLevel_out_of_range', () => {
      localStorage.setItem('color-chaos-current-level', '200')
      expect(LevelManager.loadCurrentLevel()).toBe(1)
    })

    it('test_levelManager_resetProgress_clears_all', () => {
      LevelManager.saveLevelProgress(1, 7)
      LevelManager.saveCurrentLevel(5)
      LevelManager.resetProgress()
      expect(LevelManager.loadProgress().size).toBe(0)
      expect(LevelManager.loadCurrentLevel()).toBe(1)
    })

    it('test_levelManager_getEmptyTubeCountForLevel_always_2', () => {
      expect(LevelManager.getEmptyTubeCountForLevel(1)).toBe(2)
      expect(LevelManager.getEmptyTubeCountForLevel(100)).toBe(2)
    })

    it('test_levelManager_getTubeCapacityForLevel_always_4', () => {
      expect(LevelManager.getTubeCapacityForLevel(1)).toBe(4)
      expect(LevelManager.getTubeCapacityForLevel(100)).toBe(4)
    })

    it('test_levelManager_generateLevel_returns_valid', () => {
      const config = LevelManager.generateLevel(1)
      expect(config.tubeCount).toBe(5) // 3 colors + 2 empty
      expect(config.tubeCapacity).toBe(4)
      expect(config.colorCount).toBeGreaterThanOrEqual(1)
    })
  })
})

// ===== SkinManager =====

describe('SkinManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('ticket balance', () => {
    it('test_skinManager_starts_with_zero_tickets', () => {
      expect(SkinManager.getTicketBalance()).toBe(0)
    })

    it('test_skinManager_addTickets_increases_balance', () => {
      const newBal = SkinManager.addTickets(5)
      expect(newBal).toBe(5)
      expect(SkinManager.getTicketBalance()).toBe(5)
    })

    it('test_skinManager_addTickets_negative_is_noop', () => {
      SkinManager.addTickets(10)
      SkinManager.addTickets(-5)
      expect(SkinManager.getTicketBalance()).toBe(10)
    })

    it('test_skinManager_spendTickets_deducts', () => {
      SkinManager.addTickets(10)
      expect(SkinManager.spendTickets(3)).toBe(true)
      expect(SkinManager.getTicketBalance()).toBe(7)
    })

    it('test_skinManager_spendTickets_insufficient_returns_false', () => {
      SkinManager.addTickets(5)
      expect(SkinManager.spendTickets(10)).toBe(false)
      expect(SkinManager.getTicketBalance()).toBe(5)
    })

    it('test_skinManager_spendTickets_zero_returns_false', () => {
      SkinManager.addTickets(10)
      expect(SkinManager.spendTickets(0)).toBe(false)
    })

    it('test_skinManager_tickets_persist_across_calls', () => {
      SkinManager.addTickets(10)
      SkinManager.addTickets(5)
      expect(SkinManager.getTicketBalance()).toBe(15)
    })
  })

  describe('calculateTicketsForStars', () => {
    it('test_skinManager_tickets_for_0_stars', () => {
      expect(SkinManager.calculateTicketsForStars(0)).toBe(0)
    })

    it('test_skinManager_tickets_for_1_star', () => {
      expect(SkinManager.calculateTicketsForStars(1)).toBe(1)
    })

    it('test_skinManager_tickets_for_3_stars', () => {
      expect(SkinManager.calculateTicketsForStars(3)).toBe(3)
    })

    it('test_skinManager_tickets_for_negative_stars', () => {
      expect(SkinManager.calculateTicketsForStars(-1)).toBe(0)
    })

    it('test_skinManager_tickets_floor_fractional', () => {
      expect(SkinManager.calculateTicketsForStars(2.7)).toBe(2)
    })
  })

  describe('skin management', () => {
    it('test_skinManager_classic_unlocked_by_default', () => {
      expect(SkinManager.isSkinUnlocked('classic')).toBe(true)
    })

    it('test_skinManager_other_skins_locked_by_default', () => {
      expect(SkinManager.isSkinUnlocked('ocean-deep')).toBe(false)
    })

    it('test_skinManager_purchase_deducts_tickets', () => {
      SkinManager.addTickets(20)
      const result = SkinManager.purchaseSkin('ocean-deep')
      expect(result.success).toBe(true)
      expect(SkinManager.getTicketBalance()).toBe(10) // 20 - 10
      expect(SkinManager.isSkinUnlocked('ocean-deep')).toBe(true)
    })

    it('test_skinManager_purchase_insufficient_funds', () => {
      SkinManager.addTickets(5)
      const result = SkinManager.purchaseSkin('ocean-deep') // costs 10
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Insufficient tickets')
      expect(SkinManager.isSkinUnlocked('ocean-deep')).toBe(false)
    })

    it('test_skinManager_purchase_already_owned', () => {
      SkinManager.addTickets(100)
      SkinManager.purchaseSkin('ocean-deep')
      const result = SkinManager.purchaseSkin('ocean-deep')
      expect(result.success).toBe(false)
      expect(result.reason).toBe('Already owned')
    })

    it('test_skinManager_equip_skin', () => {
      expect(SkinManager.equipSkin('ocean-deep')).toBe(false) // not unlocked
      SkinManager.addTickets(10)
      SkinManager.purchaseSkin('ocean-deep')
      expect(SkinManager.equipSkin('ocean-deep')).toBe(true)
      expect(SkinManager.getEquippedSkinId()).toBe('ocean-deep')
    })

    it('test_skinManager_getEquippedSkin_returns_skin_object', () => {
      const skin = SkinManager.getEquippedSkin()
      expect(skin.id).toBe('classic')
    })

    it('test_skinManager_resetSkins_clears_all', () => {
      SkinManager.addTickets(100)
      SkinManager.purchaseSkin('ocean-deep')
      SkinManager.resetSkins()
      expect(SkinManager.getTicketBalance()).toBe(0)
      expect(SkinManager.isSkinUnlocked('ocean-deep')).toBe(false)
      expect(SkinManager.getEquippedSkinId()).toBe('classic')
    })

    it('test_skinManager_handles_corrupted_skin_data', () => {
      localStorage.setItem('color-chaos-skins', 'BROKEN_JSON')
      expect(SkinManager.getEquippedSkinId()).toBe('classic')
      expect(SkinManager.getUnlockedSkins()).toContain('classic')
    })
  })
})
