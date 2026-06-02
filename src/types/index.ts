// === Ingredient ===

export type IngredientType = 'tea' | 'liquid' | 'topping' | 'fruit' | 'extra'

export interface Ingredient {
  id: string
  name: string
  img: string
  type: IngredientType
  color: string
  locked?: boolean
  unlockCost?: number
  seasonal?: 'spring' | 'halloween' | 'christmas' // 季节限定标记
}

// === Customer ===

export type CustomerRarity = 'common' | 'rare' | 'legendary'

export interface Customer {
  name: string
  img: string
  rarity: CustomerRarity
  tipBonus?: number
  locked?: boolean
  unlockCost?: number
  personalityId?: string // 关联到顾客AI性格
}

// === Achievement ===

export interface GameState {
  score: number
  level: number
  combo: number
  maxCombo: number
  perfectCount: number
  totalDrinksServed: number
  customersServed: number
  maxCustomers: number
  timeLeft?: number
  cupContents: Ingredient[]
  currentOrder: Ingredient[]
  currentCustomer: Customer | null
  totalCoins: number
  achievements: string[]
  unlockedIngredients: string[]
  unlockedCustomers: string[]
  dailyCompleted: boolean
  dailyGoalProgress: number
}

export interface Achievement {
  id: string
  name: string
  desc: string
  img: string
  check: (state: GameState) => boolean
}

// === Daily Challenge ===

export interface DailyGoal {
  type: 'perfect' | 'level' | 'score' | 'combo'
  count: number
}

export interface DailyModifier {
  name: string
  desc: string
  timeLimit: number
  scoreMultiplier: number
  icon: string
  goal?: DailyGoal
}

// === Game Results ===

export interface ServeResult {
  matches: number
  wrong: number
  points: number
  isPerfect: boolean
  newCombo: number
  orderUsed: boolean[]
  cupUsed: boolean[]
}

export interface ServeOptions {
  comboMultiplier?: number
  scoreMultiplier?: number
  tipBonus?: number
}

// === Meme Match ===

export interface Meme {
  id: string
  name: string
  emoji: string
  tier: 1 | 2 | 3
}

export interface CardState {
  id: number
  memeId: string
  flipped: boolean
  matched: boolean
}

export interface GameLevel {
  id: number
  name: string
  cols: number
  rows: number
  timeLimit: number
  requiredScore: number
}

export interface MatchResult {
  isMatch: boolean
  combo: number
  points: number
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface MemeMatchState {
  cards: CardState[]
  level: GameLevel
  status: GameStatus
  score: number
  combo: number
  maxCombo: number
  misses: number
  matchesFound: number
  totalPairs: number
  timeRemaining: number
  flippedCardIds: number[]
  bestScores: Record<string, number>
  unlockedLevels: number
}

// === Visual Effects ===

export interface FloatTextOptions {
  x: number
  y: number
  text: string
  color?: string
  duration?: number
  parent?: HTMLElement
}

// === Persistence ===

export interface SaveData {
  achievements: string[]
  unlockedIngredients: string[]
  unlockedCustomers: string[]
  coins: number
  totalDrinksServed: number
}
