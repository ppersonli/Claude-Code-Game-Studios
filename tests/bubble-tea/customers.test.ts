import { describe, it, expect } from 'vitest'
import {
  CUSTOMERS,
  ACHIEVEMENTS,
  isCustomerUnlocked,
  selectCustomer,
} from '../../src/games/bubble-tea/data/customers'

describe('CUSTOMERS', () => {
  it('has 7 customers', () => {
    expect(CUSTOMERS).toHaveLength(7)
  })

  it('each customer has required fields', () => {
    for (const c of CUSTOMERS) {
      expect(c.name).toBeTruthy()
      expect(c.img).toBeTruthy()
      expect(['common', 'rare', 'legendary']).toContain(c.rarity)
    }
  })

  it('locked customers have unlockCost', () => {
    const locked = CUSTOMERS.filter(c => c.locked)
    expect(locked.length).toBeGreaterThan(0)
    for (const c of locked) {
      expect(c.unlockCost).toBeGreaterThan(0)
    }
  })
})

describe('isCustomerUnlocked', () => {
  it('returns true for non-locked customers', () => {
    const c = CUSTOMERS.find(c => !c.locked)!
    expect(isCustomerUnlocked(c, [])).toBe(true)
  })

  it('returns false for locked customer not in list', () => {
    const c = CUSTOMERS.find(c => c.locked)!
    expect(isCustomerUnlocked(c, [])).toBe(false)
  })

  it('returns true for locked customer in unlocked list', () => {
    const c = CUSTOMERS.find(c => c.locked)!
    expect(isCustomerUnlocked(c, [c.name])).toBe(true)
  })
})

describe('selectCustomer', () => {
  const available = CUSTOMERS.filter(c => !c.locked)

  it('returns a customer from available list', () => {
    const result = selectCustomer(available, 0.5)
    expect(available).toContain(result)
  })

  it('returns legendary for very low rand', () => {
    const all = [...CUSTOMERS] // include legendary
    const result = selectCustomer(all, 0.01)
    expect(result.rarity).toBe('legendary')
  })

  it('returns common for high rand', () => {
    const result = selectCustomer(available, 0.99)
    expect(result.rarity).toBe('common')
  })

  it('returns rare for rand between 0.05 and 0.2', () => {
    const all = [...CUSTOMERS]
    const result = selectCustomer(all, 0.1)
    expect(result.rarity).toBe('rare')
  })
})

describe('ACHIEVEMENTS', () => {
  it('has 10 achievements', () => {
    expect(ACHIEVEMENTS).toHaveLength(10)
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
    expect(a.check({ perfectCount: 1 } as any)).toBe(true)
    expect(a.check({ perfectCount: 0 } as any)).toBe(false)
  })

  it('combo5 triggers on maxCombo >= 5', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'combo5')!
    expect(a.check({ maxCombo: 5 } as any)).toBe(true)
    expect(a.check({ maxCombo: 4 } as any)).toBe(false)
  })

  it('score100 triggers on score >= 100', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'score100')!
    expect(a.check({ score: 100 } as any)).toBe(true)
    expect(a.check({ score: 99 } as any)).toBe(false)
  })

  it('serve50 triggers on totalDrinksServed >= 50', () => {
    const a = ACHIEVEMENTS.find(a => a.id === 'serve50')!
    expect(a.check({ totalDrinksServed: 50 } as any)).toBe(true)
    expect(a.check({ totalDrinksServed: 49 } as any)).toBe(false)
  })
})
