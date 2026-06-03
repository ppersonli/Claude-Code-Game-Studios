import { describe, it, expect } from 'vitest'
import { INGREDIENTS, isIngredientUnlocked } from '../../src/games/bubble-tea-lab/data/ingredients'

describe('INGREDIENTS data', () => {
  it('has 23 ingredients total', () => {
    expect(INGREDIENTS).toHaveLength(23)
  })

  it('has unique ids for all ingredients', () => {
    const ids = INGREDIENTS.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has required fields on every ingredient', () => {
    for (const ing of INGREDIENTS) {
      expect(ing.id).toBeTruthy()
      expect(ing.name).toBeTruthy()
      expect(ing.img).toBeTruthy()
      expect(ing.type).toBeTruthy()
      expect(ing.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('has valid type values', () => {
    const validTypes = ['tea', 'liquid', 'topping', 'fruit', 'extra']
    for (const ing of INGREDIENTS) {
      expect(validTypes).toContain(ing.type)
    }
  })

  it('has 2 teas', () => {
    expect(INGREDIENTS.filter(i => i.type === 'tea')).toHaveLength(2)
  })

  it('has 4 liquids (including locked cream and seasonal)', () => {
    expect(INGREDIENTS.filter(i => i.type === 'liquid')).toHaveLength(4)
  })

  it('has 13 toppings', () => {
    expect(INGREDIENTS.filter(i => i.type === 'topping')).toHaveLength(13)
  })

  it('has 2 fruits', () => {
    expect(INGREDIENTS.filter(i => i.type === 'fruit')).toHaveLength(2)
  })

  it('has 2 extras', () => {
    expect(INGREDIENTS.filter(i => i.type === 'extra')).toHaveLength(2)
  })

  it('has 12 locked ingredients', () => {
    expect(INGREDIENTS.filter(i => i.locked)).toHaveLength(12)
  })

  it('has 11 unlocked ingredients by default', () => {
    expect(INGREDIENTS.filter(i => !i.locked)).toHaveLength(11)
  })

  it('locked ingredients all have an unlockCost', () => {
    for (const ing of INGREDIENTS.filter(i => i.locked)) {
      expect(ing.unlockCost).toBeGreaterThan(0)
    }
  })

  it('unlocked ingredients have no unlockCost', () => {
    for (const ing of INGREDIENTS.filter(i => !i.locked)) {
      expect(ing.unlockCost).toBeUndefined()
    }
  })
})

describe('isIngredientUnlocked', () => {
  const taro = INGREDIENTS.find(i => i.id === 'taro')!
  const greenTea = INGREDIENTS.find(i => i.id === 'green_tea')!

  it('returns true for non-locked ingredient regardless of unlocked list', () => {
    expect(isIngredientUnlocked(greenTea, [])).toBe(true)
    expect(isIngredientUnlocked(greenTea, ['taro'])).toBe(true)
  })

  it('returns false for locked ingredient not in unlocked list', () => {
    expect(isIngredientUnlocked(taro, [])).toBe(false)
    expect(isIngredientUnlocked(taro, ['cream'])).toBe(false)
  })

  it('returns true for locked ingredient in unlocked list', () => {
    expect(isIngredientUnlocked(taro, ['taro'])).toBe(true)
    expect(isIngredientUnlocked(taro, ['cream', 'taro', 'mochi'])).toBe(true)
  })
})
