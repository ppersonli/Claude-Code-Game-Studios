import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getDefaultState,
  xpForLevel,
  formatMoney,
  formatNumber,
  getUpgradeCost,
  getEmployeeCost,
  getEarningsPerClick,
  getEarningsPerSecond,
  makeCoffee,
  upgradeEquipment,
  hireEmployee,
  doPrestige,
  resetGame,
  autoBrew,
  calculateOfflineEarnings,
  selectRecipe,
  loadGameState,
  saveGameState,
  checkLevelUp,
  type GameState,
} from '../../src/games/idle-coffee-shop/composables/useGameLogic'
import { RECIPES } from '../../src/games/idle-coffee-shop/data/recipes'
import { EQUIPMENT } from '../../src/games/idle-coffee-shop/data/equipment'
import { EMPLOYEES } from '../../src/games/idle-coffee-shop/data/employees'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

// Mock Date.now for deterministic offline earnings
let mockNow = Date.now()
vi.spyOn(Date, 'now').mockImplementation(() => mockNow)

function freshState(): GameState {
  const s = getDefaultState()
  s.lastOnline = mockNow
  return s
}

beforeEach(() => {
  localStorage.clear()
  mockNow = Date.now()
})

// ===== Data =====
describe('RECIPES data', () => {
  it('has americano with expected properties', () => {
    expect(RECIPES.americano.name).toBe('Americano')
    expect(RECIPES.americano.price).toBe(1)
    expect(RECIPES.americano.type).toBe('hot')
  })
  it('has all 12 recipes', () => {
    expect(Object.keys(RECIPES)).toHaveLength(12)
  })
})

describe('EQUIPMENT data', () => {
  it('has coffee machine at base level', () => {
    expect(EQUIPMENT.coffee.name).toBe('Coffee Machine')
    expect(EQUIPMENT.coffee.maxLevel).toBe(50)
  })
  it('has 5 equipment types', () => {
    expect(Object.keys(EQUIPMENT)).toHaveLength(5)
  })
})

describe('EMPLOYEES data', () => {
  it('has intern with expected cost', () => {
    expect(EMPLOYEES.intern.cost).toBe(500)
    expect(EMPLOYEES.intern.cupsPerSec).toBe(1)
  })
  it('has 5 employee types', () => {
    expect(Object.keys(EMPLOYEES)).toHaveLength(5)
  })
})

// ===== Utility functions =====
describe('xpForLevel', () => {
  it('returns 57 for level 1', () => {
    expect(xpForLevel(1)).toBe(Math.floor(50 * 1 * (1 + 1 * 0.15)))
  })
  it('scales with level', () => {
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(1))
  })
})

describe('formatMoney', () => {
  it('formats small amounts', () => {
    expect(formatMoney(0)).toBe('$0')
    expect(formatMoney(999)).toBe('$999')
  })
  it('formats thousands', () => {
    expect(formatMoney(1500)).toBe('$1.5K')
  })
  it('formats millions', () => {
    expect(formatMoney(2_500_000)).toBe('$2.5M')
  })
  it('formats billions', () => {
    expect(formatMoney(3_000_000_000)).toBe('$3.0B')
  })
})

describe('formatNumber', () => {
  it('formats small numbers', () => {
    expect(formatNumber(500)).toBe('500')
  })
  it('formats thousands', () => {
    expect(formatNumber(1500)).toBe('1.5K')
  })
  it('formats millions', () => {
    expect(formatNumber(2_000_000)).toBe('2.0M')
  })
  it('formats billions', () => {
    expect(formatNumber(1_000_000_000)).toBe('1.0B')
  })
})

// ===== State management =====
describe('getDefaultState', () => {
  it('starts with 0 money', () => {
    expect(getDefaultState().money).toBe(0)
  })
  it('starts at level 1', () => {
    expect(getDefaultState().level).toBe(1)
  })
  it('starts with americano recipe', () => {
    expect(getDefaultState().recipes).toEqual(['americano'])
  })
  it('starts with coffee machine at level 1', () => {
    expect(getDefaultState().equipment.coffee).toBe(1)
  })
})

// ===== Cost calculations =====
describe('getUpgradeCost', () => {
  it('returns base cost for level 0 equipment', () => {
    const s = freshState()
    s.equipment.grinder = 0
    // baseCost=200, costMult=2 -> 200 * (0+1)^2 = 200
    expect(getUpgradeCost('grinder', s)).toBe(200)
  })
  it('scales with level', () => {
    const s = freshState()
    s.equipment.grinder = 5
    // 200 * 6^2 = 7200
    expect(getUpgradeCost('grinder', s)).toBe(7200)
  })
  it('returns 0 for unknown equipment', () => {
    expect(getUpgradeCost('unknown', freshState())).toBe(0)
  })
})

describe('getEmployeeCost', () => {
  it('returns base cost for 0 employees', () => {
    const s = freshState()
    expect(getEmployeeCost('intern', s)).toBe(500)
  })
  it('scales exponentially with count', () => {
    const s = freshState()
    s.employees.intern = 3
    // 500 * 1.5^3 = 1687
    expect(getEmployeeCost('intern', s)).toBe(Math.floor(500 * Math.pow(1.5, 3)))
  })
  it('returns 0 for unknown employee', () => {
    expect(getEmployeeCost('unknown', freshState())).toBe(0)
  })
})

// ===== Earnings =====
describe('getEarningsPerClick', () => {
  it('returns recipe price for base state', () => {
    const s = freshState()
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    // americano price=1, no bonuses
    expect(getEarningsPerClick(s)).toBe(1)
  })
  it('applies grinder bonus', () => {
    const s = freshState()
    s.equipment = { coffee: 1, grinder: 10, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    // 1 * (1 + 10*0.05) = 1.5
    expect(getEarningsPerClick(s)).toBeCloseTo(1.5, 5)
  })
  it('applies cold drink fridge bonus', () => {
    const s = freshState()
    s.selectedRecipe = 'iced_americano'
    s.recipes = ['americano', 'iced_americano']
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 10, decor: 0 }
    s.prestigeBonus = 1
    // 2 * (1 + 10*0.15) = 2 * 2.5 = 5
    expect(getEarningsPerClick(s)).toBeCloseTo(5, 5)
  })
  it('applies prestige bonus', () => {
    const s = freshState()
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 2.0
    // 1 * 2.0 = 2
    expect(getEarningsPerClick(s)).toBe(2)
  })
})

describe('getEarningsPerSecond', () => {
  it('returns 0 with no employees', () => {
    expect(getEarningsPerSecond(freshState())).toBe(0)
  })
  it('calculates correctly with employees', () => {
    const s = freshState()
    s.employees = { intern: 2 }
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    // 2 interns * 1 cup/s * 1$/cup = 2/s
    expect(getEarningsPerSecond(s)).toBeCloseTo(2, 5)
  })
})

// ===== Core actions =====
describe('makeCoffee', () => {
  it('increases money', () => {
    const s = freshState()
    makeCoffee(s)
    expect(s.money).toBeGreaterThan(0)
  })
  it('increments totalCups and totalClicks', () => {
    const s = freshState()
    makeCoffee(s)
    expect(s.totalCups).toBe(1)
    expect(s.totalClicks).toBe(1)
  })
  it('adds xp', () => {
    const s = freshState()
    makeCoffee(s)
    expect(s.xp).toBeGreaterThan(0)
  })
  it('returns earnings amount', () => {
    const s = freshState()
    const earnings = makeCoffee(s)
    expect(earnings).toBe(getEarningsPerClick(s))
  })
})

describe('upgradeEquipment', () => {
  it('upgrades when affordable', () => {
    const s = freshState()
    s.money = 10000
    s.equipment.grinder = 0
    const result = upgradeEquipment('grinder', s)
    expect(result).toBe(true)
    expect(s.equipment.grinder).toBe(1)
    expect(s.money).toBeLessThan(10000)
  })
  it('returns false when not enough money', () => {
    const s = freshState()
    s.money = 0
    expect(upgradeEquipment('grinder', s)).toBe(false)
  })
  it('returns false at max level', () => {
    const s = freshState()
    s.money = Infinity
    s.equipment.coffee = EQUIPMENT.coffee.maxLevel
    expect(upgradeEquipment('coffee', s)).toBe(false)
  })
  it('returns false for unknown key', () => {
    const s = freshState()
    s.money = Infinity
    expect(upgradeEquipment('nonexistent', s)).toBe(false)
  })
})

describe('hireEmployee', () => {
  it('hires when affordable', () => {
    const s = freshState()
    s.money = 5000
    s.level = 10
    const result = hireEmployee('intern', s)
    expect(result).toBe(true)
    expect(s.employees.intern).toBe(1)
  })
  it('returns false when broke', () => {
    const s = freshState()
    s.money = 0
    expect(hireEmployee('intern', s)).toBe(false)
  })
  it('returns false at max count', () => {
    const s = freshState()
    s.money = Infinity
    s.employees.intern = EMPLOYEES.intern.maxCount
    expect(hireEmployee('intern', s)).toBe(false)
  })
  it('returns false for unknown key', () => {
    const s = freshState()
    s.money = Infinity
    expect(hireEmployee('nonexistent', s)).toBe(false)
  })
})

// ===== Prestige =====
describe('doPrestige', () => {
  it('returns false under $1M total earned', () => {
    const s = freshState()
    s.totalEarned = 500_000
    expect(doPrestige(s)).toBe(false)
  })
  it('resets money but keeps prestige', () => {
    const s = freshState()
    s.totalEarned = 2_000_000
    s.money = 1_000_000
    const result = doPrestige(s)
    expect(result).toBe(true)
    expect(s.money).toBe(0)
    expect(s.prestigeCount).toBe(1)
    expect(s.prestigeBonus).toBeCloseTo(1.1, 5)
  })
  it('unlocks special recipes on prestige', () => {
    const s = freshState()
    s.totalEarned = 5_000_000
    doPrestige(s)
    expect(s.recipes).toContain('iced_americano')
  })
  it('selects best available recipe', () => {
    const s = freshState()
    s.totalEarned = 5_000_000
    doPrestige(s)
    // With 1 prestige, we unlock iced_americano (price 2) — selected should be it
    expect(s.selectedRecipe).not.toBe('americano')
  })
})

// ===== Reset =====
describe('resetGame', () => {
  it('resets to default state', () => {
    const s = freshState()
    s.money = 999
    s.level = 50
    resetGame(s)
    expect(s.money).toBe(0)
    expect(s.level).toBe(1)
    expect(s.prestigeCount).toBe(0)
  })
})

// ===== Auto brew =====
describe('autoBrew', () => {
  it('returns 0 cups with no employees', () => {
    const s = freshState()
    expect(autoBrew(s)).toBe(0)
  })
  it('earns money with employees', () => {
    const s = freshState()
    s.employees = { intern: 2 }
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    const cups = autoBrew(s)
    expect(cups).toBe(2)
    expect(s.money).toBeGreaterThan(0)
  })
  it('increases totalCups', () => {
    const s = freshState()
    s.employees = { intern: 1 }
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    autoBrew(s)
    expect(s.totalCups).toBe(1)
  })
})

// ===== Offline earnings =====
describe('calculateOfflineEarnings', () => {
  it('returns 0 if less than 60s', () => {
    const s = freshState()
    s.lastOnline = mockNow - 30_000 // 30s
    expect(calculateOfflineEarnings(s)).toBe(0)
  })
  it('returns 0 with no employees', () => {
    const s = freshState()
    s.lastOnline = mockNow - 120_000 // 2min
    expect(calculateOfflineEarnings(s)).toBe(0)
  })
  it('calculates earnings for offline time', () => {
    const s = freshState()
    s.employees = { intern: 1 }
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    s.lastOnline = mockNow - 120_000 // 2min
    const earnings = calculateOfflineEarnings(s)
    expect(earnings).toBeGreaterThan(0)
    expect(s.money).toBe(earnings)
  })
  it('caps at 8 hours', () => {
    const s = freshState()
    s.employees = { intern: 1 }
    s.equipment = { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 }
    s.prestigeBonus = 1
    s.lastOnline = mockNow - 24 * 3600_000 // 24h
    const earnings = calculateOfflineEarnings(s)
    // Should be capped at 8h = 28800s * 1 cup/s * 1$/cup = 28800
    expect(earnings).toBeCloseTo(28800, 0)
  })
})

// ===== Recipe selection =====
describe('selectRecipe', () => {
  it('selects an unlocked recipe', () => {
    const s = freshState()
    s.recipes = ['americano', 'latte']
    expect(selectRecipe('latte', s)).toBe(true)
    expect(s.selectedRecipe).toBe('latte')
  })
  it('returns false for locked recipe', () => {
    const s = freshState()
    expect(selectRecipe('latte', s)).toBe(false)
  })
  it('returns false for unknown recipe', () => {
    const s = freshState()
    s.recipes.push('nonexistent' as never)
    // Even if in recipes list, RECIPES doesn't have it
    expect(selectRecipe('nonexistent', s)).toBe(false)
  })
})

// ===== Level up =====
describe('checkLevelUp', () => {
  it('levels up when enough xp', () => {
    const s = freshState()
    s.level = 1
    s.xp = xpForLevel(1) + 10
    checkLevelUp(s)
    expect(s.level).toBe(2)
  })
  it('unlocks recipes on level up', () => {
    const s = freshState()
    s.level = 4
    s.xp = xpForLevel(4) + 10
    checkLevelUp(s)
    expect(s.level).toBe(5)
    expect(s.recipes).toContain('latte')
  })
  it('caps at level 100', () => {
    const s = freshState()
    s.level = 99
    s.xp = 999999999
    checkLevelUp(s)
    expect(s.level).toBeLessThanOrEqual(100)
  })
})

// ===== Save/Load =====
describe('saveGameState / loadGameState', () => {
  it('round-trips through localStorage', () => {
    const s = freshState()
    s.money = 12345
    s.level = 7
    saveGameState(s)
    const loaded = loadGameState()
    expect(loaded.money).toBe(12345)
    expect(loaded.level).toBe(7)
  })
  it('returns default state when nothing saved', () => {
    localStorage.clear()
    const loaded = loadGameState()
    expect(loaded.money).toBe(0)
    expect(loaded.level).toBe(1)
  })
  it('merges missing fields with defaults', () => {
    localStorage.setItem('idle-coffee-shop-save', JSON.stringify({ money: 100 }))
    const loaded = loadGameState()
    expect(loaded.money).toBe(100)
    expect(loaded.level).toBe(1)
    expect(loaded.recipes).toEqual(['americano'])
  })
  it('handles corrupted localStorage', () => {
    localStorage.setItem('idle-coffee-shop-save', 'NOT_JSON')
    const loaded = loadGameState()
    expect(loaded.money).toBe(0)
  })
  it('sets lastOnline on save', () => {
    const s = freshState()
    saveGameState(s)
    expect(s.lastOnline).toBe(mockNow)
  })
})
