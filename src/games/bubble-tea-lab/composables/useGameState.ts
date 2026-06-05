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
  options: { tipBonus?: number; isDaily?: boolean; dailyModifier?: DailyModifier | null; serveTime?: number; patienceRatio?: number } = {},
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

  // Speed bonus (Task 3)
  let speedBonus = 0
  let speedLabel = ''
  const serveTime = options.serveTime ?? 0
  if (isPerfect && serveTime > 0) {
    if (serveTime <= 3) {
      speedBonus = 30
      speedLabel = '⚡ Lightning Speed!'
    } else if (serveTime <= 5) {
      speedBonus = 15
      speedLabel = '🏃 Fast Service!'
    }
    points += speedBonus
  }

  return { matches, wrong, points: Math.max(points, 0), isPerfect, newCombo, orderUsed, cupUsed, speedBonus, speedLabel }
}

// === Order generation (pure, testable) ===
// Task 5: Progressive difficulty curve

export function generateOrder(level: number, unlockedIds: readonly string[]): Ingredient[] {
  const available = INGREDIENTS.filter(i => isIngredientUnlocked(i, unlockedIds))

  // Progressive ingredient count based on level
  let count: number
  if (level <= 1) {
    count = 2
  } else if (level <= 3) {
    count = 2 + Math.floor(Math.random() * 2) // 2-3
  } else if (level <= 5) {
    count = 3 + Math.floor(Math.random() * 2) // 3-4
  } else {
    count = Math.min(4 + Math.floor(Math.random() * 2), available.length) // 4-5
  }

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

// === Random Event Types ===

export interface RandomEvent {
  id: string
  name: string
  icon: string
  desc: string
  duration: number   // cups affected
  effect: 'tip_boost' | 'patience_freeze' | 'double_order' | 'speed_rush' | 'lucky_ingredient'
}

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'tip_storm', name: 'Tip Storm', icon: '💰', desc: 'Next 2 cups tips x2!', duration: 2, effect: 'tip_boost' },
  { id: 'time_freeze', name: 'Time Freeze', icon: '❄️', desc: 'Patience frozen for 1 cup!', duration: 1, effect: 'patience_freeze' },
  { id: 'double_order', name: 'Double Order', icon: '🧋', desc: 'Double ingredients, double score!', duration: 1, effect: 'double_order' },
  { id: 'speed_rush', name: 'Speed Rush', icon: '⚡', desc: 'Finish in 3s for +50 bonus!', duration: 1, effect: 'speed_rush' },
  { id: 'lucky_ingredient', name: 'Lucky Ingredient', icon: '🍀', desc: 'Lucky ingredient gives +20 bonus! (3 cups)', duration: 3, effect: 'lucky_ingredient' },
]

export function getRandomEvent(): RandomEvent {
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
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

  // Task 1: Patience system
  customerPatience: number
  customerMaxPatience: number
  patienceTimerId: ReturnType<typeof setInterval> | null
  patienceFrozen: boolean // for time freeze event

  // Task 3: Speed bonus
  customerArriveTime: number

  // Task 4: Ingredient feedback
  lastIngredientCorrect: boolean | null

  // Task 2: Random events
  activeEvent: RandomEvent | null
  eventRemainingCups: number
  luckyIngredientId: string | null
  customersSinceEvent: number

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

  // Expedition inventory
  ingredientInventory: Record<string, number>

  // UI effects
  floatTexts: Array<{ id: number; text: string; x: number; y: number; color: string }>
  scorePopups: Array<{ id: number; text: string; x: number; y: number; color: string }>
  screenShake: boolean
  levelUpLevel: number | null
  customerMood: 'neutral' | 'happy' | 'sad'
  customerReaction: 'correct' | 'wrong' | null

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

    customerPatience: 0, customerMaxPatience: 0, patienceTimerId: null, patienceFrozen: false,
    customerArriveTime: 0,
    lastIngredientCorrect: null,
    activeEvent: null, eventRemainingCups: 0, luckyIngredientId: null, customersSinceEvent: 0,

    isDaily: false, dailyTimer: 0, dailyTimerId: null,
    dailyModifier: null, dailyCompleted: false, dailyGoalProgress: 0,
    dailySeed: getDailySeed(),

    totalDrinksServed: loadInt('total_drinks', 0),
    totalCoins: loadInt('coins', 0),
    achievements: loadJson('achievements', [] as string[]),
    unlockedIngredients: loadJson('unlocked_ingredients', [] as string[]),
    unlockedCustomers: loadJson('unlocked_customers', [] as string[]),
    ingredientInventory: loadJson('ingredient_inventory', {} as Record<string, number>),

    floatTexts: [], scorePopups: [],
    screenShake: false, levelUpLevel: null, customerMood: 'neutral',
    customerReaction: null,

    coins: loadInt('coins', 0),
    totalCustomers: 10,

    adPlaying: false,
  }
}

// === Game actions ===

export function startStandardGame(state: BubbleTeaLabState): void {
  clearPatienceTimer(state)
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
    customerPatience: 0, customerMaxPatience: 0, patienceFrozen: false,
    customerArriveTime: 0, lastIngredientCorrect: null,
    activeEvent: null, eventRemainingCups: 0, luckyIngredientId: null, customersSinceEvent: 0,
    customerReaction: null,
  })
  clearTimer(state)
}

export function startDailyGame(state: BubbleTeaLabState, modifier: DailyModifier): void {
  clearPatienceTimer(state)
  Object.assign(state, {
    score: 0, level: 1, combo: 0, maxCombo: 0, perfectCount: 0,
    drinksServed: 0, customersServed: 0, maxCustomers: 999,
    cupContents: [], currentOrder: [], currentCustomer: null,
    gameOver: false, serving: false,
    isDaily: true, dailyTimer: modifier.timeLimit, dailyModifier: modifier,
    dailyCompleted: false, dailyGoalProgress: 0,
    customerMood: 'neutral', levelUpLevel: null,
    totalCustomers: 999,
    customerPatience: 0, customerMaxPatience: 0, patienceFrozen: false,
    customerArriveTime: 0, lastIngredientCorrect: null,
    activeEvent: null, eventRemainingCups: 0, luckyIngredientId: null, customersSinceEvent: 0,
    customerReaction: null,
  })
}

// === Patience timer (Task 1) ===

export function startPatienceTimer(state: BubbleTeaLabState, onCustomerLeft: () => void): void {
  clearPatienceTimer(state)
  state.patienceTimerId = setInterval(() => {
    if (state.patienceFrozen || state.serving) return
    state.customerPatience = Math.max(0, state.customerPatience - 1)
    if (state.customerPatience <= 0) {
      clearPatienceTimer(state)
      onCustomerLeft()
    }
  }, 1000)
}

export function clearPatienceTimer(state: BubbleTeaLabState): void {
  if (state.patienceTimerId) {
    clearInterval(state.patienceTimerId)
    state.patienceTimerId = null
  }
}

export function customerLeft(state: BubbleTeaLabState): void {
  // Combo reset
  state.combo = 0
  // Small coin penalty
  state.totalCoins = Math.max(0, state.totalCoins - 10)
  state.coins = state.totalCoins
  state.customerMood = 'sad'
  state.customerReaction = null

  // Count as served (skip customer)
  state.customersServed++
  state.drinksServed++
  state.totalDrinksServed++
  state.customersSinceEvent++
}

export function nextCustomer(state: BubbleTeaLabState): void {
  if (state.customersServed >= state.maxCustomers) {
    state.gameOver = true
    return
  }
  state.cupContents = []
  state.serving = false
  state.customerMood = 'neutral'
  state.customerReaction = null
  state.lastIngredientCorrect = null
  state.currentOrder = generateOrder(state.level, state.unlockedIngredients)

  // Task 5: Filter customers by minLevel, adjust rarity by level
  const available = CUSTOMERS.filter(c =>
    isCustomerUnlocked(c, state.unlockedCustomers) &&
    (c.minLevel === undefined || state.level >= c.minLevel)
  )
  state.currentCustomer = selectCustomer(available, Math.random())

  // Task 1: Set patience based on customer + level
  const basePat = state.currentCustomer?.patience ?? 20
  const levelReduction = Math.max(0, (state.level - 1) * 0.5)
  const maxPat = Math.max(8, basePat - levelReduction)
  state.customerPatience = maxPat
  state.customerMaxPatience = maxPat

  // Task 3: Record arrival time
  state.customerArriveTime = Date.now()

  // Task 2: Check random event trigger (every 3 customers, 40% chance)
  if (state.customersSinceEvent >= 3 && Math.random() < 0.4) {
    const event = getRandomEvent()
    state.activeEvent = event
    state.eventRemainingCups = event.duration
    state.customersSinceEvent = 0

    // Apply event-specific setup
    if (event.effect === 'patience_freeze') {
      state.patienceFrozen = true
    } else if (event.effect === 'lucky_ingredient') {
      // Pick a random unlocked ingredient as the lucky one
      const unlockedIngs = INGREDIENTS.filter(i => isIngredientUnlocked(i, state.unlockedIngredients))
      state.luckyIngredientId = unlockedIngs[Math.floor(Math.random() * unlockedIngs.length)]?.id ?? null
    }
  } else {
    // Decrement event remaining
    if (state.eventRemainingCups > 0) {
      state.eventRemainingCups--
      if (state.eventRemainingCups <= 0) {
        state.activeEvent = null
        state.patienceFrozen = false
        state.luckyIngredientId = null
      }
    }
  }
}

export function addToCup(state: BubbleTeaLabState, ingredient: Ingredient): boolean {
  if (state.cupContents.length >= 6) return false
  state.cupContents.push(ingredient)

  // Task 4: Real-time ingredient feedback
  const isInOrder = state.currentOrder.some(o => o.id === ingredient.id)
  // Check if this specific ingredient slot is already matched
  const alreadyMatched = state.cupContents.filter(c => c.id === ingredient.id).length
  const orderCount = state.currentOrder.filter(o => o.id === ingredient.id).length
  const isCorrect = isInOrder && alreadyMatched <= orderCount
  state.lastIngredientCorrect = isCorrect

  // Lucky ingredient bonus (Task 2)
  if (state.luckyIngredientId && ingredient.id === state.luckyIngredientId) {
    state.score += 20
  }

  return true
}

export function serveDrink(state: BubbleTeaLabState): ServeResult | null {
  if (state.serving || state.cupContents.length === 0) return null
  state.serving = true
  clearPatienceTimer(state)

  const tipBonus = state.currentCustomer?.tipBonus ?? 1
  // Task 2: Event modifiers
  let effectiveTipBonus = tipBonus
  if (state.activeEvent?.effect === 'tip_boost') {
    effectiveTipBonus *= 2
  }

  // Task 3: Calculate serve time
  const serveTime = (Date.now() - state.customerArriveTime) / 1000

  // Task 3: Speed rush event bonus
  let speedRushBonus = 0
  if (state.activeEvent?.effect === 'speed_rush' && serveTime <= 3) {
    speedRushBonus = 50
  }

  const result = calculateServeResult(
    state.currentOrder, state.cupContents, state.combo,
    { tipBonus: effectiveTipBonus, isDaily: state.isDaily, dailyModifier: state.dailyModifier, serveTime },
  )

  // Apply speed rush bonus
  if (speedRushBonus > 0) {
    result.points += speedRushBonus
    result.speedBonus += speedRushBonus
    result.speedLabel = '⚡⚡ Speed Rush!'
  }

  // Task 2: Double order event
  if (state.activeEvent?.effect === 'double_order') {
    result.points *= 2
  }

  state.combo = result.newCombo
  state.maxCombo = Math.max(state.maxCombo, state.combo)
  if (result.isPerfect) state.perfectCount++
  state.score += result.points
  state.drinksServed++
  state.totalDrinksServed++
  state.customersServed++
  state.customersSinceEvent++
  state.customerMood = result.isPerfect ? 'happy' : 'sad'

  // Task 1: Perfect serve restores some patience (for display)
  if (result.isPerfect) {
    state.customerPatience = Math.min(state.customerMaxPatience, state.customerPatience + 3)
  }

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
  state.lastIngredientCorrect = null
}

export function endGame(state: BubbleTeaLabState): void {
  clearTimer(state)
  clearPatienceTimer(state)

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
  saveJson('ingredient_inventory', state.ingredientInventory)
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

// === Inventory (Expedition drops) ===

export function addInventoryDrops(state: BubbleTeaLabState, drops: { ingredientId: string; count: number }[]): void {
  for (const drop of drops) {
    state.ingredientInventory[drop.ingredientId] = (state.ingredientInventory[drop.ingredientId] ?? 0) + drop.count
  }
  saveJson('ingredient_inventory', state.ingredientInventory)
}

export function getInventoryCount(state: BubbleTeaLabState, ingredientId: string): number {
  return state.ingredientInventory[ingredientId] ?? 0
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
