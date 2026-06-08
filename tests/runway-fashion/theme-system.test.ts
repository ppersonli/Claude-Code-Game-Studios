import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeSystem } from '../../src/games/runway-fashion/systems/ThemeSystem'
import type { Theme } from '../../src/games/runway-fashion/data/types'
import { THEMES } from '../../src/games/runway-fashion/data/themes'

describe('ThemeSystem', () => {
  let system: ThemeSystem

  beforeEach(() => {
    system = new ThemeSystem()
  })

  describe('getTheme', () => {
    it('should return theme by id', () => {
      const theme = system.getTheme('evening_gala')
      expect(theme).toBeDefined()
      expect(theme!.name).toBe('Elegant Gala')
    })

    it('should return undefined for unknown id', () => {
      expect(system.getTheme('nonexistent')).toBeUndefined()
    })
  })

  describe('getAvailableThemes', () => {
    it('should return themes unlocked at or below given level', () => {
      const available = system.getAvailableThemes(1)
      // Levels: campus(1), street(1), beach(1), evening_gala(1) = 4 at level 1
      expect(available.length).toBe(4)
      available.forEach(t => expect(t.unlockLevel).toBeLessThanOrEqual(1))
    })

    it('should include higher-level themes at higher levels', () => {
      const atLevel1 = system.getAvailableThemes(1)
      const atLevel5 = system.getAvailableThemes(5)
      expect(atLevel5.length).toBeGreaterThan(atLevel1.length)
    })

    it('should return all themes at max level', () => {
      const available = system.getAvailableThemes(99)
      expect(available.length).toBe(THEMES.length)
    })

    it('should exclude weekly themes from standard list', () => {
      const available = system.getAvailableThemes(99)
      available.forEach(t => expect(t.isWeekly).toBe(false))
    })
  })

  describe('getWeeklyTheme', () => {
    it('should return a theme when one is set', () => {
      const weeklyTheme: Theme = {
        id: 'weekly_neon', name: 'Neon Nights', scene: 'neon_city',
        requiredStyles: ['edgy', 'glamorous'], bonusStyles: ['edgy'],
        timeLimit: 16000, rewardMultiplier: 2.5, unlockLevel: 1, isWeekly: true,
      }
      system.setWeeklyTheme(weeklyTheme)
      expect(system.getWeeklyTheme()).toBe(weeklyTheme)
    })

    it('should return undefined when no weekly theme is set', () => {
      expect(system.getWeeklyTheme()).toBeUndefined()
    })
  })

  describe('isThemeUnlocked', () => {
    it('should return true when player level meets requirement', () => {
      expect(system.isThemeUnlocked('campus', 1)).toBe(true)
      expect(system.isThemeUnlocked('hollywood', 5)).toBe(true)
    })

    it('should return false when player level is too low', () => {
      expect(system.isThemeUnlocked('hollywood', 4)).toBe(false)
    })

    it('should return false for unknown theme', () => {
      expect(system.isThemeUnlocked('nonexistent', 99)).toBe(false)
    })
  })

  describe('getStyleHint', () => {
    it('should return required styles for a theme', () => {
      const hint = system.getStyleHint('evening_gala')
      expect(hint).toEqual(['elegant', 'glamorous'])
    })

    it('should return empty array for unknown theme', () => {
      expect(system.getStyleHint('nonexistent')).toEqual([])
    })
  })

  describe('calculateThemeMatch', () => {
    it('should return 100 for perfect style match', () => {
      const score = system.calculateThemeMatch(
        ['elegant', 'glamorous', 'elegant'],
        'evening_gala'
      )
      expect(score).toBe(100)
    })

    it('should return 0 for no style match', () => {
      const score = system.calculateThemeMatch(
        ['casual', 'cute'],
        'evening_gala'
      )
      expect(score).toBe(0)
    })

    it('should return partial score for partial match', () => {
      const score = system.calculateThemeMatch(
        ['elegant', 'casual', 'cute'],
        'evening_gala'
      )
      // elegant matches, casual doesn't, cute doesn't = 1/3
      expect(score).toBeCloseTo(33.33, 1)
    })

    it('should return 0 for unknown theme', () => {
      const score = system.calculateThemeMatch(['elegant'], 'nonexistent')
      expect(score).toBe(0)
    })

    it('should return 0 for empty style list', () => {
      const score = system.calculateThemeMatch([], 'evening_gala')
      expect(score).toBe(0)
    })
  })

  describe('getThemesByScene', () => {
    it('should return themes matching a scene', () => {
      const themes = system.getThemesByScene('red_carpet')
      expect(themes.length).toBeGreaterThan(0)
      themes.forEach(t => expect(t.scene).toBe('red_carpet'))
    })

    it('should return empty for unknown scene', () => {
      expect(system.getThemesByScene('unknown')).toEqual([])
    })
  })

  describe('getRandomTheme', () => {
    it('should return a theme from available themes', () => {
      const theme = system.getRandomTheme(1)
      expect(theme).toBeDefined()
      expect(theme.unlockLevel).toBeLessThanOrEqual(1)
    })

    it('should eventually return different themes', () => {
      const results = new Set<string>()
      for (let i = 0; i < 50; i++) {
        const theme = system.getRandomTheme(99)
        results.add(theme.id)
      }
      // With 5 themes and 50 tries, we should see multiple distinct themes
      expect(results.size).toBeGreaterThan(1)
    })
  })
})
