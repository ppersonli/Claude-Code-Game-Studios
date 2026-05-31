import { RECIPES, getRecipeById, type Recipe } from '../data/recipes'
import { EQUIPMENT, getEquipmentCost, getEquipmentMultiplier, type Equipment } from '../data/equipment'
import { STAFF, getStaffCost, getStaffCps, type Staff } from '../data/staff'
import { LOCATIONS, getCurrentLocation, type Location } from '../data/locations'
import { TAP_BASE_INCOME, PRESTIGE_THRESHOLD, PRESTIGE_BONUS_PER_POINT } from './constants'

export interface IdleGameState {
  money: number
  totalEarned: number
  totalTaps: number
  totalCupsSold: number
  level: number

  unlockedRecipes: string[]
  selectedRecipe: string

  equipmentLevels: Record<string, number>
  staffCounts: Record<string, number>

  currentLocation: string
  unlockedLocations: string[]

  prestigeCount: number
  prestigeMultiplier: number

  lastSaveTime: number
}

export function createInitialState(): IdleGameState {
  return {
    money: 0,
    totalEarned: 0,
    totalTaps: 0,
    totalCupsSold: 0,
    level: 1,
    unlockedRecipes: ['classic'],
    selectedRecipe: 'classic',
    equipmentLevels: {},
    staffCounts: {},
    currentLocation: 'street',
    unlockedLocations: ['street'],
    prestigeCount: 0,
    prestigeMultiplier: 1,
    lastSaveTime: Date.now(),
  }
}

// === Tap Production ===

export function tap(state: IdleGameState): number {
  const income = calculateTapIncome(state)
  state.money += income
  state.totalEarned += income
  state.totalTaps++
  state.totalCupsSold++
  gainXp(state, 1)
  return income
}

export function calculateTapIncome(state: IdleGameState): number {
  const recipe = getRecipeById(state.selectedRecipe)
  const equipMult = getEquipmentMultiplier(state.equipmentLevels)
  const location = getCurrentLocation(state.currentLocation)
  return Math.floor(
    TAP_BASE_INCOME * recipe.basePrice * equipMult * location.incomeMultiplier * state.prestigeMultiplier
  )
}

// === Idle Income ===

export function calculateIdleIncomePerSecond(state: IdleGameState): number {
  const recipe = getRecipeById(state.selectedRecipe)
  const equipMult = getEquipmentMultiplier(state.equipmentLevels)
  const staffCps = getStaffCps(state.staffCounts)
  const location = getCurrentLocation(state.currentLocation)
  return Math.floor(
    staffCps * recipe.basePrice * equipMult * location.incomeMultiplier * state.prestigeMultiplier
  )
}

export function tickIdleIncome(state: IdleGameState): number {
  const income = calculateIdleIncomePerSecond(state)
  if (income > 0) {
    state.money += income
    state.totalEarned += income
    state.totalCupsSold += Math.floor(income / Math.max(1, getRecipeById(state.selectedRecipe).basePrice))
    gainXp(state, Math.max(1, Math.floor(income / 10)))
  }
  return income
}

// === Level / XP ===

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1))
}

function gainXp(state: IdleGameState, xp: number): void {
  while (state.totalEarned >= xpForLevel(state.level + 1) * 10) {
    state.level++
    checkRecipeUnlocks(state)
    checkLocationUnlocks(state)
  }
}

function checkRecipeUnlocks(state: IdleGameState): void {
  for (const recipe of RECIPES) {
    if (!state.unlockedRecipes.includes(recipe.id) && state.level >= recipe.unlockLevel) {
      // Don't auto-unlock, just make it available for purchase
    }
  }
}

function checkLocationUnlocks(state: IdleGameState): void {
  for (const loc of LOCATIONS) {
    if (!state.unlockedLocations.includes(loc.id) && state.level >= loc.requiredLevel) {
      // Don't auto-unlock, just make it available for purchase
    }
  }
}

// === Recipe Unlock ===

export function canUnlockRecipe(state: IdleGameState, recipeId: string): boolean {
  const recipe = getRecipeById(recipeId)
  if (state.unlockedRecipes.includes(recipeId)) return false
  if (state.money < recipe.unlockCost) return false
  if (state.level < recipe.unlockLevel) return false
  return true
}

export function unlockRecipe(state: IdleGameState, recipeId: string): boolean {
  if (!canUnlockRecipe(state, recipeId)) return false
  const recipe = getRecipeById(recipeId)
  state.money -= recipe.unlockCost
  state.unlockedRecipes.push(recipeId)
  state.selectedRecipe = recipeId
  return true
}

export function selectRecipe(state: IdleGameState, recipeId: string): boolean {
  if (!state.unlockedRecipes.includes(recipeId)) return false
  state.selectedRecipe = recipeId
  return true
}

// === Equipment ===

export function canBuyEquipment(state: IdleGameState, equipmentId: string): boolean {
  const eq = EQUIPMENT.find(e => e.id === equipmentId)
  if (!eq) return false
  const currentLevel = state.equipmentLevels[equipmentId] || 0
  if (currentLevel >= eq.maxLevel) return false
  return state.money >= getEquipmentCost(eq, currentLevel)
}

export function buyEquipment(state: IdleGameState, equipmentId: string): boolean {
  if (!canBuyEquipment(state, equipmentId)) return false
  const eq = EQUIPMENT.find(e => e.id === equipmentId)!
  const currentLevel = state.equipmentLevels[equipmentId] || 0
  const cost = getEquipmentCost(eq, currentLevel)
  state.money -= cost
  state.equipmentLevels[equipmentId] = currentLevel + 1
  return true
}

// === Staff ===

export function canHireStaff(state: IdleGameState, staffId: string): boolean {
  const staff = STAFF.find(s => s.id === staffId)
  if (!staff) return false
  const owned = state.staffCounts[staffId] || 0
  return state.money >= getStaffCost(staff, owned)
}

export function hireStaff(state: IdleGameState, staffId: string): boolean {
  if (!canHireStaff(state, staffId)) return false
  const staff = STAFF.find(s => s.id === staffId)!
  const owned = state.staffCounts[staffId] || 0
  const cost = getStaffCost(staff, owned)
  state.money -= cost
  state.staffCounts[staffId] = owned + 1
  return true
}

// === Location ===

export function canUnlockLocation(state: IdleGameState, locationId: string): boolean {
  const loc = getCurrentLocation(locationId)
  if (state.unlockedLocations.includes(locationId)) return false
  if (state.money < loc.unlockCost) return false
  if (state.level < loc.requiredLevel) return false
  return true
}

export function unlockLocation(state: IdleGameState, locationId: string): boolean {
  if (!canUnlockLocation(state, locationId)) return false
  const loc = getCurrentLocation(locationId)
  state.money -= loc.unlockCost
  state.unlockedLocations.push(locationId)
  state.currentLocation = locationId
  return true
}

export function switchLocation(state: IdleGameState, locationId: string): boolean {
  if (!state.unlockedLocations.includes(locationId)) return false
  state.currentLocation = locationId
  return true
}

// === Prestige ===

export function getPrestigePointsForReset(state: IdleGameState): number {
  if (state.totalEarned < PRESTIGE_THRESHOLD) return 0
  return Math.floor(Math.sqrt(state.totalEarned / PRESTIGE_THRESHOLD))
}

export function canPrestige(state: IdleGameState): boolean {
  return getPrestigePointsForReset(state) > 0
}

export function prestige(state: IdleGameState): number {
  const points = getPrestigePointsForReset(state)
  if (points <= 0) return 0

  const newPrestigeCount = state.prestigeCount + points
  const newMultiplier = 1 + newPrestigeCount * PRESTIGE_BONUS_PER_POINT

  // Reset state but keep prestige
  const newState = createInitialState()
  Object.assign(state, newState)
  state.prestigeCount = newPrestigeCount
  state.prestigeMultiplier = newMultiplier

  return points
}

// === Offline Earnings ===

export function calculateOfflineEarnings(state: IdleGameState, offlineMs: number, efficiency: number): number {
  const ips = calculateIdleIncomePerSecond(state)
  const seconds = offlineMs / 1000
  return Math.floor(ips * seconds * efficiency)
}

export function applyOfflineEarnings(state: IdleGameState, offlineMs: number, efficiency: number): number {
  const earnings = calculateOfflineEarnings(state, offlineMs, efficiency)
  if (earnings > 0) {
    state.money += earnings
    state.totalEarned += earnings
  }
  state.lastSaveTime = Date.now()
  return earnings
}

// === Formatting ===

export function formatMoney(amount: number): string {
  if (amount >= 1e12) return (amount / 1e12).toFixed(2) + 'T'
  if (amount >= 1e9) return (amount / 1e9).toFixed(2) + 'B'
  if (amount >= 1e6) return (amount / 1e6).toFixed(2) + 'M'
  if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'K'
  return Math.floor(amount).toString()
}

export function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}
