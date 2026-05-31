import { UPGRADES, MILESTONES, getUpgradeCost, type Upgrade, type Milestone } from '../data/upgrades'
import { PRESTIGE_THRESHOLD, PRESTIGE_BONUS_PER_POINT, COMBO_TIMEOUT, BOOST_DURATION, BOOST_MULTIPLIER } from './constants'

export interface ClickerState {
  points: number
  totalPoints: number
  totalTaps: number
  upgradeLevels: Record<string, number>
  // Combo
  combo: number
  maxCombo: number
  lastTapTime: number
  // Prestige
  prestigeCount: number
  prestigeMultiplier: number
  // Milestones
  claimedMilestones: number[]
  // Boost
  boostActive: boolean
  boostEndTime: number
  // Auto-click
  autoClickAccumulator: number
}

export function createInitialState(): ClickerState {
  return {
    points: 0, totalPoints: 0, totalTaps: 0,
    upgradeLevels: {},
    combo: 0, maxCombo: 0, lastTapTime: 0,
    prestigeCount: 0, prestigeMultiplier: 1,
    claimedMilestones: [],
    boostActive: false, boostEndTime: 0,
    autoClickAccumulator: 0,
  }
}

// === Tap ===

export function calculateTapValue(state: ClickerState): number {
  const powerLevel = state.upgradeLevels['tap-power'] || 0
  const base = 1 + powerLevel
  const comboMult = getComboMultiplier(state)
  const prestige = state.prestigeMultiplier
  const boost = (state.boostActive && Date.now() < state.boostEndTime) ? BOOST_MULTIPLIER : 1
  return Math.floor(base * comboMult * prestige * boost)
}

export function tap(state: ClickerState, now: number = Date.now()): TapResult {
  // Combo
  if (now - state.lastTapTime < COMBO_TIMEOUT) {
    state.combo++
  } else {
    state.combo = 1
  }
  state.lastTapTime = now
  state.maxCombo = Math.max(state.maxCombo, state.combo)

  // Critical
  const critChance = getCritChance(state)
  const isCrit = Math.random() < critChance
  let value = calculateTapValue(state)
  if (isCrit) value *= 3

  state.points += value
  state.totalPoints += value
  state.totalTaps++

  return { value, isCrit, combo: state.combo }
}

export interface TapResult {
  value: number
  isCrit: boolean
  combo: number
}

// === Combo ===

export function getComboMultiplier(state: ClickerState): number {
  return 1 + state.combo * 0.05
}

export function updateCombo(state: ClickerState, now: number): void {
  if (state.combo > 0 && now - state.lastTapTime >= COMBO_TIMEOUT) {
    state.combo = 0
  }
}

// === Crit ===

export function getCritChance(state: ClickerState): number {
  const level = state.upgradeLevels['crit-chance'] || 0
  return Math.min(0.5, level * 0.02)
}

// === Auto-click ===

export function getAutoClickRate(state: ClickerState): number {
  const level = state.upgradeLevels['auto-click'] || 0
  return level * 0.5 // clicks per second
}

export function tickAutoClick(state: ClickerState, deltaSec: number): number {
  const rate = getAutoClickRate(state)
  if (rate <= 0) return 0
  state.autoClickAccumulator += rate * deltaSec
  const clicks = Math.floor(state.autoClickAccumulator)
  state.autoClickAccumulator -= clicks
  if (clicks > 0) {
    const value = calculateTapValue(state) * clicks
    state.points += value
    state.totalPoints += value
    state.totalTaps += clicks
  }
  return clicks
}

// === Upgrades ===

export function canBuyUpgrade(state: ClickerState, id: string): boolean {
  const u = UPGRADES.find(up => up.id === id)
  if (!u) return false
  const level = state.upgradeLevels[id] || 0
  return level < u.maxLevel && state.points >= getUpgradeCost(u, level)
}

export function buyUpgrade(state: ClickerState, id: string): boolean {
  if (!canBuyUpgrade(state, id)) return false
  const u = UPGRADES.find(up => up.id === id)!
  const level = state.upgradeLevels[id] || 0
  state.points -= getUpgradeCost(u, level)
  state.upgradeLevels[id] = level + 1
  return true
}

// === Milestones ===

export function checkMilestones(state: ClickerState): Milestone[] {
  const newlyClaimed: Milestone[] = []
  for (const m of MILESTONES) {
    if (!state.claimedMilestones.includes(m.taps) && state.totalTaps >= m.taps) {
      state.claimedMilestones.push(m.taps)
      state.points += m.reward
      state.totalPoints += m.reward
      newlyClaimed.push(m)
    }
  }
  return newlyClaimed
}

// === Prestige ===

export function getPrestigePoints(state: ClickerState): number {
  if (state.totalPoints < PRESTIGE_THRESHOLD) return 0
  return Math.floor(Math.sqrt(state.totalPoints / PRESTIGE_THRESHOLD))
}

export function canPrestige(state: ClickerState): boolean {
  return getPrestigePoints(state) > 0
}

export function doPrestige(state: ClickerState): number {
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

// === Boost ===

export function activateBoost(state: ClickerState, now: number = Date.now()): void {
  state.boostActive = true
  state.boostEndTime = now + BOOST_DURATION
}

export function updateBoost(state: ClickerState, now: number): void {
  if (state.boostActive && now >= state.boostEndTime) {
    state.boostActive = false
  }
}

// === Formatting ===

export function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return Math.floor(n).toString()
}
