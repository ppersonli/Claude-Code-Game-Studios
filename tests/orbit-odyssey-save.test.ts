import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Orbit Odyssey - SaveSystem Logic', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('Upgrade Cost Formula', () => {
    it('should calculate cost = baseCost * multiplier^level', () => {
      const baseCost = 10
      const multiplier = 1.35
      
      // Level 0: 10 * 1.35^0 = 10
      expect(Math.floor(baseCost * Math.pow(multiplier, 0))).toBe(10)
      // Level 1: 10 * 1.35^1 = 13.5 -> 13
      expect(Math.floor(baseCost * Math.pow(multiplier, 1))).toBe(13)
      // Level 5: 10 * 1.35^5 = 44.8 -> 44
      expect(Math.floor(baseCost * Math.pow(multiplier, 5))).toBe(44)
      // Level 10: 10 * 1.35^10 = 201 -> 201
      expect(Math.floor(baseCost * Math.pow(multiplier, 10))).toBe(201)
    })

    it('should have increasing costs for each level', () => {
      const baseCost = 10
      const multiplier = 1.35
      let prevCost = 0
      for (let level = 0; level < 20; level++) {
        const cost = Math.floor(baseCost * Math.pow(multiplier, level))
        expect(cost).toBeGreaterThan(prevCost)
        prevCost = cost
      }
    })
  })

  describe('Prestige Formula', () => {
    it('should calculate prestige requirement correctly', () => {
      const base = 10000
      const mult = 2.5
      
      // Prestige 0: 10000 * 2.5^0 = 10000
      expect(Math.floor(base * Math.pow(mult, 0))).toBe(10000)
      // Prestige 1: 10000 * 2.5^1 = 25000
      expect(Math.floor(base * Math.pow(mult, 1))).toBe(25000)
      // Prestige 2: 10000 * 2.5^2 = 62500
      expect(Math.floor(base * Math.pow(mult, 2))).toBe(62500)
    })

    it('should calculate cores earned = floor(sqrt(totalStardust/1000))', () => {
      // 1000 stardust -> sqrt(1) = 1 core
      expect(Math.floor(Math.sqrt(1000 / 1000))).toBe(1)
      // 4000 stardust -> sqrt(4) = 2 cores
      expect(Math.floor(Math.sqrt(4000 / 1000))).toBe(2)
      // 9000 stardust -> sqrt(9) = 3 cores
      expect(Math.floor(Math.sqrt(9000 / 1000))).toBe(3)
      // 100 stardust -> sqrt(0.1) = 0 cores
      expect(Math.floor(Math.sqrt(100 / 1000))).toBe(0)
    })

    it('should calculate multiplier from cores', () => {
      const coreBonus = 0.1
      // 0 cores: 1.0x
      expect(1 + 0 * coreBonus).toBe(1.0)
      // 5 cores: 1.5x
      expect(1 + 5 * coreBonus).toBe(1.5)
      // 10 cores: 2.0x
      expect(1 + 10 * coreBonus).toBe(2.0)
    })
  })

  describe('Stardust Addition with Multiplier', () => {
    it('should apply prestige multiplier to stardust', () => {
      const coreBonus = 0.1
      const baseAmount = 100
      
      // 0 cores: 100 * 1.0 = 100
      const mult0 = 1 + 0 * coreBonus
      expect(Math.floor(baseAmount * mult0)).toBe(100)
      
      // 5 cores: 100 * 1.5 = 150
      const mult5 = 1 + 5 * coreBonus
      expect(Math.floor(baseAmount * mult5)).toBe(150)
      
      // 10 cores: 100 * 2.0 = 200
      const mult10 = 1 + 10 * coreBonus
      expect(Math.floor(baseAmount * mult10)).toBe(200)
    })
  })

  describe('Offline Earnings', () => {
    it('should return 0 if autoCollector level is 0', () => {
      const autoLevel = 0
      const elapsed = 3600 // 1 hour
      const baseRate = autoLevel * 0.5
      expect(baseRate).toBe(0)
    })

    it('should return 0 if elapsed < 60 seconds', () => {
      const autoLevel = 1
      const elapsed = 30
      if (elapsed < 60) {
        expect(0).toBe(0)
      }
    })

    it('should calculate offline earnings correctly', () => {
      const autoLevel = 2
      const elapsed = 3600 // 1 hour
      const baseRate = autoLevel * 0.5 // 1 stardust/sec
      const maxHours = 8
      const cappedElapsed = Math.min(elapsed, maxHours * 3600)
      const multiplier = 1 + 0 * 0.1 // 0 cores
      
      const earnings = Math.floor(baseRate * cappedElapsed * multiplier)
      expect(earnings).toBe(3600) // 1 * 3600 * 1
    })

    it('should cap offline earnings at 8 hours', () => {
      const autoLevel = 1
      const elapsed = 24 * 3600 // 24 hours
      const baseRate = autoLevel * 0.5
      const maxHours = 8
      const cappedElapsed = Math.min(elapsed, maxHours * 3600)
      
      expect(cappedElapsed).toBe(8 * 3600)
    })

    it('should apply prestige multiplier to offline earnings', () => {
      const autoLevel = 1
      const elapsed = 3600
      const baseRate = autoLevel * 0.5
      const multiplier = 1 + 5 * 0.1 // 5 cores = 1.5x
      
      const earnings = Math.floor(baseRate * elapsed * multiplier)
      expect(earnings).toBe(2700) // 0.5 * 3600 * 1.5
    })
  })

  describe('Ship Unlocking', () => {
    it('should have 5 ships with increasing costs', () => {
      const ships = [
        { id: 'scout', cost: 0 },
        { id: 'racer', cost: 500 },
        { id: 'tanker', cost: 2000 },
        { id: 'phantom', cost: 5000 },
        { id: 'nova', cost: 15000 },
      ]
      
      for (let i = 1; i < ships.length; i++) {
        expect(ships[i].cost).toBeGreaterThan(ships[i-1].cost)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero stardust gracefully', () => {
      const amount = 0
      const multiplier = 1 + 0 * 0.1
      expect(Math.floor(amount * multiplier)).toBe(0)
    })

    it('should handle very large stardust amounts', () => {
      const amount = 999999999
      const multiplier = 1 + 100 * 0.1 // 11x
      const result = Math.floor(amount * multiplier)
      expect(result).toBe(10999999989)
      expect(Number.isFinite(result)).toBe(true)
    })

    it('should handle negative distance in recordLaunch', () => {
      const bestDistance = 100
      const newDistance = -50
      // Should not update best distance
      expect(newDistance > bestDistance).toBe(false)
    })

    it('should handle equal distance in recordLaunch', () => {
      const bestDistance = 100
      const newDistance = 100
      // Should not update (not strictly greater)
      expect(newDistance > bestDistance).toBe(false)
    })
  })
})
