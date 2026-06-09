import { describe, it, expect, beforeEach } from 'vitest'
import { DressUpSystem } from '../../src/games/runway-fashion/systems/DressUpSystem'
import type { Clothing, ClothingCategory } from '../../src/games/runway-fashion/data/types'

describe('DressUpSystem', () => {
  let system: DressUpSystem

  const topItem: Clothing = {
    id: 'top_tshirt',
    name: 'Basic Tee',
    category: 'top',
    style: ['casual', 'cute'],
    color: '#FF6B9D',
    rarity: 'common',
    unlockLevel: 1,
    price: 0,
    image: 'top_tshirt.webp',
  }

  const bottomItem: Clothing = {
    id: 'bottom_skirt',
    name: 'Pleated Skirt',
    category: 'bottom',
    style: ['cute', 'casual'],
    color: '#FFB6C1',
    rarity: 'common',
    unlockLevel: 1,
    price: 0,
    image: 'bottom_skirt.webp',
  }

  const shoesItem: Clothing = {
    id: 'shoes_heels',
    name: 'High Heels',
    category: 'shoes',
    style: ['elegant', 'glamorous'],
    color: '#FF0000',
    rarity: 'rare',
    unlockLevel: 2,
    price: 300,
    image: 'shoes_heels.webp',
  }

  const accessoryItem: Clothing = {
    id: 'acc_necklace',
    name: 'Necklace',
    category: 'accessory',
    style: ['elegant', 'glamorous'],
    color: '#FFD700',
    rarity: 'rare',
    unlockLevel: 2,
    price: 400,
    image: 'acc_necklace.webp',
  }

  const hairItem: Clothing = {
    id: 'hair_long',
    name: 'Long Straight',
    category: 'hair',
    style: ['elegant', 'cute'],
    color: '#8B4513',
    rarity: 'common',
    unlockLevel: 1,
    price: 0,
    image: 'hair_long.webp',
  }

  const differentTop: Clothing = {
    id: 'top_evening',
    name: 'Evening Top',
    category: 'top',
    style: ['glamorous', 'elegant'],
    color: '#8B0000',
    rarity: 'rare',
    unlockLevel: 3,
    price: 500,
    image: 'top_evening.webp',
  }

  beforeEach(() => {
    system = new DressUpSystem()
  })

  describe('equip', () => {
    it('should equip an item', () => {
      system.equip(topItem)
      expect(system.getEquipped('top')).toBe(topItem)
    })

    it('should replace existing item in same category', () => {
      system.equip(topItem)
      system.equip(differentTop)
      expect(system.getEquipped('top')).toBe(differentTop)
    })

    it('should allow equipping items in different categories simultaneously', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      system.equip(shoesItem)
      expect(system.getEquipped('top')).toBe(topItem)
      expect(system.getEquipped('bottom')).toBe(bottomItem)
      expect(system.getEquipped('shoes')).toBe(shoesItem)
    })
  })

  describe('unequip', () => {
    it('should remove equipped item', () => {
      system.equip(topItem)
      system.unequip('top')
      expect(system.getEquipped('top')).toBeUndefined()
    })

    it('should not affect other categories', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      system.unequip('top')
      expect(system.getEquipped('bottom')).toBe(bottomItem)
    })

    it('should be safe to unequip empty category', () => {
      system.unequip('top')
      expect(system.getEquipped('top')).toBeUndefined()
    })
  })

  describe('getEquipped', () => {
    it('should return undefined for empty category', () => {
      expect(system.getEquipped('top')).toBeUndefined()
    })

    it('should return the equipped item', () => {
      system.equip(topItem)
      expect(system.getEquipped('top')).toEqual(topItem)
    })
  })

  describe('getOutfit', () => {
    it('should return empty array when nothing equipped', () => {
      expect(system.getOutfit()).toEqual([])
    })

    it('should return all equipped items', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      system.equip(shoesItem)
      const outfit = system.getOutfit()
      expect(outfit).toHaveLength(3)
      expect(outfit).toContain(topItem)
      expect(outfit).toContain(bottomItem)
      expect(outfit).toContain(shoesItem)
    })

    it('should not include unequipped categories', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      system.unequip('bottom')
      expect(system.getOutfit()).toHaveLength(1)
    })
  })

  describe('getEquippedCategories', () => {
    it('should return empty set when nothing equipped', () => {
      expect(system.getEquippedCategories().size).toBe(0)
    })

    it('should return set of equipped category names', () => {
      system.equip(topItem)
      system.equip(shoesItem)
      const cats = system.getEquippedCategories()
      expect(cats.size).toBe(2)
      expect(cats.has('top')).toBe(true)
      expect(cats.has('shoes')).toBe(true)
    })
  })

  describe('isCategoryEquipped', () => {
    it('should return false for empty category', () => {
      expect(system.isCategoryEquipped('top')).toBe(false)
    })

    it('should return true for equipped category', () => {
      system.equip(topItem)
      expect(system.isCategoryEquipped('top')).toBe(true)
    })

    it('should return false after unequip', () => {
      system.equip(topItem)
      system.unequip('top')
      expect(system.isCategoryEquipped('top')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should remove all equipped items', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      system.equip(shoesItem)
      system.clear()
      expect(system.getOutfit()).toEqual([])
    })

    it('should be safe on empty system', () => {
      system.clear()
      expect(system.getOutfit()).toEqual([])
    })
  })

  describe('getCompletionRatio', () => {
    it('should return 0 when nothing equipped', () => {
      expect(system.getCompletionRatio()).toBe(0)
    })

    it('should return 1 when all 5 categories equipped', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      system.equip(shoesItem)
      system.equip(accessoryItem)
      system.equip(hairItem)
      expect(system.getCompletionRatio()).toBe(1)
    })

    it('should return correct ratio for partial outfit', () => {
      system.equip(topItem)
      system.equip(bottomItem)
      expect(system.getCompletionRatio()).toBeCloseTo(0.4, 1)
    })
  })

  describe('swap', () => {
    it('should replace item and return old one', () => {
      system.equip(topItem)
      const old = system.swap(differentTop)
      expect(old).toBe(topItem)
      expect(system.getEquipped('top')).toBe(differentTop)
    })

    it('should return undefined when swapping empty category', () => {
      const old = system.swap(topItem)
      expect(old).toBeUndefined()
      expect(system.getEquipped('top')).toBe(topItem)
    })
  })
})
