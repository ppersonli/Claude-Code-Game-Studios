import { describe, it, expect } from 'vitest'
import {
  getEncyclopediaPlanets,
  getEncyclopediaRecipes,
  getEncyclopediaEmployees,
  getCollectionProgress,
  type EncyclopediaEntry,
} from '../../src/games/space-factory-idle/data/encyclopedia'
import type { GameState } from '../../src/games/space-factory-idle/logic/game-state'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0, totalCoins: 0, starDust: 0,
    prestigeLevel: 0, prestigeCount: 0, prestigeMult: 1,
    productionLines: {},
    upgrades: {},
    employees: {},
    unlockedPlanets: ['earth'],
    unlockedRecipes: ['ore-smelt'],
    totalProduced: 0, bestDistance: 0,
    achievements: [],
    lastDailyCompleted: '', dailyStreak: 0,
    lastOnline: 0, sessionStart: 0,
    sessionCoinsEarned: 0, sessionItemsProduced: 0, sessionUpgradesMade: 0,
    totalPlayTime: 0,
    activeEvent: null, eventEndTime: 0,
    ...overrides,
  } as GameState
}

describe('Encyclopedia', () => {
  describe('getEncyclopediaPlanets', () => {
    it('returns all 6 planets', () => {
      const entries = getEncyclopediaPlanets(makeState())
      expect(entries).toHaveLength(6)
    })
    it('marks earth as discovered by default', () => {
      const entries = getEncyclopediaPlanets(makeState())
      const earth = entries.find(e => e.id === 'earth')!
      expect(earth.discovered).toBe(true)
    })
    it('marks non-unlocked planets as undiscovered', () => {
      const entries = getEncyclopediaPlanets(makeState())
      const moon = entries.find(e => e.id === 'moon')!
      expect(moon.discovered).toBe(false)
    })
    it('marks unlocked planets as discovered', () => {
      const state = makeState({ unlockedPlanets: ['earth', 'moon', 'mars'] })
      const entries = getEncyclopediaPlanets(state)
      expect(entries.find(e => e.id === 'earth')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'moon')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'mars')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'europa')!.discovered).toBe(false)
    })
    it('each discovered entry has name, description, icon, and stats', () => {
      const entries = getEncyclopediaPlanets(makeState())
      const discovered = entries.filter(e => e.discovered)
      expect(discovered.length).toBeGreaterThan(0)
      for (const entry of discovered) {
        expect(entry.name).toBeTruthy()
        expect(entry.description).toBeTruthy()
        expect(entry.icon).toBeTruthy()
        expect(entry.stats).toBeDefined()
        expect(entry.stats!.length).toBeGreaterThan(0)
      }
    })
    it('discovered entries have visible descriptions, undiscovered show ???', () => {
      const entries = getEncyclopediaPlanets(makeState())
      const earth = entries.find(e => e.id === 'earth')!
      const moon = entries.find(e => e.id === 'moon')!
      expect(earth.description).not.toContain('???')
      expect(moon.description).toBe('???')
    })
  })

  describe('getEncyclopediaRecipes', () => {
    it('returns all 14 recipes', () => {
      const entries = getEncyclopediaRecipes(makeState())
      expect(entries).toHaveLength(14)
    })
    it('marks unlocked recipes as discovered', () => {
      const state = makeState({ unlockedRecipes: ['ore-smelt', 'metal-work'] })
      const entries = getEncyclopediaRecipes(state)
      expect(entries.find(e => e.id === 'ore-smelt')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'metal-work')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'electronics')!.discovered).toBe(false)
    })
    it('each discovered entry has name, planetId, and stats', () => {
      const entries = getEncyclopediaRecipes(makeState({ unlockedRecipes: ['ore-smelt'] }))
      const discovered = entries.filter(e => e.discovered)
      for (const entry of discovered) {
        expect(entry.name).toBeTruthy()
        expect(entry.planetId).toBeTruthy()
        expect(entry.stats).toBeDefined()
      }
    })
    it('undiscovered recipes show ??? for name', () => {
      const entries = getEncyclopediaRecipes(makeState())
      const undiscovered = entries.find(e => !e.discovered)!
      expect(undiscovered.name).toBe('???')
    })
    it('discovered recipes show real name and output/price stats', () => {
      const entries = getEncyclopediaRecipes(makeState({ unlockedRecipes: ['ore-smelt'] }))
      const ore = entries.find(e => e.id === 'ore-smelt')!
      expect(ore.name).toBe('Ore Smelt')
      expect(ore.stats).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: expect.any(String) }),
      ]))
    })
  })

  describe('getEncyclopediaEmployees', () => {
    it('returns all 5 employees', () => {
      const entries = getEncyclopediaEmployees(makeState())
      expect(entries).toHaveLength(5)
    })
    it('marks hired employees as discovered', () => {
      const state = makeState({ employees: { intern: 2, engineer: 1 } })
      const entries = getEncyclopediaEmployees(state)
      expect(entries.find(e => e.id === 'intern')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'engineer')!.discovered).toBe(true)
      expect(entries.find(e => e.id === 'scientist')!.discovered).toBe(false)
    })
    it('undiscovered employees show ??? for name and description', () => {
      const entries = getEncyclopediaEmployees(makeState())
      const undiscovered = entries.find(e => !e.discovered)!
      expect(undiscovered.name).toBe('???')
      expect(undiscovered.description).toBe('???')
    })
    it('discovered employees show real name and effect', () => {
      const state = makeState({ employees: { intern: 1 } })
      const entries = getEncyclopediaEmployees(state)
      const intern = entries.find(e => e.id === 'intern')!
      expect(intern.name).toBe('Intern')
      expect(intern.description).not.toBe('???')
    })
  })

  describe('getCollectionProgress', () => {
    it('returns counts for each category', () => {
      const progress = getCollectionProgress(makeState())
      expect(progress.planets.discovered).toBe(1)
      expect(progress.planets.total).toBe(6)
      expect(progress.recipes.discovered).toBe(1)
      expect(progress.recipes.total).toBe(14)
      expect(progress.employees.discovered).toBe(0)
      expect(progress.employees.total).toBe(5)
    })
    it('updates when state changes', () => {
      const state = makeState({
        unlockedPlanets: ['earth', 'moon'],
        unlockedRecipes: ['ore-smelt', 'metal-work', 'helium3'],
        employees: { intern: 1 },
      })
      const progress = getCollectionProgress(state)
      expect(progress.planets.discovered).toBe(2)
      expect(progress.recipes.discovered).toBe(3)
      expect(progress.employees.discovered).toBe(1)
    })
    it('overall percentage is correct', () => {
      const state = makeState({
        unlockedPlanets: ['earth', 'moon'],
        unlockedRecipes: ['ore-smelt', 'metal-work', 'helium3'],
        employees: { intern: 1 },
      })
      const progress = getCollectionProgress(state)
      // 2 + 3 + 1 = 6 discovered out of 6 + 14 + 5 = 25 total
      expect(progress.overall.discovered).toBe(6)
      expect(progress.overall.total).toBe(25)
      expect(progress.overall.percent).toBeCloseTo(6 / 25)
    })
  })
})
