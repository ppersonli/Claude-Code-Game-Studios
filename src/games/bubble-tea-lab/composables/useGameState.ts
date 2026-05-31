import type { Ingredient, Customer, ServeResult, DailyModifier } from '@types'
import { INGREDIENTS, isIngredientUnlocked } from '../data/ingredients'
import { CUSTOMERS, isCustomerUnlocked, selectCustomer } from '../data/customers'
import { DAILY_MODIFIERS } from '../data/daily-challenge'
import { pickRandomUnique, blendColors, getComboMultiplier, seededRandom, getDailySeed } from '@shared/utils'

export { INGREDIENTS, CUSTOMERS, isIngredientUnlocked, isCustomerUnlocked, blendColors, getComboMultiplier }

// === Scoring engine (pure, testable) ===

export function calculateServeResult(
  order: readonly Ingredient[],
  cupContents: readonly Ingredient[],
  combo: number,
  options: { tipBonus?: number; isDaily?: boolean; dailyModifier?: DailyModifier | null } = {},
): ServeResult {
  const tipMultiplier = options.tipBonus ?? 1
  const dailyMultiplier = options.isDaily && options.dailyModifier ? options.dailyModifier.scoreMultiplier : 1

  const orderUsed = new Array<boolean>(order.length).fill(false)
  const cupUsed = new Array<boolean>(cupContents.length).fill(false)
  let matches = 0

  for (let i = 0; i < cupContents.length; i++) {
    for (let j = 0; j < order.length; j++) {
      if (!orderUsed[j] && !cupUsed[i] && cupContents[i].id === order[j].id) {
        matches++
        orderUsed[j] = true
        cupUsed[i] = true
        break
      }
    }
  }

  const wrong = cupContents.length - matches
  const isPerfect = matches === order.length && wrong === 0
  let points = matches * 10 - wrong * 5
  let newCombo = combo

  if (isPerfect) {
    newCombo = combo + 1
    const comboMult = getComboMultiplier(newCombo)
    points += Math.round(50 * newCombo * tipMultiplier * comboMult * dailyMultiplier)
  } else {
    newCombo = 0
  }

  return { matches, wrong, points: Math.max(points, 0), isPerfect, newCombo, orderUsed, cupUsed }
}

// === Order generation (pure, testable) ===

export function generateOrder(level: number, unlockedIds: readonly string[]): Ingredient[] {
  const count = Math.min(2 + Math.floor(level / 2), 5)
  const available = INGREDIENTS.filter(i => isIngredientUnlocked(i, unlockedIds))
  return pickRandomUnique(available, count)
}

// === Daily seed helpers re-export ===

export { seededRandom, getDailySeed }

export function getDailyModifier(seed: number): DailyModifier {
  const idx = Math.floor(seededRandom(seed) * DAILY_MODIFIERS.length)
  return DAILY_MODIFIERS[idx]
}

// === Persistence ===

const STORAGE_PREFIX = 'btlab_'

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

function loadInt(key: string, fallback: number): number {
  const v = localStorage.getItem(STORAGE_PREFIX + key)
  return v ? parseInt(v, 10) : fallback
}

export interface BubbleTeaLabState {
  // Current game session
  score: number
  level: number
  combo: number
  maxCombo: number
  perfectCount: number
  drinksServed: number
  customersServed: number
  maxCustomers: number
  cupContents: Ingredient[]
  currentOrder: Ingredient[]
  currentCustomer: Customer | null
  gameOver: boolean
  serving: boolean

  // Daily challenge
  isDaily: boolean
  dailyTimer: number
  dailyTimerId: ReturnType<typeof setInterval> | null
  dailyModifier: DailyModifier | null
  dailyCompleted: boolean
  dailyGoalProgress: number
  dailySeed: number

  // Persistent state
  totalDrinksServed: number
  totalCoins: number
  achievements: string[]
  unlockedIngredients: string[]
  unlockedCustomers: string[]

  // UI effects
  floatTexts: Array<{ id: number; text: string; x: number; y: number; color: string }>
  scorePopups: Array<{ id: number; text: string; x: number; y: number; color: string }>
  screenShake: boolean
  levelUpLevel: number | null
  customerMood: 'neutral' | 'happy' | 'sad'

  // GameState compatibility aliases
  coins: number
  totalCustomers: number

  // Ad state
  adPlaying: boolean
}

let effectId = 0

export function createInitialState(): BubbleTeaLabState {
  return {
    score: 0, level: 1, combo: 0, maxCombo: 0, perfectCount: 0,
    drinksServed: 0, customersServed: 0, maxCustomers: 10,
    cupContents: [], currentOrder: [], currentCustomer: null,
    gameOver: false, serving: false,

    isDaily: false, dailyTimer: 0, dailyTimerId: null,
    dailyModifier: null, dailyCompleted: false, dailyGoalProgress: 0,
    dailySeed: getDailySeed(),

    totalDrinksServed: loadInt('total_drinks', 0),
    totalCoins: loadInt('coins', 0),
    achievements: loadJson('achievements', [] as string[]),
    unlockedIngredients: loadJson('unlocked_ingredients', [] as string[]),
    unlockedCustomers: loadJson('unlocked_customers', [] as string[]),

    floatTexts: [], scorePopups: [],
    screenShake: false, levelUpLevel: null, customerMood: 'neutral',

    coins: loadInt('coins', 0),
    totalCustomers: 10,

    adPlaying: false,
  }
}

// === Game actions ===

export function startStandardGame(state: BubbleTeaLabState): void {
  Object.assign(state, {
    score: 0, level: 1, combo: 0, maxCombo: 0, perfectCount: 0,
    drinksServed: 0, customersServed: 0, maxCustomers: 10,
    cupContents: [], currentOrder: [], currentCustomer: null,
    gameOver: false, serving: false,
    isDaily: false, dailyTimer: 0, dailyModifier: null,
    dailyCompleted: false, dailyGoalProgress: 0,
    customerMood: 'neutral', levelUpLevel: null,
    totalCustomers: 10,
    adPlaying: false,
  })
  clearTimer(state)
}

export function startDailyGame(state: BubbleTeaLabState, modifier: DailyModifier): void {
  Object.assign(state, {
    score: 0, level: 1, combo: 0, maxCombo: 0, perfectCount: 0,
    drinksServed: 0, customersServed: 0, maxCustomers: 999,
    cupContents: [], currentOrder: [], currentCustomer: null,
    gameOver: false, serving: false,
    isDaily: true, dailyTimer: modifier.timeLimit, dailyModifier: modifier,
    dailyCompleted: false, dailyGoalProgress: 0,
    customerMood: 'neutral', levelUpLevel: null,
    totalCustomers: 999,
  })
}

export function nextCustomer(state: BubbleTeaLabState): void {
  if (state.customersServed >= state.maxCustomers) {
    state.gameOver = true
    return
  }
  state.cupContents = []
  state.serving = false
  state.customerMood = 'neutral'
  state.currentOrder = generateOrder(state.level, state.unlockedIngredients)

  const available = CUSTOMERS.filter(c => isCustomerUnlocked(c, state.unlockedCustomers))
  state.currentCustomer = selectCustomer(available, Math.random())
}

export function addToCup(state: BubbleTeaLabState, ingredient: Ingredient): boolean {
  if (state.cupContents.length >= 6) return false
  state.cupContents.push(ingredient)
  return true
}

export function serveDrink(state: BubbleTeaLabState): ServeResult | null {
  if (state.serving || state.cupContents.length === 0) return null
  state.serving = true

  const tipBonus = state.currentCustomer?.tipBonus ?? 1
  const result = calculateServeResult(
    state.currentOrder, state.cupContents, state.combo,
    { tipBonus, isDaily: state.isDaily, dailyModifier: state.dailyModifier },
  )

  state.combo = result.newCombo
  state.maxCombo = Math.max(state.maxCombo, state.combo)
  if (result.isPerfect) state.perfectCount++
  state.score += result.points
  state.drinksServed++
  state.totalDrinksServed++
  state.customersServed++
  state.customerMood = result.isPerfect ? 'happy' : 'sad'

  // Daily goal tracking
  if (state.isDaily && state.dailyModifier?.goal) {
    const { goal } = state.dailyModifier
    if (goal.type === 'perfect' && result.isPerfect) state.dailyGoalProgress++
    else if (goal.type === 'level') state.dailyGoalProgress = state.level
    else if (goal.type === 'score') state.dailyGoalProgress = state.score
    else if (goal.type === 'combo') state.dailyGoalProgress = Math.max(state.dailyGoalProgress, state.combo)
  }

  // Level up
  const prevLevel = state.level
  const levelInterval = state.isDaily ? 2 : 3
  if (state.customersServed % levelInterval === 0) state.level++
  if (state.level > prevLevel) state.levelUpLevel = state.level

  // Effects
  if (result.isPerfect && state.combo >= 5) state.screenShake = true

  return result
}

export function resetCup(state: BubbleTeaLabState): void {
  state.cupContents = []
}

export function endGame(state: BubbleTeaLabState): void {
  clearTimer(state)

  // Daily completion bonus
  if (state.isDaily && state.dailyModifier?.goal) {
    if (state.dailyGoalProgress >= state.dailyModifier.goal.count) {
      state.dailyCompleted = true
      state.totalCoins += 200
    }
  }

  state.totalCoins += state.score
  state.coins = state.totalCoins
  saveJson('achievements', state.achievements)
  saveJson('unlocked_ingredients', state.unlockedIngredients)
  saveJson('unlocked_customers', state.unlockedCustomers)
  localStorage.setItem(STORAGE_PREFIX + 'coins', String(state.totalCoins))
  localStorage.setItem(STORAGE_PREFIX + 'total_drinks', String(state.totalDrinksServed))
  state.gameOver = true
}

export function unlockItem(state: BubbleTeaLabState, type: 'ingredient' | 'customer', id: string, cost: number): boolean {
  if (state.totalCoins < cost) return false
  state.totalCoins -= cost
  state.coins = state.totalCoins
  if (type === 'ingredient') {
    state.unlockedIngredients.push(id)
  } else {
    state.unlockedCustomers.push(id)
  }
  return true
}

import { ACHIEVEMENTS } from '../data/customers'

export function checkAchievements(state: BubbleTeaLabState): string[] {
  const newlyUnlocked: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id)
      newlyUnlocked.push(a.id)
    }
  }
  return newlyUnlocked
}

// === Timer management ===

export function clearTimer(state: BubbleTeaLabState): void {
  if (state.dailyTimerId) {
    clearInterval(state.dailyTimerId)
    state.dailyTimerId = null
  }
}

// === Effects (reactive UI) ===

export function addFloatText(state: BubbleTeaLabState, text: string, color: string): void {
  const id = ++effectId
  state.floatTexts.push({ id, text, x: window.innerWidth / 2, y: window.innerHeight / 2, color })
  setTimeout(() => {
    state.floatTexts = state.floatTexts.filter(t => t.id !== id)
  }, 1000)
}

export function addScorePopup(state: BubbleTeaLabState, text: string, color: string): void {
  const id = ++effectId
  state.scorePopups.push({ id, text, x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 - 80, color })
  setTimeout(() => {
    state.scorePopups = state.scorePopups.filter(t => t.id !== id)
  }, 1200)
}
