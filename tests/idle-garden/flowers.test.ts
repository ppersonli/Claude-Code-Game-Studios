/**
 * Idle Garden Tycoon — Flowers Data Tests
 */
import { describe, it, expect } from 'vitest'
import { FLOWERS, getFlowerById, getAvailableFlowers } from '../../src/games/idle-garden/data/flowers'

describe('FLOWERS', () => {
  it('has at least 6 flower types', () => {
    expect(FLOWERS.length).toBeGreaterThanOrEqual(6)
  })

  it('each flower has a unique id', () => {
    const ids = FLOWERS.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each flower has positive growTime and sellPrice', () => {
    FLOWERS.forEach(f => {
      expect(f.growTime).toBeGreaterThan(0)
      expect(f.sellPrice).toBeGreaterThan(0)
    })
  })

  it('sunflower is the starter flower', () => {
    const sunflower = FLOWERS.find(f => f.id === 'sunflower')
    expect(sunflower).toBeDefined()
    expect(sunflower!.unlockLevel).toBe(1)
    expect(sunflower!.unlockPrestige).toBe(0)
  })

  it('rainbow flower requires prestige', () => {
    const rainbow = FLOWERS.find(f => f.id === 'rainbow')
    expect(rainbow).toBeDefined()
    expect(rainbow!.unlockPrestige).toBe(1)
  })

  it('higher tier flowers have higher sell prices', () => {
    const prices = FLOWERS.map(f => f.sellPrice)
    // At minimum, prices should generally increase
    expect(prices[prices.length - 1]).toBeGreaterThan(prices[0])
  })
})

describe('getFlowerById', () => {
  it('returns flower for valid id', () => {
    const flower = getFlowerById('sunflower')
    expect(flower).toBeDefined()
    expect(flower!.id).toBe('sunflower')
  })

  it('returns undefined for invalid id', () => {
    expect(getFlowerById('nonexistent')).toBeUndefined()
  })
})

describe('getAvailableFlowers', () => {
  it('returns only sunflower at level 1', () => {
    const available = getAvailableFlowers(1, 0)
    expect(available.length).toBe(1)
    expect(available[0].id).toBe('sunflower')
  })

  it('returns more flowers at higher levels', () => {
    const level1 = getAvailableFlowers(1, 0)
    const level5 = getAvailableFlowers(5, 0)
    expect(level5.length).toBeGreaterThan(level1.length)
  })

  it('includes prestige-locked flowers when prestige meets requirement', () => {
    const withoutPrestige = getAvailableFlowers(5, 0)
    const withPrestige = getAvailableFlowers(5, 1)
    expect(withPrestige.length).toBeGreaterThan(withoutPrestige.length)
  })

  it('does not include prestige-locked flowers without prestige', () => {
    const available = getAvailableFlowers(5, 0)
    const rainbow = available.find(f => f.id === 'rainbow')
    expect(rainbow).toBeUndefined()
  })
})
