import { describe, it, expect } from 'vitest'
import { INGREDIENTS, isIngredientUnlocked } from '../../src/games/bubble-tea/data/ingredients'

describe('INGREDIENTS', () => {
  it('has 16 ingredients', () => {
    expect(INGREDIENTS).toHaveLength(16)
  })

  it('each ingredient has required fields', () => {
    for (const ing of INGREDIENTS) {
      expect(ing.id).toBeTruthy()
      expect(ing.name).toBeTruthy()
      expect(ing.img).toBeTruthy()
      expect(ing.type).toBeTruthy()
      expect(ing.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('has unique ids', () => {
    const ids = INGREDIENTS.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has correct type distribution', () => {
    const types = INGREDIENTS.map(i => i.type)
    expect(types).toContain('tea')
    expect(types).toContain('liquid')
    expect(types).toContain('topping')
    expect(types).toContain('fruit')
    expect(types).toContain('extra')
  })

  it('locked ingredients have unlockCost', () => {
    const locked = INGREDIENTS.filter(i => i.locked)
    expect(locked.length).toBeGreaterThan(0)
    for (const ing of locked) {
      expect(ing.unlockCost).toBeGreaterThan(0)
    }
  })
})

describe('isIngredientUnlocked', () => {
  it('returns true for non-locked ingredients', () => {
    const ing = INGREDIENTS.find(i => !i.locked)!
    expect(isIngredientUnlocked(ing, [])).toBe(true)
  })

  it('returns false for locked ingredient not in unlocked list', () => {
    const ing = INGREDIENTS.find(i => i.locked)!
    expect(isIngredientUnlocked(ing, [])).toBe(false)
  })

  it('returns true for locked ingredient in unlocked list', () => {
    const ing = INGREDIENTS.find(i => i.locked)!
    expect(isIngredientUnlocked(ing, [ing.id])).toBe(true)
  })

  it('returns true for locked ingredient in larger unlocked list', () => {
    const ing = INGREDIENTS.find(i => i.locked)!
    expect(isIngredientUnlocked(ing, ['other', ing.id, 'another'])).toBe(true)
  })
})
