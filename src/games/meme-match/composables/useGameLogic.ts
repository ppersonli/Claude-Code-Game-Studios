import type { Meme, CardState, GameLevel, MatchResult, MemeMatchState, GameStatus } from '@types'
import { MEMES } from '../data/memes'
import { LEVELS, getPairCount, getUnlockedLevelCount } from '../data/levels'
import { pickRandomUnique, getComboMultiplier } from '@shared/utils'

// === Card generation (pure, testable) ===

/**
 * Generate a shuffled deck of card pairs for a given level.
 * Uses Fisher-Yates shuffle internally.
 */
export function generateCards(level: GameLevel, memes: readonly Meme[] = MEMES): CardState[] {
  const pairCount = getPairCount(level)
  const selected = pickRandomUnique([...memes], pairCount)
  const cards: CardState[] = []
  let id = 0
  for (const meme of selected) {
    cards.push({ id: id++, memeId: meme.id, flipped: false, matched: false })
    cards.push({ id: id++, memeId: meme.id, flipped: false, matched: false })
  }
  return shuffleCards(cards)
}

/**
 * Shuffle cards using Fisher-Yates algorithm (pure).
 */
export function shuffleCards(cards: CardState[]): CardState[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// === Scoring (pure, testable) ===

/** Base points per match. */
const BASE_POINTS = 100
/** Time bonus multiplier. */
const TIME_BONUS_MULTIPLIER = 10
/** Perfect game multiplier. */
const PERFECT_MULTIPLIER = 2

/**
 * Calculate points for a match result.
 * combo = consecutive matches (1-based, so combo=1 means first match in streak)
 */
export function calculateMatchPoints(combo: number): number {
  const multiplier = getComboMultiplier(combo)
  return Math.round(BASE_POINTS * multiplier)
}

/**
 * Calculate final score including time bonus and perfect bonus.
 */
export function calculateFinalScore(
  baseScore: number,
  timeRemaining: number,
  misses: number,
): number {
  const timeBonus = Math.round(timeRemaining * TIME_BONUS_MULTIPLIER)
  let final = baseScore + timeBonus
  if (misses === 0) {
    final = Math.round(final * PERFECT_MULTIPLIER)
  }
  return final
}

// === Game state management (pure) ===

const STORAGE_PREFIX = 'mm_'

function loadInt(key: string, fallback: number): number {
  const v = localStorage.getItem(STORAGE_PREFIX + key)
  return v ? parseInt(v, 10) : fallback
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
}

/**
 * Create fresh game state. Loads persistent best scores from localStorage.
 */
export function createInitialState(): MemeMatchState {
  const bestScores = loadJson<Record<string, number>>('best_scores', {})
  const bestOverall = Math.max(0, ...Object.values(bestScores))
  return {
    cards: [],
    level: LEVELS[0],
    status: 'idle',
    score: 0,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    matchesFound: 0,
    totalPairs: 0,
    timeRemaining: 0,
    flippedCardIds: [],
    bestScores,
    unlockedLevels: getUnlockedLevelCount(bestOverall),
  }
}

/**
 * Start a new game at the given level index.
 */
export function startGame(state: MemeMatchState, levelIndex: number): void {
  const level = LEVELS[levelIndex] ?? LEVELS[0]
  const cards = generateCards(level)
  Object.assign(state, {
    cards,
    level,
    status: 'playing' as GameStatus,
    score: 0,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    matchesFound: 0,
    totalPairs: getPairCount(level),
    timeRemaining: level.timeLimit,
    flippedCardIds: [],
  })
}

/**
 * Flip a card. Returns false if the flip is invalid (already flipped, matched, or 2 cards already flipped).
 */
export function flipCard(state: MemeMatchState, cardId: number): boolean {
  if (state.status !== 'playing') return false
  if (state.flippedCardIds.length >= 2) return false

  const card = state.cards.find(c => c.id === cardId)
  if (!card) return false
  if (card.flipped || card.matched) return false

  card.flipped = true
  state.flippedCardIds.push(cardId)
  return true
}

/**
 * Check if the two flipped cards match.
 * Returns a MatchResult. If isMatch, cards are marked matched and score is updated.
 * If not a match, combo resets and cards will need to be flipped back.
 */
export function checkMatch(state: MemeMatchState): MatchResult | null {
  if (state.flippedCardIds.length !== 2) return null

  const [id1, id2] = state.flippedCardIds
  const card1 = state.cards.find(c => c.id === id1)!
  const card2 = state.cards.find(c => c.id === id2)!

  const isMatch = card1.memeId === card2.memeId

  if (isMatch) {
    card1.matched = true
    card2.matched = true
    state.combo++
    state.maxCombo = Math.max(state.maxCombo, state.combo)
    state.matchesFound++
    const points = calculateMatchPoints(state.combo)
    state.score += points
    state.flippedCardIds = []

    // Check win condition
    if (state.matchesFound >= state.totalPairs) {
      const finalScore = calculateFinalScore(state.score, state.timeRemaining, state.misses)
      state.score = finalScore
      state.status = 'won'
      persistBestScore(state)
    }

    return { isMatch: true, combo: state.combo, points }
  } else {
    state.misses++
    state.combo = 0
    state.flippedCardIds = []
    // Cards need to be flipped back by caller after animation delay
    card1.flipped = false
    card2.flipped = false
    return { isMatch: false, combo: 0, points: 0 }
  }
}

/**
 * Tick the timer down by 1 second. Returns true if time ran out.
 */
export function tickTimer(state: MemeMatchState): boolean {
  if (state.status !== 'playing') return false
  state.timeRemaining = Math.max(0, state.timeRemaining - 1)
  if (state.timeRemaining <= 0) {
    state.status = 'lost'
    return true
  }
  return false
}

/**
 * Persist best score for the current level.
 */
function persistBestScore(state: MemeMatchState): void {
  const key = state.level.name
  const prev = state.bestScores[key] ?? 0
  if (state.score > prev) {
    state.bestScores[key] = state.score
    saveJson('best_scores', state.bestScores)
  }
  state.unlockedLevels = getUnlockedLevelCount(
    Math.max(0, ...Object.values(state.bestScores)),
  )
}
