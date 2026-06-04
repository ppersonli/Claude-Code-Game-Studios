/** Game state — localStorage persistence */

import { CONSTANTS } from './constants'

export interface Point { x: number; y: number }

export interface GameState {
  coins: number
  totalCoins: number
  darkEnergy: number
  prestigeLevel: number
  prestigeCount: number
  prestigeMult: number
  towers: Record<string, TowerState>  // key: "x,y"
  activeHeroes: string[]
  unlockedHeroes: string[]
  unlockedDungeons: string[]
  currentDungeon: string
  currentWave: number
  bestWave: number
  totalKills: number
  achievements: string[]
  lastDailyCompleted: string
  dailyStreak: number
  lastOnline: number
  sessionStart: number
  sessionKills: number
  sessionGoldEarned: number
  consecutiveNoLeak: number
  bestBossKillTime: number
  autoWave: boolean
}

export interface TowerState {
  defId: string
  level: number
  pos: Point
  lastAttackTime: number
  buffedUntil?: number
}

export interface MonsterInstance {
  id: string
  defId: string
  hp: number
  maxHp: number
  speed: number
  armor: number
  special: 'none' | 'armor' | 'ghost' | 'fly' | 'boss'
  color: number
  size: number
  goldReward: number
  pos: Point
  waypointIdx: number
  alive: boolean
  reachedEnd?: boolean
  slowUntil: number
  poisonUntil: number
  poisonDps: number
  spawnDelay: number
  spawned: boolean
}

const DEFAULT_STATE: GameState = {
  coins: 100,
  totalCoins: 100,
  darkEnergy: 0,
  prestigeLevel: 0,
  prestigeCount: 0,
  prestigeMult: 1,
  towers: {},
  activeHeroes: ['warrior'],
  unlockedHeroes: ['warrior'],
  unlockedDungeons: ['shadow'],
  currentDungeon: 'shadow',
  currentWave: 0,
  bestWave: 0,
  totalKills: 0,
  achievements: [],
  lastDailyCompleted: '',
  dailyStreak: 0,
  lastOnline: Date.now(),
  sessionStart: Date.now(),
  sessionKills: 0,
  sessionGoldEarned: 0,
  consecutiveNoLeak: 0,
  bestBossKillTime: 0,
  autoWave: false,
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(CONSTANTS.SAVE_KEY)
    if (!raw) return freshState()
    const saved = JSON.parse(raw) as Partial<GameState>
    return { ...freshState(), ...saved, sessionStart: Date.now(), sessionKills: 0, sessionGoldEarned: 0 }
  } catch {
    return freshState()
  }
}

function freshState(): GameState {
  return { ...DEFAULT_STATE, lastOnline: Date.now(), sessionStart: Date.now() }
}

export function saveState(state: GameState): void {
  state.lastOnline = Date.now()
  localStorage.setItem(CONSTANTS.SAVE_KEY, JSON.stringify(state))
}

export function resetState(): GameState {
  const fresh = freshState()
  saveState(fresh)
  return fresh
}

export function calcOfflineEarnings(state: GameState): number {
  if (state.bestWave < 5) return 0
  const secondsOff = Math.min(
    (Date.now() - state.lastOnline) / 1000,
    CONSTANTS.MAX_OFFLINE_HOURS * 3600,
  )
  if (secondsOff < 10) return 0
  const baseRate = state.bestWave * 2 * state.prestigeMult
  return Math.floor(baseRate * secondsOff * CONSTANTS.OFFLINE_EFFICIENCY)
}
