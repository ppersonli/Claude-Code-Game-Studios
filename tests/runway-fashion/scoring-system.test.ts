import { describe, it, expect } from 'vitest'
import { ScoringSystem } from '../../src/games/runway-fashion/systems/ScoringSystem'
import type { Clothing, Theme } from '../../src/games/runway-fashion/data/types'
import { SCORING_CONFIG, GRADE_THRESHOLDS } from '../../src/games/runway-fashion/data/scoring'

describe('ScoringSystem', () => {
  const scoring = new ScoringSystem()

  // Reusable test fixtures
  const elegantTop: Clothing = {
    id: 'top_evening', name: 'Evening Top', category: 'top',
    style: ['glamorous', 'elegant'], color: '#8B0000', rarity: 'rare',
    unlockLevel: 3, price: 500, image: 'top_evening.webp',
  }
  const elegantBottom: Clothing = {
    id: 'bottom_evening', name: 'Evening Gown', category: 'bottom',
    style: ['glamorous', 'elegant'], color: '#FFD700', rarity: 'rare',
    unlockLevel: 3, price: 600, image: 'bottom_evening.webp',
  }
  const elegantShoes: Clothing = {
    id: 'shoes_heels', name: 'High Heels', category: 'shoes',
    style: ['elegant', 'glamorous'], color: '#FF0000', rarity: 'rare',
    unlockLevel: 2, price: 300, image: 'shoes_heels.webp',
  }
  const casualTop: Clothing = {
    id: 'top_tshirt', name: 'Basic Tee', category: 'top',
    style: ['casual', 'cute'], color: '#FF6B9D', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'top_tshirt.webp',
  }
  const casualBottom: Clothing = {
    id: 'bottom_jeans', name: 'Jeans', category: 'bottom',
    style: ['casual', 'edgy'], color: '#4169E1', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'bottom_jeans.webp',
  }
  const casualShoes: Clothing = {
    id: 'shoes_sneakers', name: 'Sneakers', category: 'shoes',
    style: ['casual', 'cute'], color: '#FFFFFF', rarity: 'common',
    unlockLevel: 1, price: 0, image: 'shoes_sneakers.webp',
  }

  const galaTheme: Theme = {
    id: 'evening_gala', name: 'Elegant Gala', scene: 'red_carpet',
    requiredStyles: ['elegant', 'glamorous'], bonusStyles: ['elegant'],
    timeLimit: 18000, rewardMultiplier: 1.5, unlockLevel: 1, isWeekly: false,
  }

  const campusTheme: Theme = {
    id: 'campus', name: 'Campus Chic', scene: 'campus',
    requiredStyles: ['cute', 'casual'], bonusStyles: ['cute'],
    timeLimit: 15000, rewardMultiplier: 1.0, unlockLevel: 1, isWeekly: false,
  }

  describe('calculateStyleMatch', () => {
    it('should return 100 when all clothing matches theme styles', () => {
      const outfit = [elegantTop, elegantBottom, elegantShoes]
      const score = scoring.calculateStyleMatch(outfit, galaTheme)
      expect(score).toBe(100)
    })

    it('should return 0 when no clothing matches theme styles', () => {
      const outfit = [casualTop, casualBottom, casualShoes]
      const score = scoring.calculateStyleMatch(outfit, galaTheme)
      expect(score).toBe(0)
    })

    it('should return partial score when some clothing matches', () => {
      const outfit = [elegantTop, casualBottom, casualShoes]
      const score = scoring.calculateStyleMatch(outfit, galaTheme)
      // elegantTop matches (elegant/glamorous), casualBottom doesn't, casualShoes doesn't
      expect(score).toBeCloseTo(33.33, 1)
    })

    it('should return 100 for casual outfit on campus theme', () => {
      const outfit = [casualTop, casualBottom, casualShoes]
      const score = scoring.calculateStyleMatch(outfit, campusTheme)
      expect(score).toBe(100)
    })

    it('should handle empty clothing array', () => {
      const score = scoring.calculateStyleMatch([], galaTheme)
      expect(score).toBe(0)
    })

    it('should handle single item matching one of multiple required styles', () => {
      const casualItem: Clothing = {
        id: 'acc_bag', name: 'Handbag', category: 'accessory',
        style: ['casual', 'cute'], color: '#FF6B9D', rarity: 'common',
        unlockLevel: 1, price: 0, image: 'acc_bag.webp',
      }
      const score = scoring.calculateStyleMatch([casualItem], campusTheme)
      expect(score).toBe(100)
    })
  })

  describe('calculateCoordination', () => {
    it('should return high score for monochrome outfit (harmonious colors)', () => {
      const outfit: Clothing[] = [
        { ...elegantTop, color: '#FF0000' },
        { ...elegantBottom, color: '#FF0000' },
        { ...elegantShoes, color: '#FF0000' },
      ]
      const score = scoring.calculateCoordination(outfit)
      expect(score).toBeGreaterThanOrEqual(80)
    })

    it('should return lower score for clashing colors', () => {
      const outfit: Clothing[] = [
        { ...elegantTop, color: '#FF0000' },
        { ...elegantBottom, color: '#00FF00' },
        { ...elegantShoes, color: '#0000FF' },
      ]
      const score = scoring.calculateCoordination(outfit)
      expect(score).toBeLessThan(50)
    })

    it('should return high score for same-style clothing', () => {
      const outfit = [elegantTop, elegantBottom, elegantShoes]
      const score = scoring.calculateCoordination(outfit)
      expect(score).toBeGreaterThanOrEqual(60)
    })

    it('should return lower score for mixed styles', () => {
      const outfit = [elegantTop, casualBottom, casualShoes]
      const score = scoring.calculateCoordination(outfit)
      expect(score).toBeLessThan(50)
    })

    it('should return 0 for empty outfit', () => {
      const score = scoring.calculateCoordination([])
      expect(score).toBe(0)
    })

    it('should return 100 for single item (perfect coordination)', () => {
      const score = scoring.calculateCoordination([elegantTop])
      expect(score).toBe(100)
    })
  })

  describe('calculatePerformance', () => {
    it('should return base score with no actions', () => {
      const score = scoring.calculatePerformance([])
      expect(score).toBeGreaterThanOrEqual(30)
      expect(score).toBeLessThanOrEqual(50)
    })

    it('should increase score with actions', () => {
      const actions = ['walk', 'twirl', 'pose'] as const
      const score = scoring.calculatePerformance([...actions])
      expect(score).toBeGreaterThan(50)
    })

    it('should cap at 100', () => {
      const manyActions = Array(10).fill('pose')
      const score = scoring.calculatePerformance(manyActions)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should reward varied actions more than repeated ones', () => {
      const varied = scoring.calculatePerformance(['walk', 'twirl', 'pose', 'wave'])
      const repeated = scoring.calculatePerformance(['walk', 'walk', 'walk', 'walk'])
      expect(varied).toBeGreaterThan(repeated)
    })
  })

  describe('calculateCreativity', () => {
    it('should give bonus for rare items', () => {
      const outfit = [elegantTop, elegantBottom, elegantShoes]
      const score = scoring.calculateCreativity(outfit)
      expect(score).toBeGreaterThan(50)
    })

    it('should give lower score for all-common items', () => {
      const outfit = [casualTop, casualBottom, casualShoes]
      const score = scoring.calculateCreativity(outfit)
      expect(score).toBeLessThan(50)
    })

    it('should reward style diversity', () => {
      const diverseOutfit: Clothing[] = [
        { ...elegantTop, style: ['elegant'] },
        { ...elegantBottom, style: ['casual'] },
        { ...elegantShoes, style: ['edgy'] },
      ]
      const sameStyleOutfit: Clothing[] = [
        { ...elegantTop, style: ['elegant'] },
        { ...elegantBottom, style: ['elegant'] },
        { ...elegantShoes, style: ['elegant'] },
      ]
      const diverse = scoring.calculateCreativity(diverseOutfit)
      const same = scoring.calculateCreativity(sameStyleOutfit)
      expect(diverse).toBeGreaterThan(same)
    })

    it('should return 0 for empty outfit', () => {
      expect(scoring.calculateCreativity([])).toBe(0)
    })
  })

  describe('calculateTotalScore', () => {
    it('should return weighted average of all dimensions', () => {
      const total = scoring.calculateTotalScore(100, 100, 100, 100)
      expect(total).toBe(100)
    })

    it('should return 0 when all dimensions are 0', () => {
      const total = scoring.calculateTotalScore(0, 0, 0, 0)
      expect(total).toBe(0)
    })

    it('should use correct weights from config', () => {
      // Only style match = 100, rest = 0
      const total = scoring.calculateTotalScore(100, 0, 0, 0)
      expect(total).toBe(Math.round(100 * SCORING_CONFIG.styleMatchWeight))
    })

    it('should round to nearest integer', () => {
      const total = scoring.calculateTotalScore(33, 33, 33, 33)
      const expected = Math.round(
        33 * SCORING_CONFIG.styleMatchWeight +
        33 * SCORING_CONFIG.coordinationWeight +
        33 * SCORING_CONFIG.performanceWeight +
        33 * SCORING_CONFIG.creativityWeight
      )
      expect(total).toBe(expected)
    })
  })

  describe('getGrade', () => {
    it('should return S for 95-100', () => {
      expect(scoring.getGrade(100).grade).toBe('S')
      expect(scoring.getGrade(95).grade).toBe('S')
    })

    it('should return A for 85-94', () => {
      expect(scoring.getGrade(94).grade).toBe('A')
      expect(scoring.getGrade(85).grade).toBe('A')
    })

    it('should return B for 75-84', () => {
      expect(scoring.getGrade(84).grade).toBe('B')
      expect(scoring.getGrade(75).grade).toBe('B')
    })

    it('should return C for 60-74', () => {
      expect(scoring.getGrade(74).grade).toBe('C')
      expect(scoring.getGrade(60).grade).toBe('C')
    })

    it('should return D for below 60', () => {
      expect(scoring.getGrade(59).grade).toBe('D')
      expect(scoring.getGrade(0).grade).toBe('D')
    })

    it('should return correct reward multiplier for each grade', () => {
      expect(scoring.getGrade(100).rewardMultiplier).toBe(3.0)
      expect(scoring.getGrade(90).rewardMultiplier).toBe(2.0)
      expect(scoring.getGrade(80).rewardMultiplier).toBe(1.5)
      expect(scoring.getGrade(65).rewardMultiplier).toBe(1.0)
      expect(scoring.getGrade(30).rewardMultiplier).toBe(0.5)
    })
  })

  describe('evaluate', () => {
    it('should produce a complete score breakdown', () => {
      const outfit = [elegantTop, elegantBottom, elegantShoes]
      const result = scoring.evaluate(outfit, galaTheme, ['walk', 'twirl', 'pose'])

      expect(result).toHaveProperty('styleMatch')
      expect(result).toHaveProperty('coordination')
      expect(result).toHaveProperty('performance')
      expect(result).toHaveProperty('creativity')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('grade')
      expect(result).toHaveProperty('rewardMultiplier')
    })

    it('should produce S-grade for perfect elegant outfit on gala theme', () => {
      const outfit = [elegantTop, elegantBottom, elegantShoes]
      const result = scoring.evaluate(outfit, galaTheme, ['walk', 'twirl', 'pose'])
      expect(result.total).toBeGreaterThanOrEqual(85)
    })

    it('should produce low score for casual outfit on gala theme', () => {
      const outfit = [casualTop, casualBottom, casualShoes]
      const result = scoring.evaluate(outfit, galaTheme, ['walk'])
      expect(result.total).toBeLessThan(60)
    })
  })
})
