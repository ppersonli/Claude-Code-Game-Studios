import { Vec2, type LevelData } from './physics'
import { LEVELS } from '../data/levels'
import { GAME_CONFIG, type UpgradeKey, type CharacterId } from '../config'

export interface GameState {
  /** Current level index (0-based) */
  currentLevel: number
  /** Strokes used on current level */
  strokes: number
  /** Stars earned per level: levelId -> boolean[3] */
  starsEarned: Record<number, boolean[]>
  /** Total stars collected */
  totalStars: number
  /** Best strokes per level */
  bestScores: Record<number, number>
  /** Completed level ids */
  completedLevels: number[]
  /** Upgrade levels */
  upgrades: Record<UpgradeKey, number>
  /** Selected character */
  selectedCharacter: CharacterId
  /** Unlocked characters */
  unlockedCharacters: CharacterId[]
  /** Galaxy coins (prestige currency) */
  galaxyCoins: number
  /** Prestige count */
  prestigeCount: number
  /** Timestamp of last play */
  lastPlayTime: number
}

export function createInitialState(): GameState {
  return {
    currentLevel: 0,
    strokes: 0,
    starsEarned: {},
    totalStars: 0,
    bestScores: {},
    completedLevels: [],
    upgrades: { power: 0, bounce: 0, accuracy: 0, magnet: 0 },
    selectedCharacter: 'rookie',
    unlockedCharacters: ['rookie'],
    galaxyCoins: 0,
    prestigeCount: 0,
    lastPlayTime: Date.now(),
  }
}

export function getCurrentLevel(state: GameState): LevelData {
  return LEVELS[state.currentLevel % LEVELS.length]
}

export function getUpgradeCost(key: UpgradeKey, currentLevel: number): number {
  const config = GAME_CONFIG.UPGRADES[key]
  return Math.floor(config.baseCost * Math.pow(GAME_CONFIG.UPGRADE_COST_MULTIPLIER, currentLevel))
}

export function canAffordUpgrade(state: GameState, key: UpgradeKey): boolean {
  const cost = getUpgradeCost(key, state.upgrades[key])
  return state.totalStars >= cost && state.upgrades[key] < GAME_CONFIG.UPGRADES[key].maxLevel
}

export function purchaseUpgrade(state: GameState, key: UpgradeKey): GameState {
  if (!canAffordUpgrade(state, key)) return state
  const cost = getUpgradeCost(key, state.upgrades[key])
  return {
    ...state,
    totalStars: state.totalStars - cost,
    upgrades: { ...state.upgrades, [key]: state.upgrades[key] + 1 },
  }
}

export function completeLevel(state: GameState, levelId: number, strokes: number, stars: boolean[]): GameState {
  const wasCompleted = state.completedLevels.includes(levelId)
  const newCompleted = wasCompleted ? state.completedLevels : [...state.completedLevels, levelId]
  const prevBest = state.bestScores[levelId] ?? Infinity
  const newBest = { ...state.bestScores, [levelId]: Math.min(prevBest, strokes) }

  const prevStars = state.starsEarned[levelId] ?? [false, false, false]
  const newStarsEarned = stars.map((earned, i) => earned || prevStars[i])
  const starDelta = newStarsEarned.filter((s, i) => s && !prevStars[i]).length

  return {
    ...state,
    strokes: 0,
    completedLevels: newCompleted,
    bestScores: newBest,
    starsEarned: { ...state.starsEarned, [levelId]: newStarsEarned },
    totalStars: state.totalStars + starDelta,
    currentLevel: state.currentLevel + 1,
    lastPlayTime: Date.now(),
  }
}

export function canPrestige(state: GameState): boolean {
  return state.completedLevels.length >= LEVELS.length
}

export function prestige(state: GameState): GameState {
  if (!canPrestige(state)) return state
  const coins = GAME_CONFIG.PRESTIGE_GALAXY_COINS_PER_RESET + state.completedLevels.length
  return {
    ...createInitialState(),
    galaxyCoins: state.galaxyCoins + coins,
    prestigeCount: state.prestigeCount + 1,
    unlockedCharacters: state.unlockedCharacters,
    selectedCharacter: state.selectedCharacter,
  }
}

/** Save/load */
const SAVE_KEY = 'bounce-golf-save'

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch { /* quota exceeded */ }
}

export function loadGame(): GameState | null {
  try {
    const data = localStorage.getItem(SAVE_KEY)
    if (!data) return null
    return { ...createInitialState(), ...JSON.parse(data) }
  } catch {
    return null
  }
}
