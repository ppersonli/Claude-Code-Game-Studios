/** Player save state management */
import { GAME_CONFIG, type UpgradeKey, type ShipId } from '../config'

export interface PlayerState {
  stardust: number
  crystals: number
  plasma: number
  voidEssence: number
  stardustTotal: number  // lifetime total for prestige calculation

  // Upgrades
  upgrades: Record<UpgradeKey, number>

  // Ships
  unlockedShips: ShipId[]
  activeShip: ShipId

  // Star systems
  unlockedSystems: string[]

  // Prestige
  prestigeCount: number
  prestigeCores: number

  // Stats
  totalLaunches: number
  bestDistance: number
  totalPlayTime: number  // seconds

  // Daily challenge
  lastDailyDate: string
  dailyStreak: number
  dailyChallengesCompleted: number[]

  // Achievements
  unlockedAchievements: string[]

  // Timestamps
  lastOnline: number
  createdAt: number
}

const DEFAULT_STATE: PlayerState = {
  stardust: 0,
  crystals: 0,
  plasma: 0,
  voidEssence: 0,
  stardustTotal: 0,
  upgrades: {
    launchPower: 0,
    fuelCapacity: 0,
    gravityResist: 0,
    stardustMagnet: 0,
    autoCollector: 0,
  },
  unlockedShips: ['scout'],
  activeShip: 'scout',
  unlockedSystems: ['sol'],
  prestigeCount: 0,
  prestigeCores: 0,
  totalLaunches: 0,
  bestDistance: 0,
  totalPlayTime: 0,
  lastOnline: Date.now(),
  dailyStreak: 0,
  lastDailyDate: '',
  dailyChallengesCompleted: [],
  unlockedAchievements: [],
  createdAt: Date.now(),
}

const SAVE_KEY = 'orbit-odyssey-save'

export class SaveSystem {
  private state: PlayerState

  constructor() {
    this.state = this.load()
    this.calculateOfflineEarnings()
  }

  getState(): PlayerState {
    return this.state
  }

  updateState(partial: Partial<PlayerState>): void {
    Object.assign(this.state, partial)
    this.save()
  }

  addStardust(amount: number): void {
    const multiplier = 1 + this.state.prestigeCores * GAME_CONFIG.PRESTIGE_CORE_BONUS
    const finalAmount = Math.floor(amount * multiplier)
    this.state.stardust += finalAmount
    this.state.stardustTotal += finalAmount
    this.save()
  }

  addCrystals(amount: number): void {
    this.state.crystals += amount
    this.save()
  }

  addPlasma(amount: number): void {
    this.state.plasma += amount
    this.save()
  }

  addVoidEssence(amount: number): void {
    this.state.voidEssence += amount
    this.save()
  }

  getUpgradeLevel(key: UpgradeKey): number {
    return this.state.upgrades[key] || 0
  }

  getUpgradeCost(key: UpgradeKey): number {
    const config = GAME_CONFIG.UPGRADES[key]
    const level = this.getUpgradeLevel(key)
    return Math.floor(config.baseCost * Math.pow(GAME_CONFIG.UPGRADE_COST_MULTIPLIER, level))
  }

  purchaseUpgrade(key: UpgradeKey): boolean {
    const cost = this.getUpgradeCost(key)
    const config = GAME_CONFIG.UPGRADES[key]
    if (this.state.stardust >= cost && this.getUpgradeLevel(key) < config.maxLevel) {
      this.state.stardust -= cost
      this.state.upgrades[key]++
      this.save()
      return true
    }
    return false
  }

  unlockShip(shipId: ShipId): boolean {
    const ship = GAME_CONFIG.SHIPS.find(s => s.id === shipId)
    if (!ship || this.state.unlockedShips.includes(shipId)) return false
    if (this.state.stardust >= ship.cost) {
      this.state.stardust -= ship.cost
      this.state.unlockedShips.push(shipId)
      this.save()
      return true
    }
    return false
  }

  selectShip(shipId: ShipId): void {
    if (this.state.unlockedShips.includes(shipId)) {
      this.state.activeShip = shipId
      this.save()
    }
  }

  unlockSystem(systemId: string, cost: number): boolean {
    if (this.state.unlockedSystems.includes(systemId)) return false
    if (this.state.stardust >= cost) {
      this.state.stardust -= cost
      this.state.unlockedSystems.push(systemId)
      this.save()
      return true
    }
    return false
  }

  canPrestige(): boolean {
    const requirement = this.getPrestigeRequirement()
    return this.state.stardustTotal >= requirement
  }

  getPrestigeRequirement(): number {
    return Math.floor(
      GAME_CONFIG.PRESTIGE_BASE_REQUIREMENT *
      Math.pow(GAME_CONFIG.PRESTIGE_REQUIREMENT_MULTIPLIER, this.state.prestigeCount)
    )
  }

  performPrestige(): number {
    if (!this.canPrestige()) return 0

    const coresEarned = Math.floor(Math.sqrt(this.state.stardustTotal / 1000))
    this.state.prestigeCores += coresEarned
    this.state.prestigeCount++

    // Reset progress but keep prestige stuff
    this.state.stardust = 0
    this.state.crystals = 0
    this.state.plasma = 0
    this.state.voidEssence = 0
    this.state.stardustTotal = 0
    this.state.upgrades = { launchPower: 0, fuelCapacity: 0, gravityResist: 0, stardustMagnet: 0, autoCollector: 0 }
    this.state.unlockedShips = ['scout']
    this.state.activeShip = 'scout'
    this.state.unlockedSystems = ['sol']

    this.save()
    return coresEarned
  }

  recordLaunch(distance: number): void {
    this.state.totalLaunches++
    if (distance > this.state.bestDistance) {
      this.state.bestDistance = distance
    }
    this.save()
  }

  getOfflineEarnings(): number {
    const now = Date.now()
    const elapsed = (now - this.state.lastOnline) / 1000 // seconds
    const autoLevel = this.state.upgrades.autoCollector
    if (autoLevel <= 0 || elapsed < 60) return 0

    const baseRate = autoLevel * 0.5 // stardust per second
    const maxHours = 8
    const cappedElapsed = Math.min(elapsed, maxHours * 3600)
    const multiplier = 1 + this.state.prestigeCores * GAME_CONFIG.PRESTIGE_CORE_BONUS

    return Math.floor(baseRate * cappedElapsed * multiplier)
  }

  private calculateOfflineEarnings(): void {
    const earnings = this.getOfflineEarnings()
    if (earnings > 0) {
      this.state.stardust += earnings
      this.state.stardustTotal += earnings
      this.save()
    }
    this.state.lastOnline = Date.now()
    this.save()
  }

  private save(): void {
    this.state.lastOnline = Date.now()
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state))
    } catch {
      // localStorage full or unavailable
    }
  }

  private load(): PlayerState {
    try {
      const saved = localStorage.getItem(SAVE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_STATE, ...parsed }
      }
    } catch {
      // corrupted save
    }
    return { ...DEFAULT_STATE, createdAt: Date.now() }
  }

  resetAll(): void {
    this.state = { ...DEFAULT_STATE, createdAt: Date.now() }
    this.save()
  }

  // Achievement methods
  hasAchievement(achievementId: string): boolean {
    return this.state.unlockedAchievements.includes(achievementId)
  }

  unlockAchievement(achievementId: string): boolean {
    if (this.hasAchievement(achievementId)) return false
    this.state.unlockedAchievements.push(achievementId)
    this.save()
    return true
  }

  getAchievementCount(): number {
    return this.state.unlockedAchievements.length
  }

  // Daily challenge methods
  isDailyCompletedToday(): boolean {
    return this.state.lastDailyDate === this.getTodayDate()
  }

  completeDailyChallenge(): boolean {
    if (this.isDailyCompletedToday()) return false
    this.state.lastDailyDate = this.getTodayDate()
    this.state.dailyStreak++
    this.save()
    return true
  }

  private getTodayDate(): string {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  }
}
