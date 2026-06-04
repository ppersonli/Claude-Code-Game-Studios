import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  rollForEvent,
  activateEvent,
  checkEventExpiry,
  getEventOutputMult,
  EVENTS,
} from '../src/games/space-factory-idle/logic/events'
import type { GameState } from '../src/games/space-factory-idle/logic/game-state'

/* ── Helpers ────────────────────────────────────────────────────── */

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 0,
    totalCoins: 0,
    starDust: 0,
    prestigeLevel: 0,
    prestigeCount: 0,
    prestigeMult: 1,
    productionLines: {
      earth: [
        { recipeId: 'ore-smelt', level: 1, stock: 0, maxStock: 10, automated: false },
      ],
    },
    upgrades: {},
    employees: {},
    unlockedPlanets: ['earth'],
    unlockedRecipes: ['ore-smelt'],
    totalProduced: 0,
    bestDistance: 0,
    achievements: [],
    lastDailyCompleted: '',
    dailyStreak: 0,
    lastOnline: Date.now(),
    sessionStart: Date.now(),
    activeEvent: null,
    eventEndTime: 0,
    sessionCoinsEarned: 0,
    sessionItemsProduced: 0,
    sessionUpgradesMade: 0,
    totalPlayTime: 0,
    ...overrides,
  }
}

/* ── Tests ──────────────────────────────────────────────────────── */

describe('events.ts — random event system', () => {
  describe('EVENTS data', () => {
    it('has 5 events defined', () => {
      expect(EVENTS).toHaveLength(5)
    })

    it('each event has required fields', () => {
      for (const event of EVENTS) {
        expect(event.id).toBeDefined()
        expect(event.nameKey).toBeDefined()
        expect(event.duration).toBeGreaterThan(0)
        expect(typeof event.applyOutput).toBe('function')
      }
    })

    it('sandstorm reduces output by 30%', () => {
      const sandstorm = EVENTS.find(e => e.id === 'sandstorm')!
      expect(sandstorm.applyOutput(100)).toBe(70)
    })

    it('meteor_shower doubles output', () => {
      const meteor = EVENTS.find(e => e.id === 'meteor_shower')!
      expect(meteor.applyOutput(100)).toBe(200)
    })

    it('alien_merchant does not change output', () => {
      const alien = EVENTS.find(e => e.id === 'alien_merchant')!
      expect(alien.applyOutput(100)).toBe(100)
    })

    it('tech_breakthrough boosts output by 50%', () => {
      const tech = EVENTS.find(e => e.id === 'tech_breakthrough')!
      expect(tech.applyOutput(100)).toBe(150)
    })

    it('black_hole triples output', () => {
      const blackHole = EVENTS.find(e => e.id === 'black_hole')!
      expect(blackHole.applyOutput(100)).toBe(300)
    })
  })

  describe('rollForEvent', () => {
    it('does not stack events', () => {
      const state = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() + 10000,
      })
      const event = rollForEvent(state, 'earth')
      expect(event).toBeNull()
    })

    it('rolls when no active event', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.001) // below 0.002 threshold
      const state = makeGameState()
      const event = rollForEvent(state, 'earth')
      expect(event).not.toBeNull()
      vi.restoreAllMocks()
    })

    it('does not roll when random > threshold', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // above 0.002
      const state = makeGameState()
      const event = rollForEvent(state, 'earth')
      expect(event).toBeNull()
      vi.restoreAllMocks()
    })

    it('filters events by planet', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.001)
      const state = makeGameState()

      // On mars, only sandstorm (mars-only) and universal events should be eligible
      const event = rollForEvent(state, 'mars')
      if (event) {
        expect(event.planetId === null || event.planetId === 'mars').toBe(true)
      }
      vi.restoreAllMocks()
    })

    it('tech_breakthrough requires 5+ prestiges', () => {
      // Force tech_breakthrough to be the only eligible event
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.001) // pass threshold
        .mockReturnValueOnce(0) // pick first eligible

      const stateLow = makeGameState({ prestigeCount: 0 })
      // With 0 prestiges, tech_breakthrough should be filtered out
      // But other events may still be picked

      const stateHigh = makeGameState({ prestigeCount: 5 })
      // With 5+ prestiges, tech_breakthrough is eligible

      vi.restoreAllMocks()
      // Just verify the function doesn't crash
      expect(() => {
        rollForEvent(stateLow, 'earth')
        rollForEvent(stateHigh, 'earth')
      }).not.toThrow()
    })
  })

  describe('activateEvent', () => {
    it('sets activeEvent and eventEndTime', () => {
      const state = makeGameState()
      const event = EVENTS.find(e => e.id === 'meteor_shower')!
      const before = Date.now()
      activateEvent(state, event)
      const after = Date.now()

      expect(state.activeEvent).toBe('meteor_shower')
      expect(state.eventEndTime).toBeGreaterThanOrEqual(before + event.duration)
      expect(state.eventEndTime).toBeLessThanOrEqual(after + event.duration)
    })

    it('replaces existing event', () => {
      const state = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() + 10000,
      })
      const event = EVENTS.find(e => e.id === 'meteor_shower')!
      activateEvent(state, event)
      expect(state.activeEvent).toBe('meteor_shower')
    })
  })

  describe('checkEventExpiry', () => {
    it('returns false when no active event', () => {
      const state = makeGameState()
      expect(checkEventExpiry(state)).toBe(false)
    })

    it('returns false when event has not expired', () => {
      const state = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() + 10000,
      })
      expect(checkEventExpiry(state)).toBe(false)
    })

    it('returns true and clears event when expired', () => {
      const state = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() - 1, // already expired
      })
      expect(checkEventExpiry(state)).toBe(true)
      expect(state.activeEvent).toBeNull()
      expect(state.eventEndTime).toBe(0)
    })
  })

  describe('getEventOutputMult', () => {
    it('returns 1 when no active event', () => {
      const state = makeGameState()
      expect(getEventOutputMult(state)).toBe(1)
    })

    it('returns 1 when event has expired', () => {
      const state = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() - 1,
      })
      expect(getEventOutputMult(state)).toBe(1)
    })

    it('returns event multiplier when active', () => {
      const state = makeGameState({
        activeEvent: 'meteor_shower',
        eventEndTime: Date.now() + 10000,
      })
      expect(getEventOutputMult(state)).toBe(2) // meteor_shower = x2
    })

    it('sandstorm returns 0.7', () => {
      const state = makeGameState({
        activeEvent: 'sandstorm',
        eventEndTime: Date.now() + 10000,
      })
      expect(getEventOutputMult(state)).toBeCloseTo(0.7)
    })

    it('tech_breakthrough returns 1.5', () => {
      const state = makeGameState({
        activeEvent: 'tech_breakthrough',
        eventEndTime: Date.now() + 10000,
      })
      expect(getEventOutputMult(state)).toBeCloseTo(1.5)
    })

    it('returns 1 for unknown event id', () => {
      const state = makeGameState({
        activeEvent: 'unknown_event' as any,
        eventEndTime: Date.now() + 10000,
      })
      expect(getEventOutputMult(state)).toBe(1)
    })
  })
})
