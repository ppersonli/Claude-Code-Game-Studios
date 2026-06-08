import { describe, it, expect, beforeEach } from 'vitest'
import { DressUpSystem } from '../../src/games/runway-fashion/systems/DressUpSystem'
import type { Clothing } from '../../src/games/runway-fashion/data/types'

describe('DressUpSystem', () => {
  let system: DressUpSystem

  const top: Clothing = {
    id: 'top_tshirt', name: 'Basic Tee', category: 'top',
    style: ['casual', 'cute'], color: '#FF6B9D', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'top_tshirt.webp',
  }
  const top2: Clothing = {
    id: 'top_blouse', name: 'Elegant Blouse', category: 'top',
    style: ['elegant', 'casual'], color: '#FFFFFF', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'top_blouse.webp',
  }
  const bottom: Clothing = {
    id: 'bottom_skirt', name: 'Pleated Skirt', category: 'bottom',
    style: ['cute', 'casual'], color: '#FFB6C1', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'bottom_skirt.webp',
  }
  const shoes: Clothing = {
    id: 'shoes_sneakers', name: 'Sneakers', category: 'shoes',
    style: ['casual', 'cute'], color: '#FFFFFF', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'shoes_sneakers.webp',
  }
  const accessory: Clothing = {
    id: 'acc_necklace', name: 'Necklace', category: 'accessory',
    style: ['elegant', 'glamorous'], color: '#FFD700', rarity: 'rare',
    unlockLevel: 2, price: 400, image: 'acc_necklace.webp',
  }
  const hair: Clothing = {
    id: 'hair_long', name: 'Long Straight', category: 'hair',
    style: ['elegant', 'cute'], color: '#8B4513', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'hair_long.webp',
  }

  beforeEach(() => {
    system = new DressUpSystem()
  })

  describe('equip', () => {
    it('should equip a clothing item', () => {
      system.equip(top)
      expect(system.getEquipped('top')).toBe(top)
    })

    it('should replace item in the same category', () => {
      system.equip(top)
      system.equip(top2)
      expect(system.getEquipped('top')).toBe(top2)
    })

    it('should allow equipping items in different categories', () => {
      system.equip(top)
      system.equip(bottom)
      system.equip(shoes)
      expect(system.getEquipped('top')).toBe(top)
      expect(system.getEquipped('bottom')).toBe(bottom)
      expect(system.getEquipped('shoes')).toBe(shoes)
    })
  })

  describe('unequip', () => {
    it('should remove an equipped item by category', () => {
      system.equip(top)
      system.unequip('top')
      expect(system.getEquipped('top')).toBeUndefined()
    })

    it('should do nothing if category is empty', () => {
      system.unequip('top')
      expect(system.getEquipped('top')).toBeUndefined()
    })
  })

  describe('getOutfit', () => {
    it('should return empty array when nothing equipped', () => {
      expect(system.getOutfit()).toEqual([])
    })

    it('should return all equipped items', () => {
      system.equip(top)
      system.equip(bottom)
      system.equip(shoes)
      const outfit = system.getOutfit()
      expect(outfit).toHaveLength(3)
      expect(outfit).toContain(top)
      expect(outfit).toContain(bottom)
      expect(outfit).toContain(shoes)
    })

    it('should return a copy (not affect internal state)', () => {
      system.equip(top)
      const outfit = system.getOutfit()
      outfit.push(bottom)
      expect(system.getOutfit()).toHaveLength(1)
    })
  })

  describe('getEquippedCategories', () => {
    it('should return empty set when nothing equipped', () => {
      expect(system.getEquippedCategories()).toEqual(new Set())
    })

    it('should return equipped categories', () => {
      system.equip(top)
      system.equip(shoes)
      const categories = system.getEquippedCategories()
      expect(categories.has('top')).toBe(true)
      expect(categories.has('shoes')).toBe(true)
      expect(categories.has('bottom')).toBe(false)
    })
  })

  describe('isCategoryEquipped', () => {
    it('should return false for empty category', () => {
      expect(system.isCategoryEquipped('top')).toBe(false)
    })

    it('should return true for equipped category', () => {
      system.equip(top)
      expect(system.isCategoryEquipped('top')).toBe(true)
    })
  })

  describe('clear', () => {
    it('should remove all equipped items', () => {
      system.equip(top)
      system.equip(bottom)
      system.equip(shoes)
      system.equip(accessory)
      system.equip(hair)
      system.clear()
      expect(system.getOutfit()).toEqual([])
    })
  })

  describe('getCompletionRatio', () => {
    it('should return 0 when nothing equipped', () => {
      expect(system.getCompletionRatio()).toBe(0)
    })

    it('should return ratio of equipped to total categories', () => {
      system.equip(top)
      system.equip(bottom)
      // 2 of 5 main categories (top, bottom, shoes, accessory, hair)
      expect(system.getCompletionRatio()).toBeCloseTo(0.4)
    })

    it('should return 1 when all categories equipped', () => {
      system.equip(top)
      system.equip(bottom)
      system.equip(shoes)
      system.equip(accessory)
      system.equip(hair)
      expect(system.getCompletionRatio()).toBe(1)
    })
  })

  describe('swap', () => {
    it('should swap item and return the old one', () => {
      system.equip(top)
      const old = system.swap(top2)
      expect(old).toBe(top)
      expect(system.getEquipped('top')).toBe(top2)
    })

    it('should return undefined when swapping into empty slot', () => {
      const old = system.swap(top)
      expect(old).toBeUndefined()
      expect(system.getEquipped('top')).toBe(top)
    })
  })
})
