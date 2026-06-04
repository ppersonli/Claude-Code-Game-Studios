import { describe, it, expect } from 'vitest'
import { PLANETS } from '../../src/games/space-factory-idle/data/planets'
import { RECIPES, getRecipesForPlanet } from '../../src/games/space-factory-idle/data/recipes'
import { UPGRADES, getUpgradesByCategory } from '../../src/games/space-factory-idle/data/upgrades'
import { EMPLOYEES } from '../../src/games/space-factory-idle/data/employees'
import { ACHIEVEMENTS } from '../../src/games/space-factory-idle/data/achievements'
import { translations } from '../../src/games/space-factory-idle/i18n/translations'

describe('Data Integrity', () => {
  describe('Planets', () => {
    it('has unique IDs', () => {
      const ids = PLANETS.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('has valid production line counts', () => {
      for (const planet of PLANETS) {
        expect(planet.productionLines).toBeGreaterThan(0)
        expect(planet.productionLines).toBeLessThanOrEqual(8)
      }
    })
    it('has valid special bonuses', () => {
      for (const planet of PLANETS) {
        expect(planet.specialBonus).toBeGreaterThan(0)
      }
    })
    it('starts with earth at distance 0', () => {
      const earth = PLANETS.find(p => p.id === 'earth')!
      expect(earth.unlockDistance).toBe(0)
    })
    it('distances are in ascending order (excluding galactic)', () => {
      const nonGalactic = PLANETS.filter(p => p.id !== 'galactic' && p.unlockDistance > 0)
      for (let i = 1; i < nonGalactic.length; i++) {
        expect(nonGalactic[i].unlockDistance).toBeGreaterThan(nonGalactic[i - 1].unlockDistance)
      }
    })
  })

  describe('Recipes', () => {
    it('has unique IDs', () => {
      const ids = RECIPES.map(r => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('every planet has at least one recipe', () => {
      for (const planet of PLANETS) {
        const recipes = getRecipesForPlanet(planet.id)
        expect(recipes.length).toBeGreaterThan(0)
      }
    })
    it('has valid base output values', () => {
      for (const recipe of RECIPES) {
        expect(recipe.baseOutput).toBeGreaterThan(0)
      }
    })
    it('has non-negative base costs', () => {
      for (const recipe of RECIPES) {
        expect(recipe.baseCost).toBeGreaterThanOrEqual(0)
      }
    })
    it('costs increase within each planet', () => {
      for (const planet of PLANETS) {
        const recipes = getRecipesForPlanet(planet.id)
        for (let i = 1; i < recipes.length; i++) {
          expect(recipes[i].baseCost).toBeGreaterThanOrEqual(recipes[i - 1].baseCost)
        }
      }
    })
  })

  describe('Upgrades', () => {
    it('has unique IDs', () => {
      const ids = UPGRADES.map(u => u.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('covers all 3 categories', () => {
      const categories = new Set(UPGRADES.map(u => u.category))
      expect(categories.has('production')).toBe(true)
      expect(categories.has('facility')).toBe(true)
      expect(categories.has('economy')).toBe(true)
    })
    it('has valid max levels', () => {
      for (const upgrade of UPGRADES) {
        expect(upgrade.maxLevel).toBeGreaterThan(0)
      }
    })
    it('getUpgradesByCategory returns correct results', () => {
      expect(getUpgradesByCategory('production').length).toBeGreaterThan(0)
      expect(getUpgradesByCategory('facility').length).toBeGreaterThan(0)
      expect(getUpgradesByCategory('economy').length).toBeGreaterThan(0)
      for (const u of getUpgradesByCategory('production')) {
        expect(u.category).toBe('production')
      }
    })
  })

  describe('Employees', () => {
    it('has unique IDs', () => {
      const ids = EMPLOYEES.map(e => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('has valid base costs', () => {
      for (const emp of EMPLOYEES) {
        expect(emp.baseCost).toBeGreaterThan(0)
      }
    })
    it('costs increase with index', () => {
      for (let i = 1; i < EMPLOYEES.length; i++) {
        expect(EMPLOYEES[i].baseCost).toBeGreaterThan(EMPLOYEES[i - 1].baseCost)
      }
    })
  })

  describe('Achievements', () => {
    it('has unique IDs', () => {
      const ids = ACHIEVEMENTS.map(a => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    it('check functions are callable', () => {
      const testState = {
        totalProduced: 0,
        activeLines: 0,
        unlockedPlanets: ['earth'],
        totalCoins: 0,
        prestigeCount: 0,
        allLinesAutomated: false,
        employeeCounts: {},
      }
      for (const ach of ACHIEVEMENTS) {
        expect(typeof ach.check(testState)).toBe('boolean')
      }
    })
  })

  describe('Translations', () => {
    const requiredLocales = ['en', 'pt', 'es', 'id', 'tr', 'ru'] as const

    it('has all required locales', () => {
      for (const locale of requiredLocales) {
        expect(translations[locale]).toBeDefined()
      }
    })
    it('each locale has all keys from English', () => {
      const enKeys = Object.keys(translations.en)
      for (const locale of requiredLocales) {
        if (locale === 'en') continue
        for (const key of enKeys) {
          expect(translations[locale][key]).toBeDefined()
          expect(typeof translations[locale][key]).toBe('string')
          expect(translations[locale][key].length).toBeGreaterThan(0)
        }
      }
    })
    it('English has expected keys', () => {
      const requiredKeys = ['title', 'start', 'continue', 'coins', 'produce', 'sell', 'upgrades', 'prestige', 'achievements']
      for (const key of requiredKeys) {
        expect(translations.en[key]).toBeDefined()
      }
    })
  })
})
