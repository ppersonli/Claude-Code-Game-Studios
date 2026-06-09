import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SaveSystem, createDefaultSaveData } from '../../src/games/runway-fashion/systems/SaveSystem'

describe('SaveSystem', () => {
  let system: SaveSystem
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value }),
      removeItem: vi.fn((key: string) => { delete store[key] }),
      clear: vi.fn(() => { store = {} }),
    })
    system = new SaveSystem()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createDefaultSaveData', () => {
    it('should create default save data with correct values', () => {
      const data = createDefaultSaveData()
      expect(data.coins).toBe(0)
      expect(data.highScore).toBe(0)
      expect(data.playerLevel).toBe(1)
      expect(data.collectedClothing).toEqual([])
      expect(data.totalGamesPlayed).toBe(0)
      expect(data.gradeCount).toEqual({ S: 0, A: 0, B: 0, C: 0, D: 0 })
    })
  })

  describe('load', () => {
    it('should return defaults when no save exists', () => {
      const data = system.load()
      expect(data).toEqual(createDefaultSaveData())
    })

    it('should load saved data', () => {
      const saveData = createDefaultSaveData()
      saveData.coins = 1000
      saveData.highScore = 500
      store['runway-fashion-save'] = JSON.stringify(saveData)

      const loaded = system.load()
      expect(loaded.coins).toBe(1000)
      expect(loaded.highScore).toBe(500)
    })

    it('should handle corrupt JSON gracefully', () => {
      store['runway-fashion-save'] = 'not valid json{{{'
      const data = system.load()
      expect(data).toEqual(createDefaultSaveData())
    })

    it('should handle non-object JSON gracefully', () => {
      store['runway-fashion-save'] = JSON.stringify('string')
      const data = system.load()
      expect(data).toEqual(createDefaultSaveData())
    })

    it('should merge with defaults for missing fields', () => {
      store['runway-fashion-save'] = JSON.stringify({ coins: 500 })
      const data = system.load()
      expect(data.coins).toBe(500)
      expect(data.highScore).toBe(0) // default
      expect(data.playerLevel).toBe(1) // default
      expect(data.collectedClothing).toEqual([]) // default
    })

    it('should handle missing gradeCount gracefully', () => {
      store['runway-fashion-save'] = JSON.stringify({ coins: 100, gradeCount: undefined })
      const data = system.load()
      expect(data.gradeCount).toEqual({ S: 0, A: 0, B: 0, C: 0, D: 0 })
    })
  })

  describe('save', () => {
    it('should persist data to localStorage', () => {
      const data = createDefaultSaveData()
      data.coins = 200
      system.save(data)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'runway-fashion-save',
        JSON.stringify(data),
      )
    })

    it('should handle localStorage quota exceeded', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const data = createDefaultSaveData()
      // Should not throw
      expect(() => system.save(data)).not.toThrow()
    })
  })

  describe('addCoins', () => {
    it('should add coins to balance', () => {
      system.addCoins(100)
      const data = system.load()
      expect(data.coins).toBe(100)
    })

    it('should accumulate coins across calls', () => {
      system.addCoins(100)
      system.addCoins(200)
      system.addCoins(50)
      const data = system.load()
      expect(data.coins).toBe(350)
    })
  })

  describe('updateHighScore', () => {
    it('should set high score when higher than current', () => {
      system.updateHighScore(500)
      const data = system.load()
      expect(data.highScore).toBe(500)
    })

    it('should not update when new score is lower', () => {
      system.updateHighScore(500)
      system.updateHighScore(300)
      const data = system.load()
      expect(data.highScore).toBe(500)
    })

    it('should not update when new score equals current', () => {
      system.updateHighScore(500)
      system.updateHighScore(500)
      const data = system.load()
      expect(data.highScore).toBe(500)
    })
  })

  describe('unlockClothing', () => {
    it('should add clothing id to collected list', () => {
      system.unlockClothing('top_tshirt')
      const data = system.load()
      expect(data.collectedClothing).toContain('top_tshirt')
    })

    it('should be idempotent (not duplicate)', () => {
      system.unlockClothing('top_tshirt')
      system.unlockClothing('top_tshirt')
      const data = system.load()
      expect(data.collectedClothing.filter(id => id === 'top_tshirt')).toHaveLength(1)
    })

    it('should allow multiple different clothing items', () => {
      system.unlockClothing('top_tshirt')
      system.unlockClothing('bottom_skirt')
      const data = system.load()
      expect(data.collectedClothing).toHaveLength(2)
    })
  })

  describe('isClothingCollected', () => {
    it('should return false for uncollected item', () => {
      expect(system.isClothingCollected('top_tshirt')).toBe(false)
    })

    it('should return true for collected item', () => {
      system.unlockClothing('top_tshirt')
      expect(system.isClothingCollected('top_tshirt')).toBe(true)
    })
  })

  describe('recordGamePlayed', () => {
    it('should increment game count', () => {
      system.recordGamePlayed()
      const data = system.load()
      expect(data.totalGamesPlayed).toBe(1)
    })

    it('should accumulate across calls', () => {
      system.recordGamePlayed()
      system.recordGamePlayed()
      system.recordGamePlayed()
      const data = system.load()
      expect(data.totalGamesPlayed).toBe(3)
    })
  })

  describe('recordGrade', () => {
    it('should increment grade count', () => {
      system.recordGrade('S')
      const data = system.load()
      expect(data.gradeCount.S).toBe(1)
    })

    it('should track multiple grades independently', () => {
      system.recordGrade('S')
      system.recordGrade('A')
      system.recordGrade('S')
      const data = system.load()
      expect(data.gradeCount.S).toBe(2)
      expect(data.gradeCount.A).toBe(1)
      expect(data.gradeCount.B).toBe(0)
    })
  })

  describe('getPlayerLevel', () => {
    it('should return default level 1', () => {
      expect(system.getPlayerLevel()).toBe(1)
    })

    it('should return saved level', () => {
      const data = createDefaultSaveData()
      data.playerLevel = 5
      store['runway-fashion-save'] = JSON.stringify(data)
      expect(system.getPlayerLevel()).toBe(5)
    })
  })

  describe('reset', () => {
    it('should reset all save data to defaults', () => {
      system.addCoins(1000)
      system.updateHighScore(500)
      system.unlockClothing('top_tshirt')
      system.recordGamePlayed()
      system.recordGrade('S')

      system.reset()

      const data = system.load()
      expect(data).toEqual(createDefaultSaveData())
    })
  })
})
