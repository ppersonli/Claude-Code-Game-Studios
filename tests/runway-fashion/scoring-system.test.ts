import { describe, it, expect, beforeEach } from 'vitest'
import { ScoringSystem } from '../../src/games/runway-fashion/systems/ScoringSystem'
import { GRADE_THRESHOLDS } from '../../src/games/runway-fashion/data/scoring'
import type { Clothing, Theme } from '../../src/games/runway-fashion/data/types'

describe('ScoringSystem', () => {
  let system: ScoringSystem

  const galaTheme: Theme = {
    id: 'evening_gala',
    name: 'Elegant Gala',
    scene: 'red_carpet',
    requiredStyles: ['elegant', 'glamorous'],
    bonusStyles: ['elegant'],
    timeLimit: 18000,
    rewardMultiplier: 1.5,
    unlockLevel: 1,
    isWeekly: false,
  }

  const campusTheme: Theme = {
    id: 'campus',
    name: 'Campus Chic',
    scene: 'campus',
    requiredStyles: ['cute', 'casual'],
    bonusStyles: ['cute'],
    timeLimit: 15000,
    rewardMultiplier: 1.0,
    unlockLevel: 1,
    isWeekly: false,
  }

  const elegantTop: Clothing = {
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

  const casualTshirt: Clothing = {
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

  const elegantSkirt: Clothing = {
    id: 'bottom_evening',
    name: 'Evening Gown',
    category: 'bottom',
    style: ['glamorous', 'elegant'],
    color: '#FFD700',
    rarity: 'rare',
    unlockLevel: 3,
    price: 600,
    image: 'bottom_evening.webp',
  }

  const casualSkirt: Clothing = {
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

  const elegantShoes: Clothing = {
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

  const elegantHair: Clothing = {
    id: 'hair_updo',
    name: 'Updo',
    category: 'hair',
    style: ['elegant', 'glamorous'],
    color: '#DAA520',
    rarity: 'rare',
    unlockLevel: 3,
    price: 500,
    image: 'hair_updo.webp',
  }

  const legendaryAccessory: Clothing = {
    id: 'acc_necklace',
    name: 'Necklace',
    category: 'accessory',
    style: ['elegant', 'glamorous'],
    color: '#FFD700',
    rarity: 'legendary',
    unlockLevel: 2,
    price: 400,
    image: 'acc_necklace.webp',
  }

  beforeEach(() => {
    system = new ScoringSystem()
  })

  describe('calculateStyleMatch', () => {
    it('should return 0 for empty outfit', () => {
      expect(system.calculateStyleMatch([], galaTheme)).toBe(0)
    })

    it('should return 100 when all items match theme required styles', () => {
      const outfit = [elegantTop, elegantSkirt]
      expect(system.calculateStyleMatch(outfit, galaTheme)).toBe(100)
    })

    it('should return 0 when no items match theme required styles', () => {
      const outfit = [casualTshirt, casualSkirt]
      expect(system.calculateStyleMatch(outfit, galaTheme)).toBe(0)
    })

    it('should return partial score when some items match', () => {
      const outfit = [elegantTop, casualSkirt] // 1 of 2 match
      expect(system.calculateStyleMatch(outfit, galaTheme)).toBe(50)
    })

    it('should match any item that has at least one required style', () => {
      // elegantTop has ['glamorous', 'elegant'], campus needs ['cute', 'casual']
      // neither matches
      expect(system.calculateStyleMatch([elegantTop], campusTheme)).toBe(0)
    })

    it('should handle items with multiple style tags', () => {
      // casualTshirt has ['casual', 'cute'], campus needs ['cute', 'casual']
      expect(system.calculateStyleMatch([casualTshirt], campusTheme)).toBe(100)
    })
  })

  describe('calculateCoordination', () => {
    it('should return 0 for empty outfit', () => {
      expect(system.calculateCoordination([])).toBe(0)
    })

    it('should return 100 for single item', () => {
      expect(system.calculateCoordination([elegantTop])).toBe(100)
    })

    it('should return higher score for items with similar colors', () => {
      // Both elegantTop (#8B0000) and elegantSkirt (#FFD700) are warm colors
      const score1 = system.calculateCoordination([elegantTop, elegantSkirt])
      // casualTshirt (#FF6B9D) and casualSkirt (#FFB6C1) are both pink
      const score2 = system.calculateCoordination([casualTshirt, casualSkirt])
      expect(score2).toBeGreaterThanOrEqual(score1)
    })

    it('should return higher score for items with consistent styles', () => {
      const elegantOutfit = [elegantTop, elegantSkirt, elegantShoes]
      const mixedOutfit = [elegantTop, casualSkirt, elegantShoes]
      expect(system.calculateCoordination(elegantOutfit)).toBeGreaterThanOrEqual(
        system.calculateCoordination(mixedOutfit),
      )
    })
  })

  describe('calculatePerformance', () => {
    it('should return base score of 40 for no actions', () => {
      expect(system.calculatePerformance([])).toBe(40)
    })

    it('should add bonus score for each action', () => {
      const score1 = system.calculatePerformance(['twirl'])
      const score2 = system.calculatePerformance(['twirl', 'wave'])
      expect(score1).toBeGreaterThan(40)
      expect(score2).toBeGreaterThan(score1)
    })

    it('should cap at 100', () => {
      const manyActions = Array(20).fill('pose') // pose has 20 bonus
      expect(system.calculatePerformance(manyActions)).toBeLessThanOrEqual(100)
    })

    it('should reward action diversity', () => {
      const diverse = ['twirl', 'wave', 'pose', 'walk']
      const repetitive = ['twirl', 'twirl', 'twirl', 'twirl']
      expect(system.calculatePerformance(diverse)).toBeGreaterThanOrEqual(
        system.calculatePerformance(repetitive),
      )
    })
  })

  describe('calculateCreativity', () => {
    it('should return 0 for empty outfit', () => {
      expect(system.calculateCreativity([])).toBe(0)
    })

    it('should return higher score for rarer items', () => {
      const commonOutfit = [casualTshirt, casualSkirt]
      const rareOutfit = [elegantTop, elegantSkirt]
      expect(system.calculateCreativity(rareOutfit)).toBeGreaterThan(
        system.calculateCreativity(commonOutfit),
      )
    })

    it('should reward style diversity', () => {
      const diverseStyles: Clothing[] = [
        { ...elegantTop, style: ['elegant'] },
        { ...casualSkirt, style: ['cute'] },
        { ...elegantShoes, style: ['glamorous'] },
        { ...elegantHair, style: ['edgy'] },
      ]
      const singleStyle: Clothing[] = [
        { ...elegantTop, style: ['elegant'] },
        { ...elegantSkirt, style: ['elegant'] },
      ]
      expect(system.calculateCreativity(diverseStyles)).toBeGreaterThan(
        system.calculateCreativity(singleStyle),
      )
    })

    it('should cap at 100', () => {
      const legendaryItems = Array(5).fill(legendaryAccessory)
      expect(system.calculateCreativity(legendaryItems)).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateTotalScore', () => {
    it('should apply weights correctly', () => {
      const total = system.calculateTotalScore(100, 100, 100, 100)
      // All weights: 0.4 + 0.3 + 0.2 + 0.1 = 1.0
      expect(total).toBe(100)
    })

    it('should weight style match most heavily', () => {
      const highStyle = system.calculateTotalScore(100, 0, 0, 0)
      const highCoord = system.calculateTotalScore(0, 100, 0, 0)
      expect(highStyle).toBeGreaterThan(highCoord)
    })

    it('should round to nearest integer', () => {
      const total = system.calculateTotalScore(85, 72, 60, 90)
      expect(Number.isInteger(total)).toBe(true)
    })
  })

  describe('getGrade', () => {
    it('should return S grade for score >= 95', () => {
      expect(system.getGrade(95)).toEqual({ grade: 'S', rewardMultiplier: 3.0 })
      expect(system.getGrade(100)).toEqual({ grade: 'S', rewardMultiplier: 3.0 })
    })

    it('should return A grade for score 85-94', () => {
      expect(system.getGrade(85)).toEqual({ grade: 'A', rewardMultiplier: 2.0 })
      expect(system.getGrade(94)).toEqual({ grade: 'A', rewardMultiplier: 2.0 })
    })

    it('should return B grade for score 75-84', () => {
      expect(system.getGrade(75)).toEqual({ grade: 'B', rewardMultiplier: 1.5 })
      expect(system.getGrade(84)).toEqual({ grade: 'B', rewardMultiplier: 1.5 })
    })

    it('should return C grade for score 60-74', () => {
      expect(system.getGrade(60)).toEqual({ grade: 'C', rewardMultiplier: 1.0 })
      expect(system.getGrade(74)).toEqual({ grade: 'C', rewardMultiplier: 1.0 })
    })

    it('should return D grade for score < 60', () => {
      expect(system.getGrade(0)).toEqual({ grade: 'D', rewardMultiplier: 0.5 })
      expect(system.getGrade(59)).toEqual({ grade: 'D', rewardMultiplier: 0.5 })
    })

    it('should handle exact boundary values', () => {
      for (const threshold of GRADE_THRESHOLDS) {
        const result = system.getGrade(threshold.minScore)
        expect(result.grade).toBe(threshold.grade)
      }
    })
  })

  describe('evaluate', () => {
    it('should return complete score breakdown', () => {
      const outfit = [elegantTop, elegantSkirt, elegantShoes, elegantHair, legendaryAccessory]
      const result = system.evaluate(outfit, galaTheme, ['twirl', 'wave'])

      expect(result).toHaveProperty('styleMatch')
      expect(result).toHaveProperty('coordination')
      expect(result).toHaveProperty('performance')
      expect(result).toHaveProperty('creativity')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('grade')
      expect(result).toHaveProperty('rewardMultiplier')
    })

    it('should give high score for matching elegant outfit on gala theme', () => {
      const elegantOutfit = [elegantTop, elegantSkirt, elegantShoes, elegantHair, legendaryAccessory]
      const result = system.evaluate(elegantOutfit, galaTheme, ['twirl', 'pose', 'wave'])
      expect(result.styleMatch).toBe(100)
      expect(result.grade).toMatch(/[SAB]/) // Should be at least B
    })

    it('should give low score for mismatched outfit', () => {
      const casualOutfit = [casualTshirt, casualSkirt]
      const result = system.evaluate(casualOutfit, galaTheme, [])
      expect(result.styleMatch).toBe(0)
      expect(result.grade).toMatch(/[CD]/) // Should be C or D
    })

    it('should give higher total for better outfits', () => {
      const elegantOutfit = [elegantTop, elegantSkirt, elegantShoes, elegantHair, legendaryAccessory]
      const casualOutfit = [casualTshirt, casualSkirt]
      const goodResult = system.evaluate(elegantOutfit, galaTheme, ['twirl', 'pose'])
      const badResult = system.evaluate(casualOutfit, galaTheme, [])
      expect(goodResult.total).toBeGreaterThan(badResult.total)
    })
  })
})
