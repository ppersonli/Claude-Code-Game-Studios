import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeSystem } from '../../src/games/runway-fashion/systems/ThemeSystem'
import type { Theme } from '../../src/games/runway-fashion/data/types'

describe('ThemeSystem', () => {
  let system: ThemeSystem

  const customTheme: Theme = {
    id: 'custom_test',
    name: 'Custom Theme',
    scene: 'test',
    requiredStyles: ['elegant'],
    bonusStyles: ['glamorous'],
    timeLimit: 15000,
    rewardMultiplier: 1.0,
    unlockLevel: 10,
    isWeekly: false,
  }

  beforeEach(() => {
    system = new ThemeSystem()
  })

  describe('getTheme', () => {
    it('should return undefined for non-existent theme', () => {
      expect(system.getTheme('nonexistent')).toBeUndefined()
    })

    it('should return theme by id', () => {
      const theme = system.getTheme('evening_gala')
      expect(theme).toBeDefined()
      expect(theme?.name).toBe('Elegant Gala')
    })

    it('should return undefined for empty string', () => {
      expect(system.getTheme('')).toBeUndefined()
    })
  })

  describe('getAvailableThemes', () => {
    it('should return themes unlocked at player level', () => {
      const themes = system.getAvailableThemes(1)
      expect(themes.length).toBeGreaterThan(0)
      // All returned themes should have unlockLevel <= 1
      for (const theme of themes) {
        expect(theme.unlockLevel).toBeLessThanOrEqual(1)
        expect(theme.isWeekly).toBe(false)
      }
    })

    it('should return more themes at higher level', () => {
      const level1Themes = system.getAvailableThemes(1)
      const level5Themes = system.getAvailableThemes(5)
      expect(level5Themes.length).toBeGreaterThanOrEqual(level1Themes.length)
    })

    it('should exclude weekly themes', () => {
      const themes = system.getAvailableThemes(100)
      for (const theme of themes) {
        expect(theme.isWeekly).toBe(false)
      }
    })
  })

  describe('getWeeklyTheme', () => {
    it('should return undefined when no weekly theme set', () => {
      expect(system.getWeeklyTheme()).toBeUndefined()
    })

    it('should return the set weekly theme', () => {
      const weekly: Theme = {
        ...customTheme,
        id: 'weekly_1',
        isWeekly: true,
        unlockLevel: 1,
      }
      system.setWeeklyTheme(weekly)
      expect(system.getWeeklyTheme()).toBe(weekly)
    })
  })

  describe('setWeeklyTheme', () => {
    it('should set the weekly theme', () => {
      const weekly: Theme = {
        ...customTheme,
        id: 'weekly_1',
        isWeekly: true,
      }
      system.setWeeklyTheme(weekly)
      expect(system.getWeeklyTheme()?.id).toBe('weekly_1')
    })

    it('should add weekly theme to themes list if not present', () => {
      const weekly: Theme = {
        ...customTheme,
        id: 'brand_new_weekly',
        isWeekly: true,
      }
      system.setWeeklyTheme(weekly)
      expect(system.getTheme('brand_new_weekly')).toBeDefined()
    })

    it('should not duplicate if already present', () => {
      // Use an existing theme id from THEMES
      const existingTheme = system.getTheme('evening_gala')!
      system.setWeeklyTheme(existingTheme)
      // Should still only have the original 5 themes (weekly is set but not added as new)
      const allThemes = system.getAvailableThemes(100)
      const eveningCount = allThemes.filter(t => t.id === 'evening_gala').length
      expect(eveningCount).toBe(1)
    })
  })

  describe('isThemeUnlocked', () => {
    it('should return false for non-existent theme', () => {
      expect(system.isThemeUnlocked('nonexistent', 100)).toBe(false)
    })

    it('should return true when player level meets requirement', () => {
      expect(system.isThemeUnlocked('evening_gala', 1)).toBe(true)
    })

    it('should return false when player level is too low', () => {
      // hollywood has unlockLevel: 5
      expect(system.isThemeUnlocked('hollywood', 1)).toBe(false)
    })

    it('should return true at exact unlock level', () => {
      expect(system.isThemeUnlocked('hollywood', 5)).toBe(true)
    })
  })

  describe('getStyleHint', () => {
    it('should return empty array for non-existent theme', () => {
      expect(system.getStyleHint('nonexistent')).toEqual([])
    })

    it('should return required styles for valid theme', () => {
      const hints = system.getStyleHint('evening_gala')
      expect(hints).toEqual(['elegant', 'glamorous'])
    })

    it('should return a copy, not the original array', () => {
      const hints1 = system.getStyleHint('evening_gala')
      const hints2 = system.getStyleHint('evening_gala')
      expect(hints1).toEqual(hints2)
      expect(hints1).not.toBe(hints2) // different references
    })
  })

  describe('calculateThemeMatch', () => {
    it('should return 0 for empty outfit styles', () => {
      expect(system.calculateThemeMatch([], 'evening_gala')).toBe(0)
    })

    it('should return 0 for non-existent theme', () => {
      expect(system.calculateThemeMatch(['elegant'], 'nonexistent')).toBe(0)
    })

    it('should return 100 when all styles match', () => {
      expect(system.calculateThemeMatch(['elegant', 'glamorous'], 'evening_gala')).toBe(100)
    })

    it('should return 0 when no styles match', () => {
      expect(system.calculateThemeMatch(['casual', 'cute'], 'evening_gala')).toBe(0)
    })

    it('should return partial score for partial matches', () => {
      // evening_gala needs ['elegant', 'glamorous']
      // input has 1 matching out of 3 total
      expect(system.calculateThemeMatch(['elegant', 'casual', 'cute'], 'evening_gala')).toBeCloseTo(33.33, 0)
    })
  })

  describe('getThemesByScene', () => {
    it('should return themes matching the scene', () => {
      const redCarpetThemes = system.getThemesByScene('red_carpet')
      expect(redCarpetThemes.length).toBeGreaterThan(0)
      for (const theme of redCarpetThemes) {
        expect(theme.scene).toBe('red_carpet')
      }
    })

    it('should return empty array for non-existent scene', () => {
      expect(system.getThemesByScene('nonexistent_scene')).toEqual([])
    })
  })

  describe('getRandomTheme', () => {
    it('should return a theme from available themes', () => {
      const theme = system.getRandomTheme(1)
      expect(theme).toBeDefined()
      expect(theme.unlockLevel).toBeLessThanOrEqual(1)
    })

    it('should return different themes on multiple calls (probabilistic)', () => {
      const results = new Set<string>()
      for (let i = 0; i < 20; i++) {
        results.add(system.getRandomTheme(1).id)
      }
      // With 3+ themes at level 1, should get at least 2 different ones
      expect(results.size).toBeGreaterThanOrEqual(2)
    })
  })
})
