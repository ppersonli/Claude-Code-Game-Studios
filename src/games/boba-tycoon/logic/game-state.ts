import { RECIPES, getRecipeById, type Recipe } from '../data/recipes'
import { EQUIPMENT, getEquipmentCost, getEquipmentMultiplier, type Equipment } from '../data/equipment'
import { STAFF, getStaffCost, getStaffCps, type Staff } from '../data/staff'
import { LOCATIONS, getLocationById, type Location } from '../data/locations'
import { getDailyChallenge, seededRandom, type DailyChallenge } from '../data/daily-challenges'
import { TAP_BASE, PRESTIGE_THRESHOLD, PRESTIGE_BONUS_PER_POINT, DAILY_DURATION, BOOST_DURATION, BOOST_MULTIPLIER } from './constants'

export interface TycoonState {
  money: number
  totalEarned: number
  totalTaps: number
  totalCups: number
  level: number
  selectedRecipe: string
  unlockedRecipes: string[]
  equipmentLevels: Record<string, number>
  staffCounts: Record<string, number>
  currentLocation: string
  unlockedLocations: string[]
  prestigeCount: number
  prestigeMultiplier: number
  lastSaveTime: number
  // Daily challenge
  dailyActive: boolean
  dailyProgress: number
  dailyCompleted: boolean
  dailyLastSeed: number
  // Boost
  boostActive: boolean
  boostEndTime: number
  // Combo
  tapCombo: number
  comboTimer: number
}

export function createInitialState(): TycoonState {
  return {
    money: 0, totalEarned: 0, totalTaps: 0, totalCups: 0, level: 1,
    selectedRecipe: 'classic-milk-tea', unlockedRecipes: ['classic-milk-tea'],
    equipmentLevels: {}, staffCounts: {},
    currentLocation: 'cart', unlockedLocations: ['cart'],
    prestigeCount: 0, prestigeMultiplier: 1, lastSaveTime: Date.now(),
    dailyActive: false, dailyProgress: 0, dailyCompleted: false, dailyLastSeed: 0,
    boostActive: false, boostEndTime: 0,
    tapCombo: 0, comboTimer: 0,
  }
}

// === Tap ===

export function tap(state: TycoonState, now: number = Date.now()): number {
  const base = calculateTapIncome(state)
  // Combo bonus: +1% per combo, max 50%
  const comboMult = 1 + Math.min(state.tapCombo, 50) * 0.01
  const boostMult = (state.boostActive && now < state.boostEndTime) ? BOOST_MULTIPLIER : 1
  const income = Math.floor(base * comboMult * boostMult)
  state.money += income
  state.totalEarned += income
  state.totalTaps++
  state.totalCups++
  state.tapCombo++
  state.comboTimer = now + 2000 // combo expires 2s after last tap
  gainXp(state)
  if (state.dailyActive) state.dailyProgress++
  return income
}

export function calculateTapIncome(state: TycoonState): number {
  const recipe = getRecipeById(state.selectedRecipe)
  const equip = getEquipmentMultiplier(state.equipmentLevels)
  const loc = getLocationById(state.currentLocation)
  return Math.floor(TAP_BASE * recipe.basePrice * equip * loc.incomeMult * state.prestigeMultiplier)
}

// === Idle ===

export function calculateIdleIncome(state: TycoonState): number {
  const recipe = getRecipeById(state.selectedRecipe)
  const equip = getEquipmentMultiplier(state.equipmentLevels)
  const staff = getStaffCps(state.staffCounts)
  const loc = getLocationById(state.currentLocation)
  return Math.floor(staff * recipe.basePrice * equip * loc.incomeMult * state.prestigeMultiplier)
}

export function tickIdle(state: TycoonState, now: number = Date.now()): number {
  const base = calculateIdleIncome(state)
  const boostMult = (state.boostActive && now < state.boostEndTime) ? BOOST_MULTIPLIER : 1
  const income = Math.floor(base * boostMult)
  if (income > 0) {
    state.money += income
    state.totalEarned += income
    state.totalCups += Math.max(1, Math.floor(income / Math.max(1, getRecipeById(state.selectedRecipe).basePrice)))
    gainXp(state)
    if (state.dailyActive) {
      const daily = getDailyState()
      if (daily.challenge.type === 'earn') state.dailyProgress += income
    }
  }
  // Combo decay
  if (now > state.comboTimer && state.tapCombo > 0) {
    state.tapCombo = 0
  }
  // Boost expiry
  if (state.boostActive && now >= state.boostEndTime) {
    state.boostActive = false
  }
  return income
}

// === XP / Level ===

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.12, level - 1))
}

function gainXp(state: TycoonState): void {
  while (state.totalEarned >= xpForLevel(state.level + 1) * 10) {
    state.level++
  }
}

// === Recipes ===

export function canUnlockRecipe(state: TycoonState, id: string): boolean {
  const r = getRecipeById(id)
  return !state.unlockedRecipes.includes(id) && state.money >= r.unlockCost && state.level >= r.unlockLevel
}

export function unlockRecipe(state: TycoonState, id: string): boolean {
  if (!canUnlockRecipe(state, id)) return false
  state.money -= getRecipeById(id).unlockCost
  state.unlockedRecipes.push(id)
  state.selectedRecipe = id
  return true
}

export function selectRecipe(state: TycoonState, id: string): boolean {
  if (!state.unlockedRecipes.includes(id)) return false
  state.selectedRecipe = id
  return true
}

// === Equipment ===

export function canBuyEquipment(state: TycoonState, id: string): boolean {
  const eq = EQUIPMENT.find(e => e.id === id)
  if (!eq) return false
  const lvl = state.equipmentLevels[id] || 0
  return lvl < eq.maxLevel && state.money >= getEquipmentCost(eq, lvl)
}

export function buyEquipment(state: TycoonState, id: string): boolean {
  if (!canBuyEquipment(state, id)) return false
  const eq = EQUIPMENT.find(e => e.id === id)!
  const lvl = state.equipmentLevels[id] || 0
  state.money -= getEquipmentCost(eq, lvl)
  state.equipmentLevels[id] = lvl + 1
  return true
}

// === Staff ===

export function canHireStaff(state: TycoonState, id: string): boolean {
  const s = STAFF.find(st => st.id === id)
  if (!s) return false
  return state.money >= getStaffCost(s, state.staffCounts[id] || 0)
}

export function hireStaff(state: TycoonState, id: string): boolean {
  if (!canHireStaff(state, id)) return false
  const s = STAFF.find(st => st.id === id)!
  const owned = state.staffCounts[id] || 0
  state.money -= getStaffCost(s, owned)
  state.staffCounts[id] = owned + 1
  return true
}

// === Location ===

export function canUnlockLocation(state: TycoonState, id: string): boolean {
  const l = getLocationById(id)
  return !state.unlockedLocations.includes(id) && state.money >= l.unlockCost && state.level >= l.requiredLevel
}

export function unlockLocation(state: TycoonState, id: string): boolean {
  if (!canUnlockLocation(state, id)) return false
  state.money -= getLocationById(id).unlockCost
  state.unlockedLocations.push(id)
  state.currentLocation = id
  return true
}

export function switchLocation(state: TycoonState, id: string): boolean {
  if (!state.unlockedLocations.includes(id)) return false
  state.currentLocation = id
  return true
}

// === Prestige ===

export function getPrestigePoints(state: TycoonState): number {
  if (state.totalEarned < PRESTIGE_THRESHOLD) return 0
  return Math.floor(Math.sqrt(state.totalEarned / PRESTIGE_THRESHOLD))
}

export function canPrestige(state: TycoonState): boolean {
  return getPrestigePoints(state) > 0
}

export function doPrestige(state: TycoonState): number {
  const pts = getPrestigePoints(state)
  if (pts <= 0) return 0
  const newCount = state.prestigeCount + pts
  const newMult = 1 + newCount * PRESTIGE_BONUS_PER_POINT
  const fresh = createInitialState()
  Object.assign(state, fresh)
  state.prestigeCount = newCount
  state.prestigeMultiplier = newMult
  return pts
}

// === Daily Challenge ===

export interface DailyState {
  challenge: DailyChallenge
  seed: number
}

export function getDailyState(): DailyState {
  const now = new Date()
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  return { challenge: getDailyChallenge(seed), seed }
}

export function startDaily(state: TycoonState): void {
  const daily = getDailyState()
  state.dailyActive = true
  state.dailyProgress = 0
  state.dailyCompleted = false
  state.dailyLastSeed = daily.seed
}

export function checkDailyComplete(state: TycoonState): boolean {
  if (!state.dailyActive) return false
  const daily = getDailyState()
  if (state.dailyProgress >= daily.challenge.target && !state.dailyCompleted) {
    state.dailyCompleted = true
    state.money += daily.challenge.reward
    state.totalEarned += daily.challenge.reward
    return true
  }
  return false
}

// === Boost ===

export function activateBoost(state: TycoonState, now: number = Date.now()): void {
  state.boostActive = true
  state.boostEndTime = now + BOOST_DURATION
}

// === Offline ===

export function applyOffline(state: TycoonState, offlineMs: number): number {
  const ips = calculateIdleIncome(state)
  const secs = offlineMs / 1000
  const earned = Math.floor(ips * secs * 0.5)
  if (earned > 0) {
    state.money += earned
    state.totalEarned += earned
  }
  state.lastSaveTime = Date.now()
  return earned
}

// === Formatting ===

export function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}

// Daily challenge holder (set during state creation)
declare module './constants' {}
