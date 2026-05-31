/**
 * Idle Coffee Shop — core game logic (pure functions, no Phaser/Vue dependency)
 */
import { RECIPES } from '../data/recipes'
import { EQUIPMENT } from '../data/equipment'
import { EMPLOYEES } from '../data/employees'

const SAVE_KEY = 'idle-coffee-shop-save'

export interface GameState {
  money: number
  totalEarned: number
  level: number
  xp: number
  equipment: Record<string, number>
  employees: Record<string, number>
  recipes: string[]
  selectedRecipe: string
  prestigeCount: number
  prestigeBonus: number
  lastOnline: number
  totalClicks: number
  totalCups: number
}

export function getDefaultState(): GameState {
  return {
    money: 0,
    totalEarned: 0,
    level: 1,
    xp: 0,
    equipment: { coffee: 1, grinder: 0, oven: 0, fridge: 0, decor: 0 },
    employees: {},
    recipes: ['americano'],
    selectedRecipe: 'americano',
    prestigeCount: 0,
    prestigeBonus: 1,
    lastOnline: Date.now(),
    totalClicks: 0,
    totalCups: 0,
  }
}

export function xpForLevel(level: number): number {
  return Math.floor(50 * level * (1 + level * 0.15))
}

export function formatMoney(amount: number): string {
  if (amount >= 1e9) return '$' + (amount / 1e9).toFixed(1) + 'B'
  if (amount >= 1e6) return '$' + (amount / 1e6).toFixed(1) + 'M'
  if (amount >= 1e3) return '$' + (amount / 1e3).toFixed(1) + 'K'
  return '$' + Math.floor(amount)
}

export function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

export function getUpgradeCost(equipKey: string, state: GameState): number {
  const data = EQUIPMENT[equipKey]
  if (!data) return 0
  const level = state.equipment[equipKey] || 0
  return Math.floor(data.baseCost * Math.pow(level + 1, data.costMult))
}

export function getEmployeeCost(empKey: string, state: GameState): number {
  const data = EMPLOYEES[empKey]
  if (!data) return 0
  const count = state.employees[empKey] || 0
  return Math.floor(data.cost * Math.pow(1.5, count))
}

export function getEarningsPerClick(state: GameState): number {
  const recipe = RECIPES[state.selectedRecipe] || RECIPES.americano
  let earnings = recipe.price

  const grinderLvl = state.equipment.grinder || 0
  earnings *= (1 + grinderLvl * EQUIPMENT.grinder.effectPerLevel)

  const decorLvl = state.equipment.decor || 0
  earnings *= (1 + decorLvl * EQUIPMENT.decor.effectPerLevel)

  if (recipe.type === 'cold') {
    const fridgeLvl = state.equipment.fridge || 0
    earnings *= (1 + fridgeLvl * EQUIPMENT.fridge.effectPerLevel)
  }

  const ovenLvl = state.equipment.oven || 0
  earnings *= (1 + ovenLvl * EQUIPMENT.oven.effectPerLevel)

  earnings *= state.prestigeBonus

  return earnings
}

export function getEarningsPerSecond(state: GameState): number {
  let eps = 0
  for (const [key, data] of Object.entries(EMPLOYEES)) {
    const count = state.employees[key] || 0
    eps += count * data.cupsPerSec
  }
  eps *= getEarningsPerClick(state)
  return eps
}

export function checkLevelUp(state: GameState): void {
  const required = xpForLevel(state.level)
  while (state.xp >= required && state.level < 100) {
    state.xp -= required
    state.level++
    onLevelUp(state)
  }
}

function onLevelUp(state: GameState): void {
  for (const [key, data] of Object.entries(RECIPES)) {
    if (!state.recipes.includes(key) && data.unlockLevel <= state.level) {
      state.recipes.push(key)
      state.selectedRecipe = key
    }
  }
}

export function makeCoffee(state: GameState): number {
  const earnings = getEarningsPerClick(state)
  state.money += earnings
  state.totalEarned += earnings
  state.totalCups++
  state.totalClicks++
  state.xp += 1 + Math.floor(state.level / 5)
  checkLevelUp(state)
  return earnings
}

export function upgradeEquipment(key: string, state: GameState): boolean {
  const cost = getUpgradeCost(key, state)
  if (state.money < cost) return false
  const data = EQUIPMENT[key]
  if (!data) return false
  const currentLevel = state.equipment[key] || 0
  if (currentLevel >= data.maxLevel) return false
  state.money -= cost
  state.equipment[key] = currentLevel + 1
  checkLevelUp(state)
  return true
}

export function hireEmployee(key: string, state: GameState): boolean {
  const cost = getEmployeeCost(key, state)
  if (state.money < cost) return false
  const data = EMPLOYEES[key]
  if (!data) return false
  const count = state.employees[key] || 0
  if (count >= data.maxCount) return false
  state.money -= cost
  state.employees[key] = count + 1
  return true
}

export function doPrestige(state: GameState): boolean {
  if (state.totalEarned < 1_000_000) return false
  const prestigeCount = state.prestigeCount + 1
  const prestigeBonus = 1 + prestigeCount * 0.1
  const newState = getDefaultState()
  newState.prestigeCount = prestigeCount
  newState.prestigeBonus = prestigeBonus
  newState.lastOnline = Date.now()
  const specialRecipes = ['iced_americano', 'iced_latte', 'flat_white', 'espresso', 'cold_brew', 'pour_over']
  for (let i = 0; i < Math.min(prestigeCount, specialRecipes.length); i++) {
    newState.recipes.push(specialRecipes[i])
  }
  const allRecipes = Object.entries(RECIPES)
  for (let i = allRecipes.length - 1; i >= 0; i--) {
    if (newState.recipes.includes(allRecipes[i][0])) {
      newState.selectedRecipe = allRecipes[i][0]
      break
    }
  }
  Object.assign(state, newState)
  return true
}

export function resetGame(state: GameState): void {
  Object.assign(state, getDefaultState())
}

export function autoBrew(state: GameState): number {
  let totalCups = 0
  for (const [key, data] of Object.entries(EMPLOYEES)) {
    const count = state.employees[key] || 0
    totalCups += count * data.cupsPerSec
  }
  if (totalCups > 0) {
    const earnings = totalCups * getEarningsPerClick(state)
    state.money += earnings
    state.totalEarned += earnings
    state.totalCups += totalCups
    state.xp += totalCups
    checkLevelUp(state)
  }
  return totalCups
}

export function calculateOfflineEarnings(state: GameState): number {
  const now = Date.now()
  const elapsed = (now - state.lastOnline) / 1000
  if (elapsed < 60) return 0
  let totalCups = 0
  for (const [key, data] of Object.entries(EMPLOYEES)) {
    const count = state.employees[key] || 0
    totalCups += count * data.cupsPerSec
  }
  if (totalCups > 0) {
    const maxOfflineTime = 3600 * 8
    const effectiveTime = Math.min(elapsed, maxOfflineTime)
    const offlineCups = totalCups * effectiveTime
    const earnings = offlineCups * getEarningsPerClick(state)
    state.money += earnings
    state.totalEarned += earnings
    state.totalCups += offlineCups
    return earnings
  }
  return 0
}

export function selectRecipe(key: string, state: GameState): boolean {
  if (!state.recipes.includes(key)) return false
  if (!RECIPES[key]) return false
  state.selectedRecipe = key
  return true
}

export function loadGameState(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (saved) {
      const state = JSON.parse(saved) as GameState
      const def = getDefaultState()
      for (const key of Object.keys(def) as (keyof GameState)[]) {
        if (!(key in state)) (state as unknown as Record<string, unknown>)[key] = def[key]
      }
      if (!state.equipment) state.equipment = def.equipment
      if (!state.employees) state.employees = {}
      if (!state.recipes) state.recipes = ['americano']
      return state
    }
  } catch { /* ignore */ }
  return getDefaultState()
}

export function saveGameState(state: GameState): void {
  try {
    state.lastOnline = Date.now()
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}
