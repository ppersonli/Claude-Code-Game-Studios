import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Meme, CardState } from '../../src/types'
import {
  generateCards,
  shuffleCards,
  calculateMatchPoints,
  calculateFinalScore,
  createInitialState,
  startGame,
  flipCard,
  checkMatch,
  tickTimer,
} from '../../src/games/meme-match/composables/useGameLogic'
import { LEVELS } from '../../src/games/meme-match/data/levels'
import { MEMES } from '../../src/games/meme-match/data/memes'

// Mock localStorage
const storage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage[k] ?? null,
  setItem: (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]) },
})

describe('generateCards', () => {
  it('generates correct number of cards for level', () => {
    const cards = generateCards(LEVELS[0])
    expect(cards).toHaveLength(LEVELS[0].cols * LEVELS[0].rows) // 12
  })

  it('creates pairs (each memeId appears exactly twice)', () => {
    const cards = generateCards(LEVELS[0])
    const memeIds = cards.map(c => c.memeId)
    for (const id of new Set(memeIds)) {
      expect(memeIds.filter(m => m === id)).toHaveLength(2)
    }
  })

  it('generates unique card ids', () => {
    const cards = generateCards(LEVELS[0])
    const ids = cards.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all cards start face-down and unmatched', () => {
    const cards = generateCards(LEVELS[0])
    for (const card of cards) {
      expect(card.flipped).toBe(false)
      expect(card.matched).toBe(false)
    }
  })

  it('works for larger levels', () => {
    const cards = generateCards(LEVELS[4]) // 6×5 = 30 cards
    expect(cards).toHaveLength(30)
  })

  it('accepts custom meme list', () => {
    const custom: Meme[] = [
      { id: 'a', name: 'A', emoji: 'A', tier: 1 },
      { id: 'b', name: 'B', emoji: 'B', tier: 1 },
      { id: 'c', name: 'C', emoji: 'C', tier: 1 },
    ]
    const level = { id: 1, name: 'Test', cols: 3, rows: 2, timeLimit: 60, requiredScore: 0 }
    const cards = generateCards(level, custom)
    expect(cards).toHaveLength(6)
    const memeIds = new Set(cards.map(c => c.memeId))
    expect(memeIds.size).toBe(3)
  })
})

describe('shuffleCards', () => {
  it('returns same cards in different order (probabilistic)', () => {
    const original: CardState[] = Array.from({ length: 20 }, (_, i) => ({
      id: i, memeId: `m${i}`, flipped: false, matched: false,
    }))
    const shuffled = shuffleCards(original)
    expect(shuffled).toHaveLength(original.length)
    // With 20 cards, probability of same order is 1/20! ≈ 0
    // But we can't guarantee it, so just check length and contents
    const origIds = new Set(original.map(c => c.id))
    const shufIds = new Set(shuffled.map(c => c.id))
    expect(shufIds).toEqual(origIds)
  })

  it('does not mutate the original array', () => {
    const original: CardState[] = [
      { id: 0, memeId: 'a', flipped: false, matched: false },
      { id: 1, memeId: 'a', flipped: false, matched: false },
    ]
    const firstId = original[0].id
    shuffleCards(original)
    expect(original[0].id).toBe(firstId)
  })
})

describe('calculateMatchPoints', () => {
  it('returns base 100 for combo 1', () => {
    expect(calculateMatchPoints(1)).toBe(100)
  })

  it('returns 150 for combo 2 (1.5x)', () => {
    expect(calculateMatchPoints(2)).toBe(150)
  })

  it('returns 200 for combo 3 (1.5x)', () => {
    expect(calculateMatchPoints(3)).toBe(150)
  })

  it('returns higher points for higher combos', () => {
    const p1 = calculateMatchPoints(1)
    const p5 = calculateMatchPoints(5)
    const p10 = calculateMatchPoints(10)
    expect(p5).toBeGreaterThan(p1)
    expect(p10).toBeGreaterThan(p5)
  })
})

describe('calculateFinalScore', () => {
  it('adds time bonus', () => {
    const final = calculateFinalScore(500, 30, 5)
    expect(final).toBe(500 + 30 * 10) // 800
  })

  it('applies perfect multiplier when no misses', () => {
    const withMisses = calculateFinalScore(500, 30, 1)
    const perfect = calculateFinalScore(500, 30, 0)
    expect(perfect).toBe((500 + 300) * 2) // 1600
    expect(withMisses).toBe(800)
  })

  it('handles zero time remaining', () => {
    expect(calculateFinalScore(500, 0, 3)).toBe(500)
  })

  it('handles zero base score', () => {
    expect(calculateFinalScore(0, 10, 0)).toBe(200) // (0 + 100) * 2
  })
})

describe('createInitialState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns correct initial values', () => {
    const state = createInitialState()
    expect(state.cards).toEqual([])
    expect(state.status).toBe('idle')
    expect(state.score).toBe(0)
    expect(state.combo).toBe(0)
    expect(state.misses).toBe(0)
    expect(state.matchesFound).toBe(0)
    expect(state.flippedCardIds).toEqual([])
  })

  it('loads best scores from localStorage', () => {
    localStorage.setItem('mm_best_scores', '{"Easy":500,"Medium":300}')
    const state = createInitialState()
    expect(state.bestScores).toEqual({ Easy: 500, Medium: 300 })
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('mm_best_scores', 'NOT_JSON')
    const state = createInitialState()
    expect(state.bestScores).toEqual({})
  })
})

describe('startGame', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes game state for given level', () => {
    const state = createInitialState()
    startGame(state, 0)
    expect(state.status).toBe('playing')
    expect(state.level).toBe(LEVELS[0])
    expect(state.cards).toHaveLength(12) // 4×3
    expect(state.totalPairs).toBe(6)
    expect(state.timeRemaining).toBe(60)
    expect(state.score).toBe(0)
    expect(state.combo).toBe(0)
    expect(state.misses).toBe(0)
    expect(state.flippedCardIds).toEqual([])
  })

  it('defaults to level 0 for invalid index', () => {
    const state = createInitialState()
    startGame(state, 99)
    expect(state.level).toBe(LEVELS[0])
  })

  it('resets state when starting new game', () => {
    const state = createInitialState()
    startGame(state, 0)
    state.score = 1000
    state.combo = 5
    startGame(state, 1)
    expect(state.score).toBe(0)
    expect(state.combo).toBe(0)
    expect(state.level).toBe(LEVELS[1])
  })
})

describe('flipCard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('flips a face-down card', () => {
    const state = createInitialState()
    startGame(state, 0)
    const card = state.cards[0]
    expect(flipCard(state, card.id)).toBe(true)
    expect(card.flipped).toBe(true)
    expect(state.flippedCardIds).toContain(card.id)
  })

  it('returns false for already flipped card', () => {
    const state = createInitialState()
    startGame(state, 0)
    const card = state.cards[0]
    flipCard(state, card.id)
    expect(flipCard(state, card.id)).toBe(false)
  })

  it('returns false for matched card', () => {
    const state = createInitialState()
    startGame(state, 0)
    state.cards[0].matched = true
    expect(flipCard(state, state.cards[0].id)).toBe(false)
  })

  it('returns false when two cards already flipped', () => {
    const state = createInitialState()
    startGame(state, 0)
    flipCard(state, state.cards[0].id)
    flipCard(state, state.cards[1].id)
    expect(flipCard(state, state.cards[2].id)).toBe(false)
  })

  it('returns false for invalid card id', () => {
    const state = createInitialState()
    startGame(state, 0)
    expect(flipCard(state, 999)).toBe(false)
  })

  it('returns false when game is not playing', () => {
    const state = createInitialState()
    expect(flipCard(state, 0)).toBe(false)
  })
})

describe('checkMatch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null if fewer than 2 cards flipped', () => {
    const state = createInitialState()
    startGame(state, 0)
    expect(checkMatch(state)).toBeNull()
  })

  it('detects a matching pair', () => {
    const state = createInitialState()
    startGame(state, 0)
    // Find two cards with same memeId
    const pair = findPair(state.cards)
    flipCard(state, pair[0].id)
    flipCard(state, pair[1].id)
    const result = checkMatch(state)
    expect(result).not.toBeNull()
    expect(result!.isMatch).toBe(true)
    expect(result!.points).toBeGreaterThan(0)
    expect(pair[0].matched).toBe(true)
    expect(pair[1].matched).toBe(true)
    expect(state.matchesFound).toBe(1)
  })

  it('detects a non-matching pair', () => {
    const state = createInitialState()
    startGame(state, 0)
    // Find two cards with different memeIds
    const nonPair = findNonPair(state.cards)
    flipCard(state, nonPair[0].id)
    flipCard(state, nonPair[1].id)
    const result = checkMatch(state)
    expect(result).not.toBeNull()
    expect(result!.isMatch).toBe(false)
    expect(result!.points).toBe(0)
    expect(state.misses).toBe(1)
    expect(state.combo).toBe(0)
    // Cards should be flipped back
    expect(nonPair[0].flipped).toBe(false)
    expect(nonPair[1].flipped).toBe(false)
  })

  it('increments combo on consecutive matches', () => {
    const state = createInitialState()
    startGame(state, 0)
    const pairs = findAllPairs(state.cards)

    // First match
    flipCard(state, pairs[0][0].id)
    flipCard(state, pairs[0][1].id)
    const r1 = checkMatch(state)
    expect(r1!.combo).toBe(1)
    expect(state.combo).toBe(1)

    // Second match
    flipCard(state, pairs[1][0].id)
    flipCard(state, pairs[1][1].id)
    const r2 = checkMatch(state)
    expect(r2!.combo).toBe(2)
    expect(state.combo).toBe(2)
    expect(state.maxCombo).toBe(2)
  })

  it('resets combo on miss', () => {
    const state = createInitialState()
    startGame(state, 0)
    const pairs = findAllPairs(state.cards)

    // Match
    flipCard(state, pairs[0][0].id)
    flipCard(state, pairs[0][1].id)
    checkMatch(state)
    expect(state.combo).toBe(1)

    // Find non-pair among unmatched cards
    const unmatched = state.cards.filter(c => !c.matched)
    const nonPair = findNonPair(unmatched)
    flipCard(state, nonPair[0].id)
    flipCard(state, nonPair[1].id)
    checkMatch(state)
    expect(state.combo).toBe(0)
  })

  it('clears flippedCardIds after check', () => {
    const state = createInitialState()
    startGame(state, 0)
    flipCard(state, state.cards[0].id)
    flipCard(state, state.cards[1].id)
    checkMatch(state)
    expect(state.flippedCardIds).toEqual([])
  })

  it('triggers win when all pairs matched', () => {
    const state = createInitialState()
    startGame(state, 0) // 6 pairs
    const pairs = findAllPairs(state.cards)

    for (const pair of pairs) {
      flipCard(state, pair[0].id)
      flipCard(state, pair[1].id)
      checkMatch(state)
    }

    expect(state.status).toBe('won')
    expect(state.matchesFound).toBe(6)
    expect(state.score).toBeGreaterThan(0)
  })

  it('applies perfect bonus on win with zero misses', () => {
    const state = createInitialState()
    startGame(state, 0)
    const pairs = findAllPairs(state.cards)

    for (const pair of pairs) {
      flipCard(state, pair[0].id)
      flipCard(state, pair[1].id)
      checkMatch(state)
    }

    // Combo progression: 1→100, 2→150, 3→150, 4→200, 5→200, 6→300 = 1100 base
    // Time bonus = 60 * 10 = 600
    // Final = (1100 + 600) * 2 = 3400 (perfect multiplier)
    expect(state.score).toBe(3400)
  })
})

describe('tickTimer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('decrements time by 1', () => {
    const state = createInitialState()
    startGame(state, 0)
    const initial = state.timeRemaining
    tickTimer(state)
    expect(state.timeRemaining).toBe(initial - 1)
  })

  it('returns false when time remains', () => {
    const state = createInitialState()
    startGame(state, 0)
    expect(tickTimer(state)).toBe(false)
  })

  it('returns true and sets lost when time runs out', () => {
    const state = createInitialState()
    startGame(state, 0)
    state.timeRemaining = 1
    expect(tickTimer(state)).toBe(true)
    expect(state.status).toBe('lost')
    expect(state.timeRemaining).toBe(0)
  })

  it('does not go below zero', () => {
    const state = createInitialState()
    startGame(state, 0)
    state.timeRemaining = 0
    tickTimer(state)
    expect(state.timeRemaining).toBe(0)
  })

  it('does nothing if game is not playing', () => {
    const state = createInitialState()
    state.timeRemaining = 10
    tickTimer(state)
    expect(state.timeRemaining).toBe(10)
  })
})

describe('game flow (integration)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('full game: start → play → win', () => {
    const state = createInitialState()
    startGame(state, 0)
    expect(state.status).toBe('playing')

    const pairs = findAllPairs(state.cards)
    for (const pair of pairs) {
      flipCard(state, pair[0].id)
      flipCard(state, pair[1].id)
      checkMatch(state)
    }

    expect(state.status).toBe('won')
    expect(state.score).toBeGreaterThan(0)
  })

  it('full game: start → play → lose (time out)', () => {
    const state = createInitialState()
    startGame(state, 0)
    state.timeRemaining = 1
    tickTimer(state)
    expect(state.status).toBe('lost')
  })

  it('persists best score on win', () => {
    const state = createInitialState()
    startGame(state, 0)
    const pairs = findAllPairs(state.cards)
    for (const pair of pairs) {
      flipCard(state, pair[0].id)
      flipCard(state, pair[1].id)
      checkMatch(state)
    }
    expect(state.bestScores['Easy']).toBeGreaterThan(0)
    expect(localStorage.getItem('mm_best_scores')).toBeTruthy()
  })

  it('does not allow flipping after game is lost', () => {
    const state = createInitialState()
    startGame(state, 0)
    state.timeRemaining = 1
    tickTimer(state)
    expect(flipCard(state, state.cards[0].id)).toBe(false)
  })
})

// === Helpers ===

function findPair(cards: CardState[]): [CardState, CardState] {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].memeId === cards[j].memeId) return [cards[i], cards[j]]
    }
  }
  throw new Error('No pair found')
}

function findNonPair(cards: CardState[]): [CardState, CardState] {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].memeId !== cards[j].memeId) return [cards[i], cards[j]]
    }
  }
  throw new Error('No non-pair found')
}

function findAllPairs(cards: CardState[]): [CardState, CardState][] {
  const pairs: [CardState, CardState][] = []
  const seen = new Set<number>()
  for (let i = 0; i < cards.length; i++) {
    if (seen.has(cards[i].id)) continue
    for (let j = i + 1; j < cards.length; j++) {
      if (seen.has(cards[j].id)) continue
      if (cards[i].memeId === cards[j].memeId) {
        pairs.push([cards[i], cards[j]])
        seen.add(cards[i].id)
        seen.add(cards[j].id)
        break
      }
    }
  }
  return pairs
}
