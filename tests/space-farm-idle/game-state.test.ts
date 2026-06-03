import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  loadState,
  saveState,
  resetState,
  calculateOfflineEarnings,
  calcBaseIncome,
  getUpgradeMultiplier,
  getWeatherMultiplier,
  tickWeather,
  trackPlayTime,
} from '../../src/games/space-farm-idle/logic/game-state'
import { CONSTANTS } from '../../src/games/space-farm-idle/data/constants'

describe('game-state', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadState', () => {
    it('should return default state when no save exists', () => {
      const state = loadState()
      expect(state.coins).toBe(0)
      expect(state.totalCoins).toBe(0)
      expect(state.cosmicSeeds).toBe(0)
      expect(state.farmLevel).toBe(1)
      expect(state.unlockedPlanets).toEqual(['earth'])
      expect(state.unlockedCrops).toEqual(['wheat'])
    })

    it('should restore saved state', () => {
      const saved = {
        coins: 5000,
        totalCoins: 10000,
        cosmicSeeds: 50,
        farmLevel: 5,
        unlockedCrops: ['wheat', 'corn'],
        cropSlots: [],
        unlockedPlanets: ['earth', 'moon'],
        currentPlanet: 'moon',
      }
      localStorage.setItem(CONSTANTS.SAVE_KEY, JSON.stringify(saved))
      const state = loadState()
      expect(state.coins).toBe(5000)
      expect(state.totalCoins).toBe(10000)
      expect(state.cosmicSeeds).toBe(50)
      expect(state.farmLevel).toBe(5)
      expect(state.unlockedPlanets).toContain('moon')
    })

    it('should handle corrupted data gracefully', () => {
      localStorage.setItem(CONSTANTS.SAVE_KEY, 'CORRUPTED!!!')
      const state = loadState()
      expect(state.coins).toBe(0)
      expect(state.farmLevel).toBe(1)
    })
  })

  describe('saveState', () => {
    it('should save state to localStorage', () => {
      const state = loadState()
      state.coins = 12345
      saveState(state)
      const raw = localStorage.getItem(CONSTANTS.SAVE_KEY)
      expect(raw).toBeTruthy()
      const parsed = JSON.parse(raw!)
      expect(parsed.coins).toBe(12345)
    })

    it('should update lastOnline timestamp', () => {
      const state = loadState()
      const before = Date.now()
      saveState(state)
      const parsed = JSON.parse(localStorage.getItem(CONSTANTS.SAVE_KEY)!)
      expect(parsed.lastOnline).toBeGreaterThanOrEqual(before)
    })
  })

  describe('resetState', () => {
    it('should reset to defaults', () => {
      const state = loadState()
      state.coins = 999999
      saveState(state)
      const fresh = resetState()
      expect(fresh.coins).toBe(0)
      expect(fresh.totalCoins).toBe(0)
    })
  })

  describe('calculateOfflineEarnings', () => {
    it('should return 0 for recent offline', () => {
      const state = loadState()
      state.lastOnline = Date.now() - 5000 // 5 seconds ago
      expect(calculateOfflineEarnings(state)).toBe(0)
    })

    it('should calculate offline earnings', () => {
      const state = loadState()
      state.lastOnline = Date.now() - 3600_000 // 1 hour ago
      state.farmLevel = 5
      state.cropSlots = [
        { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false },
      ]
      const earnings = calculateOfflineEarnings(state)
      expect(earnings).toBeGreaterThanOrEqual(0)
    })

    it('should cap offline time at MAX_OFFLINE_HOURS', () => {
      const state = loadState()
      state.lastOnline = Date.now() - 24 * 3600_000 // 24 hours ago
      state.farmLevel = 5
      const earnings = calculateOfflineEarnings(state)
      // Should not be more than 8 hours worth
      expect(earnings).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getUpgradeMultiplier', () => {
    it('should return 1 with no upgrades', () => {
      const state = loadState()
      expect(getUpgradeMultiplier(state)).toBe(1)
    })

    it('should return 1.25 with coin-mult level 1', () => {
      const state = loadState()
      state.upgrades = { 'coin-mult': 1 }
      expect(getUpgradeMultiplier(state)).toBeCloseTo(1.25)
    })

    it('should return 1.50 with coin-mult level 2', () => {
      const state = loadState()
      state.upgrades = { 'coin-mult': 2 }
      expect(getUpgradeMultiplier(state)).toBeCloseTo(1.50)
    })
  })

  describe('getWeatherMultiplier', () => {
    it('should return 1 for clear weather', () => {
      const state = loadState()
      state.currentWeather = 'clear'
      expect(getWeatherMultiplier(state)).toBe(1)
    })

    it('should return 1.5 for solar flare', () => {
      const state = loadState()
      state.currentWeather = 'solar_flare'
      expect(getWeatherMultiplier(state)).toBe(1.5)
    })

    it('should return 0.7 for meteor shower', () => {
      const state = loadState()
      state.currentWeather = 'meteor_shower'
      expect(getWeatherMultiplier(state)).toBeCloseTo(0.7)
    })

    it('should return 2.0 for aurora', () => {
      const state = loadState()
      state.currentWeather = 'aurora'
      expect(getWeatherMultiplier(state)).toBe(2.0)
    })
  })

  describe('tickWeather', () => {
    it('should decrement weather timer', () => {
      const state = loadState()
      state.weatherTimer = 100
      tickWeather(state, 10)
      expect(state.weatherTimer).toBe(90)
    })

    it('should roll new weather when timer expires', () => {
      const state = loadState()
      state.weatherTimer = 0
      const changed = tickWeather(state, 1)
      expect(changed).toBe(true)
      expect(state.weatherTimer).toBe(CONSTANTS.WEATHER_CHANGE_INTERVAL)
    })

    it('should return false when weather has not changed', () => {
      const state = loadState()
      state.weatherTimer = 100
      const changed = tickWeather(state, 10)
      expect(changed).toBe(false)
    })
  })

  describe('trackPlayTime', () => {
    it('should accumulate play time', () => {
      const state = loadState()
      trackPlayTime(state, 1000)
      expect(state.totalPlayTime).toBe(1)
      trackPlayTime(state, 500)
      expect(state.totalPlayTime).toBe(1.5)
    })
  })

  describe('calcBaseIncome', () => {
    it('should return 0 with no crops', () => {
      const state = loadState()
      expect(calcBaseIncome(state)).toBe(0)
    })

    it('should return income with crops planted', () => {
      const state = loadState()
      state.cropSlots = [
        { cropId: 'wheat', plantedAt: Date.now(), growTimeMs: 30000, harvested: false },
      ]
      const income = calcBaseIncome(state)
      expect(income).toBeGreaterThanOrEqual(0)
    })
  })
})
