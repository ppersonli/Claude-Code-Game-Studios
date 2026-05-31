import { describe, it, expect } from 'vitest'
import {
  CUSTOMERS,
  ACHIEVEMENTS,
  isCustomerUnlocked,
  selectCustomer,
} from '../../src/games/bubble-tea-lab/data/customers'

describe('CUSTOMERS data', () => {
  it('has 7 customers total', () => {
    expect(CUSTOMERS).toHaveLength(7)
  })

  it('has 4 common, 2 rare, 1 legendary', () => {
    expect(CUSTOMERS.filter(c => c.rarity === 'common')).toHaveLength(4)
    expect(CUSTOMERS.filter(c => c.rarity === 'rare')).toHaveLength(2)
    expect(CUSTOMERS.filter(c => c.rarity === 'legendary')).toHaveLength(1)
  })

  it('has unique names', () => {
    const names = CUSTOMERS.map(c => c.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('common customers have no tipBonus or lock', () => {
    for (const c of CUSTOMERS.filter(c => c.rarity === 'common')) {
      expect(c.tipBonus).toBeUndefined()
      expect(c.locked).toBeFalsy()
    }
  })

  it('rare customers have tipBonus 1.5', () => {
    for (const c of CUSTOMERS.filter(c => c.rarity === 'rare')) {
      expect(c.tipBonus).toBe(1.5)
      expect(c.locked).toBe(true)
      expect(c.unlockCost).toBeGreaterThan(0)
    }
  })

  it('legendary customer has tipBonus 2.0', () => {
    const vip = CUSTOMERS.find(c => c.rarity === 'legendary')!
    expect(vip.tipBonus).toBe(2.0)
    expect(vip.locked).toBe(true)
  })

  it('locked customers all have unlockCost', () => {
    for (const c of CUSTOMERS.filter(c => c.locked)) {
      expect(c.unlockCost).toBeGreaterThan(0)
    }
  })
})

describe('ACHIEVEMENTS data', () => {
  it('has 10 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(10)
  })

  it('has unique ids', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each achievement has required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.desc).toBeTruthy()
      expect(a.img).toBeTruthy()
      expect(typeof a.check).toBe('function')
    }
  })

  it('first_perfect triggers on perfectCount >= 1', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'first_perfect')!
    expect(a.check({ perfectCount: 0 } as any)).toBe(false)
    expect(a.check({ perfectCount: 1 } as any)).toBe(true)
  })

  it('combo5 triggers on maxCombo >= 5', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'combo5')!
    expect(a.check({ maxCombo: 4 } as any)).toBe(false)
    expect(a.check({ maxCombo: 5 } as any)).toBe(true)
  })

  it('level5 triggers on level >= 5', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'level5')!
    expect(a.check({ level: 4 } as any)).toBe(false)
    expect(a.check({ level: 5 } as any)).toBe(true)
  })

  it('score100 triggers on score >= 100', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'score100')!
    expect(a.check({ score: 99 } as any)).toBe(false)
    expect(a.check({ score: 100 } as any)).toBe(true)
  })

  it('combo10 triggers on maxCombo >= 10', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'combo10')!
    expect(a.check({ maxCombo: 9 } as any)).toBe(false)
    expect(a.check({ maxCombo: 10 } as any)).toBe(true)
  })

  it('score500 triggers on score >= 500', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'score500')!
    expect(a.check({ score: 499 } as any)).toBe(false)
    expect(a.check({ score: 500 } as any)).toBe(true)
  })

  it('serve50 triggers on totalDrinksServed >= 50', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'serve50')!
    expect(a.check({ totalDrinksServed: 49 } as any)).toBe(false)
    expect(a.check({ totalDrinksServed: 50 } as any)).toBe(true)
  })

  it('daily_complete triggers on dailyCompleted === true', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'daily_complete')!
    expect(a.check({ dailyCompleted: false } as any)).toBe(false)
    expect(a.check({ dailyCompleted: true } as any)).toBe(true)
  })

  it('perfect_streak5 triggers on perfectCount >= 5', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'perfect_streak5')!
    expect(a.check({ perfectCount: 4 } as any)).toBe(false)
    expect(a.check({ perfectCount: 5 } as any)).toBe(true)
  })

  it('unlock_all_ingredients triggers on unlockedIngredients >= 5', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'unlock_all_ingredients')!
    expect(a.check({ unlockedIngredients: ['a', 'b', 'c', 'd'] } as any)).toBe(false)
    expect(a.check({ unlockedIngredients: ['a', 'b', 'c', 'd', 'e'] } as any)).toBe(true)
  })
})

describe('isCustomerUnlocked', () => {
  const girl = CUSTOMERS.find(c => c.name === '小美')!
  const catgirl = CUSTOMERS.find(c => c.name === '猫猫酱')!

  it('returns true for non-locked customer', () => {
    expect(isCustomerUnlocked(girl, [])).toBe(true)
  })

  it('returns false for locked customer not in unlocked list', () => {
    expect(isCustomerUnlocked(catgirl, [])).toBe(false)
    expect(isCustomerUnlocked(catgirl, ['机器人'])).toBe(false)
  })

  it('returns true for locked customer in unlocked list', () => {
    expect(isCustomerUnlocked(catgirl, ['猫猫酱'])).toBe(true)
  })
})

describe('selectCustomer', () => {
  const allUnlocked = CUSTOMERS

  it('returns a customer from the available list', () => {
    const result = selectCustomer(allUnlocked, 0.5)
    expect(allUnlocked).toContain(result)
  })

  it('selects legendary when rand < 0.05 and legendary available', () => {
    const result = selectCustomer(allUnlocked, 0.01)
    expect(result.rarity).toBe('legendary')
  })

  it('selects rare when 0.05 <= rand < 0.2 and rare available', () => {
    const result = selectCustomer(allUnlocked, 0.1)
    expect(result.rarity).toBe('rare')
  })

  it('selects common when rand >= 0.2', () => {
    const result = selectCustomer(allUnlocked, 0.5)
    expect(result.rarity).toBe('common')
  })

  it('falls back to common when legendary not available', () => {
    const commonOnly = CUSTOMERS.filter(c => c.rarity === 'common')
    const result = selectCustomer(commonOnly, 0.01)
    expect(result.rarity).toBe('common')
  })

  it('falls back to first available when no common customers', () => {
    const rareOnly = CUSTOMERS.filter(c => c.rarity === 'rare')
    const result = selectCustomer(rareOnly, 0.5)
    expect(rareOnly).toContain(result)
  })

  it('returns the first available when empty fallback', () => {
    const single = [CUSTOMERS[0]]
    const result = selectCustomer(single, 0.99)
    expect(result).toBe(CUSTOMERS[0])
  })
})
