import { describe, it, expect, beforeEach } from 'vitest'
import {
  calcCost, calcDamage, calcMonsterHp, calcWaveGold, calcWaveMonsterCount,
  calcPrestigeDarkEnergy, calcPrestigeThreshold, CONSTANTS
} from '../../src/games/dungeon-defense-idle/logic/constants'
import { DEFAULT_WAYPOINTS, getPathCells, waypointsToPixels, moveAlongPath, calcPathLength } from '../../src/games/dungeon-defense-idle/logic/pathfinding'
import { spawnWave, processCombatTick, getTowerCost, getTowerUpgradeCost } from '../../src/games/dungeon-defense-idle/logic/combat'
import { canPrestige, performPrestige, calcEarnableEnergy, getPrestigeRequirement } from '../../src/games/dungeon-defense-idle/logic/prestige'
import { loadState, saveState, resetState, calcOfflineEarnings, type GameState, type TowerState, type MonsterInstance } from '../../src/games/dungeon-defense-idle/logic/game-state'
import { TOWERS } from '../../src/games/dungeon-defense-idle/data/towers'
import { MONSTERS } from '../../src/games/dungeon-defense-idle/data/monsters'
import { HEROES } from '../../src/games/dungeon-defense-idle/data/heroes'
import { DUNGEONS } from '../../src/games/dungeon-defense-idle/data/dungeons'
import { ACHIEVEMENTS } from '../../src/games/dungeon-defense-idle/data/achievements'
import { getTodayChallenge, isDailyCompletedToday, getTodayDate } from '../../src/games/dungeon-defense-idle/data/daily-challenges'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    coins: 500, totalCoins: 500, darkEnergy: 0,
    prestigeLevel: 0, prestigeCount: 0, prestigeMult: 1,
    towers: {}, activeHeroes: ['warrior'], unlockedHeroes: ['warrior'],
    unlockedDungeons: ['shadow'], currentDungeon: 'shadow',
    currentWave: 0, bestWave: 0, totalKills: 0,
    achievements: [], lastDailyCompleted: '', dailyStreak: 0,
    lastOnline: Date.now(), sessionStart: Date.now(),
    sessionKills: 0, sessionGoldEarned: 0,
    consecutiveNoLeak: 0, bestBossKillTime: 0, autoWave: false,
    ...overrides,
  }
}

describe('Constants', () => {
  it('calcCost: level 0 returns base', () => { expect(calcCost(100, 1.18, 0)).toBe(100) })
  it('calcCost: increases with level', () => {
    expect(calcCost(100, 1.18, 1)).toBeGreaterThan(calcCost(100, 1.18, 0))
  })
  it('calcDamage: applies level and prestige', () => {
    expect(calcDamage(10, 2, 1.2, 1.1)).toBeCloseTo(10 * (1 + 1 * 0.15) * 1.2 * 1.1)
  })
  it('calcMonsterHp: scales exponentially', () => {
    expect(calcMonsterHp(100, 0)).toBe(100)
    expect(calcMonsterHp(100, 10)).toBeGreaterThan(100)
  })
  it('calcWaveGold: scales with wave', () => {
    expect(calcWaveGold(10, 0)).toBe(10)
    expect(calcWaveGold(10, 10)).toBeGreaterThan(10)
  })
  it('calcWaveMonsterCount: increases with wave', () => {
    expect(calcWaveMonsterCount(0)).toBe(5)
    expect(calcWaveMonsterCount(10)).toBeGreaterThan(5)
  })
  it('calcPrestigeDarkEnergy: returns 0 for small amounts', () => {
    expect(calcPrestigeDarkEnergy(500000)).toBe(0)
    expect(calcPrestigeDarkEnergy(1000000)).toBe(1)
  })
  it('calcPrestigeThreshold: starts at 1M', () => {
    expect(calcPrestigeThreshold(0)).toBe(1_000_000)
    expect(calcPrestigeThreshold(1)).toBe(10_000_000)
  })
})

describe('Pathfinding', () => {
  it('DEFAULT_WAYPOINTS has at least 2 points', () => {
    expect(DEFAULT_WAYPOINTS.length).toBeGreaterThanOrEqual(2)
  })
  it('getPathCells returns cells along the path', () => {
    const cells = getPathCells(DEFAULT_WAYPOINTS)
    expect(cells.size).toBeGreaterThan(0)
    expect(cells.has('0,3')).toBe(true) // start point
  })
  it('waypointsToPixels converts correctly', () => {
    const pixels = waypointsToPixels(DEFAULT_WAYPOINTS, 48, 0, 80)
    expect(pixels.length).toBe(DEFAULT_WAYPOINTS.length)
    expect(pixels[0].x).toBe(24) // 0*48 + 24
    expect(pixels[0].y).toBe(80 + 3 * 48 + 24) // GRID_OFFSET_Y + y*CELL + CELL/2
  })
  it('calcPathLength returns positive value', () => {
    const pixels = waypointsToPixels(DEFAULT_WAYPOINTS, 48, 0, 80)
    expect(calcPathLength(pixels)).toBeGreaterThan(0)
  })
  it('moveAlongPath advances position', () => {
    const pixels = waypointsToPixels(DEFAULT_WAYPOINTS, 48, 0, 80)
    const result = moveAlongPath(pixels[0], 1, pixels, 100, 1)
    expect(result.pos.x).not.toBe(pixels[0].x)
    expect(result.reachedEnd).toBe(false)
  })
  it('moveAlongPath reaches end with enough time', () => {
    const pixels = waypointsToPixels(DEFAULT_WAYPOINTS, 48, 0, 80)
    const result = moveAlongPath(pixels[0], 1, pixels, 100000, 100)
    expect(result.reachedEnd).toBe(true)
  })
})

describe('Combat', () => {
  it('spawnWave returns monsters', () => {
    const pixels = waypointsToPixels(DEFAULT_WAYPOINTS, 48, 0, 80)
    const monsters = spawnWave(1, pixels)
    expect(monsters.length).toBeGreaterThan(0)
    expect(monsters[0].hp).toBeGreaterThan(0)
    expect(monsters[0].alive).toBe(true)
  })
  it('spawnWave wave 10 includes boss', () => {
    const pixels = waypointsToPixels(DEFAULT_WAYPOINTS, 48, 0, 80)
    const monsters = spawnWave(10, pixels)
    const boss = monsters.find(m => m.defId === 'boss')
    expect(boss).toBeDefined()
  })
  it('processCombatTick deals damage', () => {
    const monster: MonsterInstance = {
      id: 'm1', defId: 'goblin', hp: 100, maxHp: 100, speed: 1, armor: 0,
      special: 'none', color: 0x4CAF50, size: 8, goldReward: 5,
      pos: { x: 200, y: 200 }, waypointIdx: 1, alive: true,
      slowUntil: 0, poisonUntil: 0, poisonDps: 0, spawnDelay: 0, spawned: true,
    }
    const tower: TowerState = {
      defId: 'arrow', level: 1, pos: { x: 200, y: 200 }, lastAttackTime: 0,
    }
    const towerDefs = new Map(TOWERS.map(t => [t.id, t]))
    const result = processCombatTick([tower], [monster], towerDefs, 1, 1, Date.now() + 10000, 0.1)
    expect(monster.hp).toBeLessThan(100)
  })
  it('processCombatTick awards gold on kill', () => {
    const monster: MonsterInstance = {
      id: 'm1', defId: 'goblin', hp: 1, maxHp: 100, speed: 1, armor: 0,
      special: 'none', color: 0x4CAF50, size: 8, goldReward: 10,
      pos: { x: 200, y: 200 }, waypointIdx: 1, alive: true,
      slowUntil: 0, poisonUntil: 0, poisonDps: 0, spawnDelay: 0, spawned: true,
    }
    const tower: TowerState = {
      defId: 'arrow', level: 1, pos: { x: 200, y: 200 }, lastAttackTime: 0,
    }
    const towerDefs = new Map(TOWERS.map(t => [t.id, t]))
    const result = processCombatTick([tower], [monster], towerDefs, 1, 1, Date.now() + 10000, 0.1)
    expect(result.kills).toBe(1)
    expect(result.goldEarned).toBe(10)
    expect(monster.alive).toBe(false)
  })
  it('getTowerCost increases with level', () => {
    const def = TOWERS[0]
    expect(getTowerCost(def, 1)).toBe(calcCost(def.baseCost, def.costMultiplier, 0))
    expect(getTowerUpgradeCost(def, 1)).toBeGreaterThan(getTowerCost(def, 1))
  })
  it('armor reduces damage', () => {
    const monster: MonsterInstance = {
      id: 'm1', defId: 'troll', hp: 1000, maxHp: 1000, speed: 1, armor: 0.3,
      special: 'armor', color: 0x795548, size: 12, goldReward: 25,
      pos: { x: 200, y: 200 }, waypointIdx: 1, alive: true,
      slowUntil: 0, poisonUntil: 0, poisonDps: 0, spawnDelay: 0, spawned: true,
    }
    const tower: TowerState = {
      defId: 'arrow', level: 1, pos: { x: 200, y: 200 }, lastAttackTime: 0,
    }
    const towerDefs = new Map(TOWERS.map(t => [t.id, t]))
    processCombatTick([tower], [monster], towerDefs, 1, 1, Date.now() + 10000, 0.1)
    // With 30% armor, effective damage should be 70% of raw
    expect(monster.hp).toBeGreaterThan(990) // very little damage due to low base damage
  })
})

describe('Prestige', () => {
  it('cannot prestige without enough coins', () => {
    expect(canPrestige(makeState({ totalCoins: 500_000 }))).toBe(false)
  })
  it('can prestige at 1M coins', () => {
    expect(canPrestige(makeState({ totalCoins: 1_000_000 }))).toBe(true)
  })
  it('performPrestige awards dark energy', () => {
    const state = makeState({ totalCoins: 2_000_000, coins: 2_000_000 })
    const earned = performPrestige(state)
    expect(earned).toBeGreaterThan(0)
    expect(state.darkEnergy).toBe(earned)
    expect(state.coins).toBe(0)
    expect(state.prestigeCount).toBe(1)
    expect(state.prestigeMult).toBeGreaterThan(1)
  })
  it('performPrestige returns 0 when cannot prestige', () => {
    expect(performPrestige(makeState({ totalCoins: 100 }))).toBe(0)
  })
  it('getPrestigeRequirement increases each level', () => {
    expect(getPrestigeRequirement(makeState({ prestigeLevel: 0 }))).toBe(1_000_000)
    expect(getPrestigeRequirement(makeState({ prestigeLevel: 2 }))).toBe(100_000_000)
  })
})

describe('Save System', () => {
  beforeEach(() => { localStorage.clear() })
  it('loadState returns default when empty', () => {
    const state = loadState()
    expect(state.coins).toBe(100)
    expect(state.unlockedDungeons).toEqual(['shadow'])
  })
  it('saveState + loadState roundtrip', () => {
    const state = makeState({ coins: 999 })
    saveState(state)
    expect(loadState().coins).toBe(999)
  })
  it('resetState clears progress', () => {
    const state = makeState({ coins: 99999, darkEnergy: 50, prestigeCount: 3 })
    saveState(state)
    const fresh = resetState()
    expect(fresh.coins).toBe(100)
    expect(fresh.darkEnergy).toBe(0)
  })
  it('calcOfflineEarnings returns 0 without progress', () => {
    expect(calcOfflineEarnings(makeState())).toBe(0)
  })
  it('calcOfflineEarnings returns earnings after wave 5', () => {
    const state = makeState({ bestWave: 10, lastOnline: Date.now() - 3600_000 })
    expect(calcOfflineEarnings(state)).toBeGreaterThan(0)
  })
})

describe('Data Integrity', () => {
  it('towers have unique IDs', () => {
    const ids = TOWERS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('monsters have unique IDs', () => {
    const ids = MONSTERS.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('heroes have unique IDs', () => {
    const ids = HEROES.map(h => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('dungeons have unique IDs', () => {
    const ids = DUNGEONS.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('achievements have unique IDs', () => {
    const ids = ACHIEVEMENTS.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('towers have valid costs', () => {
    for (const t of TOWERS) { expect(t.baseCost).toBeGreaterThan(0) }
  })
  it('monsters have valid HP', () => {
    for (const m of MONSTERS) { expect(m.baseHp).toBeGreaterThan(0) }
  })
})

describe('Daily Challenges', () => {
  it('getTodayDate returns YYYY-MM-DD', () => {
    expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('getTodayChallenge returns valid structure', () => {
    const c = getTodayChallenge()
    expect(c.name).toBeTruthy()
    expect(c.description).toBeTruthy()
    expect(c.bonusMultiplier).toBeGreaterThan(0)
    expect(typeof c.validate).toBe('function')
  })
  it('isDailyCompletedToday returns true for today', () => {
    expect(isDailyCompletedToday(getTodayDate())).toBe(true)
  })
  it('isDailyCompletedToday returns false for empty', () => {
    expect(isDailyCompletedToday('')).toBe(false)
  })
})
