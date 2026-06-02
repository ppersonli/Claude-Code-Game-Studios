/**
 * SaveSystem — comprehensive unit tests
 * Covers: save/load, stardust with prestige multiplier, upgrade costs,
 *         purchaseUpgrade, unlockShip, prestige, offline earnings, edge cases
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SaveSystem, type PlayerState } from '../../src/games/orbit-odyssey/systems/SaveSystem'
import { GAME_CONFIG } from '../../src/games/orbit-odyssey/config'

const SAVE_KEY = 'orbit-odyssey-save'

/** Write a clean default state so tests don't leak across runs */
function resetLocalStorage() {
  const fresh: PlayerState = {
    stardust: 0, crystals: 0, plasma: 0, voidEssence: 0, stardustTotal: 0,
    upgrades: { launchPower: 0, fuelCapacity: 0, gravityResist: 0, stardustMagnet: 0, autoCollector: 0 },
    unlockedShips: ['scout'], activeShip: 'scout', unlockedSystems: ['sol'],
    prestigeCount: 0, prestigeCores: 0, totalLaunches: 0, bestDistance: 0, totalPlayTime: 0,
    lastOnline: Date.now(), dailyStreak: 0, lastDailyDate: '', dailyChallengesCompleted: [],
    createdAt: Date.now(),
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(fresh))
}

beforeEach(() => {
  resetLocalStorage()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Constructor & Initial State ─────────────────────────
describe('SaveSystem constructor', () => {
  it('should create with default state when no save exists', () => {
    localStorage.removeItem(SAVE_KEY)
    const ss = new SaveSystem()
    const state = ss.getState()
    expect(state.stardust).toBe(0)
    expect(state.prestigeCores).toBe(0)
    expect(state.prestigeCount).toBe(0)
    expect(state.totalLaunches).toBe(0)
    expect(state.bestDistance).toBe(0)
    expect(state.unlockedShips).toEqual(['scout'])
    expect(state.activeShip).toBe('scout')
    expect(state.unlockedSystems).toEqual(['sol'])
  })

  it('should load saved state from localStorage', () => {
    const saved = {
      stardust: 500, prestigeCores: 3, crystals: 0, plasma: 0, voidEssence: 0,
      stardustTotal: 500, upgrades: { launchPower: 0, fuelCapacity: 0, gravityResist: 0, stardustMagnet: 0, autoCollector: 0 },
      unlockedShips: ['scout'], activeShip: 'scout', unlockedSystems: ['sol'],
      prestigeCount: 0, totalLaunches: 0, bestDistance: 0, totalPlayTime: 0,
      lastOnline: Date.now(), dailyStreak: 0, lastDailyDate: '', dailyChallengesCompleted: [],
      createdAt: Date.now(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved))

    const ss = new SaveSystem()
    expect(ss.getState().stardust).toBe(500)
    expect(ss.getState().prestigeCores).toBe(3)
  })

  it('should handle corrupted save data gracefully', () => {
    localStorage.setItem(SAVE_KEY, 'NOT VALID JSON{{{')
    const ss = new SaveSystem()
    expect(ss.getState().stardust).toBe(0)
    expect(ss.getState().unlockedShips).toEqual(['scout'])
  })

  it('should merge saved data with defaults (missing fields)', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ stardust: 100 }))
    const ss = new SaveSystem()
    expect(ss.getState().stardust).toBe(100)
    expect(ss.getState().unlockedShips).toEqual(['scout'])
    expect(ss.getState().prestigeCores).toBe(0)
  })
})

// ─── Stardust & Prestige Multiplier ──────────────────────
describe('addStardust', () => {
  it('should add stardust without prestige multiplier', () => {
    const ss = new SaveSystem()
    ss.addStardust(100)
    expect(ss.getState().stardust).toBe(100)
    expect(ss.getState().stardustTotal).toBe(100)
  })

  it('should apply prestige multiplier correctly', () => {
    const ss = new SaveSystem()
    ss.updateState({ prestigeCores: 5 })
    // Multiplier = 1 + 5 * 0.1 = 1.5
    ss.addStardust(100)
    expect(ss.getState().stardust).toBe(150)
    expect(ss.getState().stardustTotal).toBe(150)
  })

  it('should floor the result (no fractional stardust)', () => {
    const ss = new SaveSystem()
    ss.updateState({ prestigeCores: 3 }) // multiplier = 1.3
    ss.addStardust(7) // 7 * 1.3 = 9.1 → 9
    expect(ss.getState().stardust).toBe(9)
  })

  it('should accumulate stardustTotal across multiple adds', () => {
    const ss = new SaveSystem()
    ss.addStardust(50)
    ss.addStardust(30)
    ss.addStardust(20)
    expect(ss.getState().stardustTotal).toBe(100)
  })

  it('should save to localStorage after each add', () => {
    const ss = new SaveSystem()
    ss.addStardust(100)
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)
    expect(saved.stardust).toBe(100)
  })
})

// ─── Upgrade Costs ───────────────────────────────────────
describe('upgrade cost formula', () => {
  it('should calculate cost as baseCost * multiplier^level', () => {
    const ss = new SaveSystem()
    const cost0 = ss.getUpgradeCost('launchPower')
    expect(cost0).toBe(10) // 10 * 1.35^0 = 10

    ss.updateState({ upgrades: { ...ss.getState().upgrades, launchPower: 1 } })
    const cost1 = ss.getUpgradeCost('launchPower')
    expect(cost1).toBe(Math.floor(10 * 1.35)) // 13

    ss.updateState({ upgrades: { ...ss.getState().upgrades, launchPower: 5 } })
    const cost5 = ss.getUpgradeCost('launchPower')
    expect(cost5).toBe(Math.floor(10 * Math.pow(1.35, 5)))
  })

  it('should return correct cost for each upgrade type', () => {
    const ss = new SaveSystem()
    expect(ss.getUpgradeCost('launchPower')).toBe(10)
    expect(ss.getUpgradeCost('fuelCapacity')).toBe(15)
    expect(ss.getUpgradeCost('gravityResist')).toBe(20)
    expect(ss.getUpgradeCost('stardustMagnet')).toBe(25)
    expect(ss.getUpgradeCost('autoCollector')).toBe(100)
  })

  it('should increase cost exponentially with level', () => {
    const ss = new SaveSystem()
    const costs: number[] = []
    for (let i = 0; i < 10; i++) {
      ss.updateState({ upgrades: { ...ss.getState().upgrades, launchPower: i } })
      costs.push(ss.getUpgradeCost('launchPower'))
    }
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1])
    }
    expect(costs[9]).toBeGreaterThan(costs[0] * 10)
  })
})

// ─── purchaseUpgrade ─────────────────────────────────────
describe('purchaseUpgrade', () => {
  it('should purchase upgrade when enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 100 })
    const result = ss.purchaseUpgrade('launchPower')
    expect(result).toBe(true)
    expect(ss.getState().upgrades.launchPower).toBe(1)
    expect(ss.getState().stardust).toBe(90) // 100 - 10
  })

  it('should reject purchase when not enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 5 }) // cost is 10
    const result = ss.purchaseUpgrade('launchPower')
    expect(result).toBe(false)
    expect(ss.getState().upgrades.launchPower).toBe(0)
    expect(ss.getState().stardust).toBe(5)
  })

  it('should not exceed max level', () => {
    const ss = new SaveSystem()
    ss.updateState({
      stardust: 9999999,
      upgrades: { ...ss.getState().upgrades, launchPower: 50 },
    })
    const result = ss.purchaseUpgrade('launchPower')
    expect(result).toBe(false)
    expect(ss.getState().upgrades.launchPower).toBe(50)
  })

  it('should purchase multiple upgrades in sequence', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 500 })
    for (let i = 0; i < 5; i++) {
      ss.purchaseUpgrade('launchPower')
    }
    expect(ss.getState().upgrades.launchPower).toBe(5)
    // Costs: floor(10*1.35^0)=10, floor(10*1.35^1)=13, floor(10*1.35^2)=18,
    //        floor(10*1.35^3)=24, floor(10*1.35^4)=33 → total=98
    expect(ss.getState().stardust).toBe(500 - 98)
  })
})

// ─── Ship System ─────────────────────────────────────────
describe('ship system', () => {
  it('should unlock ship when enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 600 })
    const result = ss.unlockShip('racer') // cost 500
    expect(result).toBe(true)
    expect(ss.getState().unlockedShips).toContain('racer')
    expect(ss.getState().stardust).toBe(100)
  })

  it('should reject unlock when not enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 100 })
    const result = ss.unlockShip('racer') // cost 500
    expect(result).toBe(false)
    expect(ss.getState().unlockedShips).not.toContain('racer')
  })

  it('should not unlock already unlocked ship', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 9999 })
    const result = ss.unlockShip('scout') // already unlocked
    expect(result).toBe(false)
  })

  it('should select unlocked ship', () => {
    const ss = new SaveSystem()
    ss.updateState({
      stardust: 9999,
      unlockedShips: ['scout', 'racer'],
    })
    ss.selectShip('racer')
    expect(ss.getState().activeShip).toBe('racer')
  })

  it('should not select locked ship', () => {
    const ss = new SaveSystem()
    ss.selectShip('nova') // not unlocked
    expect(ss.getState().activeShip).toBe('scout')
  })

  it('all ships should be unlockable with enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 999999 })
    for (const ship of GAME_CONFIG.SHIPS) {
      if (ship.id === 'scout') continue
      const result = ss.unlockShip(ship.id as any)
      expect(result).toBe(true)
    }
    expect(ss.getState().unlockedShips.length).toBe(GAME_CONFIG.SHIPS.length)
  })
})

// ─── Star System Unlock ──────────────────────────────────
describe('star system unlock', () => {
  it('should unlock system when enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 3000 })
    const result = ss.unlockSystem('nebula', 2000)
    expect(result).toBe(true)
    expect(ss.getState().unlockedSystems).toContain('nebula')
    expect(ss.getState().stardust).toBe(1000)
  })

  it('should reject unlock when not enough stardust', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 500 })
    const result = ss.unlockSystem('nebula', 2000)
    expect(result).toBe(false)
  })

  it('should not unlock already unlocked system', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardust: 99999 })
    const result = ss.unlockSystem('sol', 0)
    expect(result).toBe(false)
  })
})

// ─── Prestige System ─────────────────────────────────────
describe('prestige system', () => {
  it('should calculate prestige requirement correctly', () => {
    const ss = new SaveSystem()
    expect(ss.getPrestigeRequirement()).toBe(10000)

    ss.updateState({ prestigeCount: 1 })
    expect(ss.getPrestigeRequirement()).toBe(25000)

    ss.updateState({ prestigeCount: 2 })
    expect(ss.getPrestigeRequirement()).toBe(62500)
  })

  it('should check canPrestige correctly', () => {
    const ss = new SaveSystem()
    expect(ss.canPrestige()).toBe(false)

    ss.updateState({ stardustTotal: 10000 })
    expect(ss.canPrestige()).toBe(true)

    ss.updateState({ stardustTotal: 9999 })
    expect(ss.canPrestige()).toBe(false)
  })

  it('should perform prestige and earn cores', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardustTotal: 10000, stardust: 5000 })
    const cores = ss.performPrestige()
    // cores = floor(sqrt(10000/1000)) = floor(sqrt(10)) = 3
    expect(cores).toBe(3)
    expect(ss.getState().prestigeCores).toBe(3)
    expect(ss.getState().prestigeCount).toBe(1)
  })

  it('should reset progress after prestige', () => {
    const ss = new SaveSystem()
    ss.updateState({
      stardust: 5000,
      stardustTotal: 15000,
      upgrades: { launchPower: 10, fuelCapacity: 5, gravityResist: 3, stardustMagnet: 2, autoCollector: 1 },
      unlockedShips: ['scout', 'racer', 'tanker'],
      activeShip: 'tanker',
      unlockedSystems: ['sol', 'nebula'],
    })
    ss.performPrestige()

    const state = ss.getState()
    expect(state.stardust).toBe(0)
    expect(state.stardustTotal).toBe(0)
    expect(state.upgrades.launchPower).toBe(0)
    expect(state.upgrades.fuelCapacity).toBe(0)
    expect(state.unlockedShips).toEqual(['scout'])
    expect(state.activeShip).toBe('scout')
    expect(state.unlockedSystems).toEqual(['sol'])
  })

  it('should preserve prestige data after prestige', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardustTotal: 10000, prestigeCores: 5 })
    ss.performPrestige()

    const state = ss.getState()
    expect(state.prestigeCores).toBe(8) // 5 + 3
    expect(state.prestigeCount).toBe(1)
  })

  it('should reject prestige when requirement not met', () => {
    const ss = new SaveSystem()
    ss.updateState({ stardustTotal: 5000 })
    const cores = ss.performPrestige()
    expect(cores).toBe(0)
    expect(ss.getState().prestigeCount).toBe(0)
  })

  it('should earn more cores with higher stardust total', () => {
    const ss1 = new SaveSystem()
    ss1.updateState({ stardustTotal: 10000 })
    const cores1 = ss1.performPrestige()

    const ss2 = new SaveSystem()
    ss2.updateState({ stardustTotal: 100000 })
    const cores2 = ss2.performPrestige()

    expect(cores2).toBeGreaterThan(cores1)
  })
})

// ─── Offline Earnings ────────────────────────────────────
describe('offline earnings', () => {
  // NOTE: save() always overwrites lastOnline = Date.now(), so we test
  // offline earnings through the constructor's calculateOfflineEarnings()
  // by advancing fake time between SaveSystem instances.

  it('should return 0 when no auto collector', () => {
    const ss = new SaveSystem()
    expect(ss.getOfflineEarnings()).toBe(0)
  })

  it('should accumulate stardust from offline earnings over time', () => {
    // Set up autoCollector level 2
    const ss1 = new SaveSystem()
    ss1.updateState({
      upgrades: { ...ss1.getState().upgrades, autoCollector: 2 },
    })
    // ss1.save() sets lastOnline = frozen time (12:00:00)

    // Advance time by 1 hour
    vi.setSystemTime(new Date('2026-06-02T13:00:00Z'))

    // New SaveSystem loads state, calculates offline earnings
    // baseRate = 2 * 0.5 = 1/sec, elapsed = 3600s, multiplier = 1
    // earnings = floor(1 * 3600 * 1) = 3600
    const ss2 = new SaveSystem()
    expect(ss2.getState().stardust).toBe(3600)
  })

  it('should cap offline earnings at 8 hours', () => {
    const ss1 = new SaveSystem()
    ss1.updateState({
      upgrades: { ...ss1.getState().upgrades, autoCollector: 1 },
    })

    // Advance time by 24 hours (should cap at 8h)
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'))

    // baseRate = 0.5/sec, cappedElapsed = 28800s, multiplier = 1
    // earnings = floor(0.5 * 28800 * 1) = 14400
    const ss2 = new SaveSystem()
    expect(ss2.getState().stardust).toBe(14400)
  })

  it('should apply prestige multiplier to offline earnings', () => {
    const ss1 = new SaveSystem()
    ss1.updateState({
      upgrades: { ...ss1.getState().upgrades, autoCollector: 2 },
      prestigeCores: 5, // multiplier = 1.5
    })

    // Advance time by 1 hour
    vi.setSystemTime(new Date('2026-06-02T13:00:00Z'))

    // baseRate = 1/sec, elapsed = 3600s, multiplier = 1.5
    // earnings = floor(1 * 3600 * 1.5) = 5400
    const ss2 = new SaveSystem()
    expect(ss2.getState().stardust).toBe(5400)
  })
})

// ─── Record Launch ───────────────────────────────────────
describe('recordLaunch', () => {
  it('should increment total launches', () => {
    const ss = new SaveSystem()
    ss.recordLaunch(1000)
    expect(ss.getState().totalLaunches).toBe(1)
    ss.recordLaunch(2000)
    expect(ss.getState().totalLaunches).toBe(2)
  })

  it('should update best distance when new record', () => {
    const ss = new SaveSystem()
    ss.recordLaunch(1000)
    expect(ss.getState().bestDistance).toBe(1000)
    ss.recordLaunch(2000)
    expect(ss.getState().bestDistance).toBe(2000)
  })

  it('should not update best distance when lower', () => {
    const ss = new SaveSystem()
    ss.recordLaunch(2000)
    ss.recordLaunch(500)
    expect(ss.getState().bestDistance).toBe(2000)
  })
})

// ─── Reset ───────────────────────────────────────────────
describe('resetAll', () => {
  it('should reset everything to defaults', () => {
    const ss = new SaveSystem()
    ss.updateState({
      stardust: 99999,
      prestigeCores: 100,
      prestigeCount: 50,
      totalLaunches: 1000,
      bestDistance: 999999,
    })
    ss.resetAll()
    const state = ss.getState()
    expect(state.stardust).toBe(0)
    expect(state.prestigeCores).toBe(0)
    expect(state.prestigeCount).toBe(0)
    expect(state.totalLaunches).toBe(0)
    expect(state.bestDistance).toBe(0)
    expect(state.unlockedShips).toEqual(['scout'])
  })
})

// ─── Edge Cases ──────────────────────────────────────────
describe('edge cases', () => {
  it('should handle adding 0 stardust', () => {
    const ss = new SaveSystem()
    ss.addStardust(0)
    expect(ss.getState().stardust).toBe(0)
  })

  it('should handle very large stardust values', () => {
    const ss = new SaveSystem()
    ss.addStardust(1e15)
    expect(ss.getState().stardust).toBe(1e15)
  })

  it('should handle upgrade level 0 cost correctly', () => {
    localStorage.removeItem(SAVE_KEY)
    const ss = new SaveSystem()
    expect(ss.getUpgradeCost('launchPower')).toBe(10)
    expect(ss.getUpgradeCost('autoCollector')).toBe(100)
  })

  it('should persist state across SaveSystem instances', () => {
    const ss1 = new SaveSystem()
    ss1.updateState({ stardust: 42 })
    const ss2 = new SaveSystem()
    expect(ss2.getState().stardust).toBe(42)
  })

  it('should not persist after resetAll', () => {
    const ss1 = new SaveSystem()
    ss1.updateState({ stardust: 42 })
    ss1.resetAll()
    const ss2 = new SaveSystem()
    expect(ss2.getState().stardust).toBe(0)
  })
})
