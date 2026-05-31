import { TOPPINGS, MAX_TOPPINGS_PER_ORDER, getToppingById, type Topping } from '../data/toppings'
import {
  COOK_TIME, BURN_TIME, CUSTOMER_SPAWN_BASE, CUSTOMER_SPAWN_MIN,
  PATIENCE_BASE, PATIENCE_MIN, LEVEL_DURATION,
  CUSTOMERS_PER_LEVEL_BASE, MAX_LIVES,
} from './constants'

// === Types ===

export type WaffleState = 'empty' | 'cooking' | 'done' | 'burned'

export interface Order {
  toppings: string[] // topping IDs required
}

export interface Customer {
  id: number
  order: Order
  patience: number     // ms total patience
  arrivedAt: number    // timestamp
  served: boolean
  lost: boolean
}

export interface WaffleIron {
  state: WaffleState
  startedAt: number
  addedToppings: string[]
}

export interface GameState {
  level: number
  score: number
  coins: number
  lives: number
  customers: Customer[]
  waffle: WaffleIron
  totalServed: number
  perfectServed: number
  combo: number
  maxCombo: number
  levelTimer: number
  customersServedThisLevel: number
  customersNeeded: number
  gameOver: boolean
  paused: boolean
  nextCustomerId: number
  unlockedToppings: string[]
}

// === Initialization ===

export function createInitialState(): GameState {
  return {
    level: 1,
    score: 0,
    coins: 0,
    lives: MAX_LIVES,
    customers: [],
    waffle: { state: 'empty', startedAt: 0, addedToppings: [] },
    totalServed: 0,
    perfectServed: 0,
    combo: 0,
    maxCombo: 0,
    levelTimer: LEVEL_DURATION,
    customersServedThisLevel: 0,
    customersNeeded: CUSTOMERS_PER_LEVEL_BASE,
    gameOver: false,
    paused: false,
    nextCustomerId: 1,
    unlockedToppings: TOPPINGS.filter(t => t.unlockCost === 0).map(t => t.id),
  }
}

// === Order Generation ===

export function generateOrder(level: number, unlockedIds: readonly string[]): Order {
  const maxToppings = Math.min(MAX_TOPPINGS_PER_ORDER, 1 + Math.floor(level / 3))
  const count = 1 + Math.floor(Math.random() * maxToppings)
  const available = unlockedIds.filter(id => TOPPINGS.some(t => t.id === id))
  const chosen: string[] = []
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length)
    chosen.push(available[idx])
    available.splice(idx, 1)
  }
  return { toppings: chosen }
}

// === Customer Spawning ===

export function getSpawnInterval(level: number): number {
  return Math.max(CUSTOMER_SPAWN_MIN, CUSTOMER_SPAWN_BASE - level * 200)
}

export function getPatience(level: number): number {
  return Math.max(PATIENCE_MIN, PATIENCE_BASE - level * 400)
}

export function spawnCustomer(state: GameState, now: number): Customer {
  const customer: Customer = {
    id: state.nextCustomerId++,
    order: generateOrder(state.level, state.unlockedToppings),
    patience: getPatience(state.level),
    arrivedAt: now,
    served: false,
    lost: false,
  }
  state.customers.push(customer)
  return customer
}

// === Waffle Iron ===

export function startCooking(state: GameState, now: number): boolean {
  if (state.waffle.state !== 'empty') return false
  state.waffle = { state: 'cooking', startedAt: now, addedToppings: [] }
  return true
}

export function checkWaffleDone(state: GameState, now: number): boolean {
  if (state.waffle.state !== 'cooking') return false
  if (now - state.waffle.startedAt >= COOK_TIME) {
    state.waffle.state = 'done'
    return true
  }
  return false
}

export function checkWaffleBurned(state: GameState, now: number): boolean {
  if (state.waffle.state !== 'done') return false
  if (now - state.waffle.startedAt >= BURN_TIME) {
    state.waffle.state = 'burned'
    return true
  }
  return false
}

export function addToppingToWaffle(state: GameState, toppingId: string): boolean {
  if (state.waffle.state !== 'done') return false
  if (state.waffle.addedToppings.length >= MAX_TOPPINGS_PER_ORDER) return false
  if (!state.unlockedToppings.includes(toppingId)) return false
  if (state.waffle.addedToppings.includes(toppingId)) return false
  state.waffle.addedToppings.push(toppingId)
  return true
}

export function discardWaffle(state: GameState): void {
  state.waffle = { state: 'empty', startedAt: 0, addedToppings: [] }
}

// === Serving ===

export function checkOrderMatch(waffleToppings: readonly string[], orderToppings: readonly string[]): boolean {
  if (waffleToppings.length !== orderToppings.length) return false
  const sortedW = [...waffleToppings].sort()
  const sortedO = [...orderToppings].sort()
  return sortedW.every((v, i) => v === sortedO[i])
}

export function serveToCustomer(state: GameState, customerId: number, now: number): ServeResult | null {
  if (state.waffle.state !== 'done') return null
  const customer = state.customers.find(c => c.id === customerId && !c.served && !c.lost)
  if (!customer) return null

  const match = checkOrderMatch(state.waffle.addedToppings, customer.order.toppings)
  if (!match) return { success: false, points: 0, timeBonus: 0, perfect: false }

  customer.served = true
  const elapsed = now - customer.arrivedAt
  const timeBonus = Math.max(0, Math.floor((customer.patience - elapsed) / 200))
  const perfect = elapsed < customer.patience * 0.5

  let points = 10 + timeBonus
  if (perfect) {
    points *= 2
    state.perfectServed++
    state.combo++
  } else {
    state.combo = 0
  }
  state.maxCombo = Math.max(state.maxCombo, state.combo)

  points += state.combo * 2
  state.score += points
  state.coins += Math.max(1, Math.floor(points / 3))
  state.totalServed++
  state.customersServedThisLevel++

  // Clear waffle
  discardWaffle(state)

  // Check level completion
  if (state.customersServedThisLevel >= state.customersNeeded) {
    state.level++
    state.customersServedThisLevel = 0
    state.customersNeeded = CUSTOMERS_PER_LEVEL_BASE + Math.floor(state.level / 2)
    state.levelTimer = LEVEL_DURATION
  }

  return { success: true, points, timeBonus, perfect }
}

export interface ServeResult {
  success: boolean
  points: number
  timeBonus: number
  perfect: boolean
}

// === Customer Patience ===

export function updateCustomerPatience(state: GameState, now: number): number {
  let lost = 0
  for (const c of state.customers) {
    if (c.served || c.lost) continue
    if (now - c.arrivedAt >= c.patience) {
      c.lost = true
      state.lives--
      state.combo = 0
      lost++
    }
  }
  if (state.lives <= 0) {
    state.gameOver = true
  }
  return lost
}

// === Topping Unlock ===

export function canUnlockTopping(state: GameState, toppingId: string): boolean {
  const t = getToppingById(toppingId)
  if (state.unlockedToppings.includes(toppingId)) return false
  if (state.coins < t.unlockCost) return false
  if (state.level < t.unlockLevel) return false
  return true
}

export function unlockTopping(state: GameState, toppingId: string): boolean {
  if (!canUnlockTopping(state, toppingId)) return false
  const t = getToppingById(toppingId)
  state.coins -= t.unlockCost
  state.unlockedToppings.push(toppingId)
  return true
}

// === Level Config ===

export function getCustomersNeeded(level: number): number {
  return CUSTOMERS_PER_LEVEL_BASE + Math.floor(level / 2)
}
