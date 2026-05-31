import { getSkinById, type Skin } from '../core/Skin'

interface SkinData {
  unlocked: string[]
  equipped: string
}

export interface PurchaseResult {
  success: boolean
  reason?: string
}

/**
 * SkinManager - manages skin purchases, equipping, and ticket economy.
 * Uses localStorage for persistence.
 */
export class SkinManager {
  private static readonly TICKETS_KEY = 'color-chaos-tickets'
  private static readonly SKINS_KEY = 'color-chaos-skins'
  private static readonly DEFAULT_EQUIPPED = 'classic'

  static getTicketBalance(): number {
    if (typeof localStorage === 'undefined') return 0
    try {
      const stored = localStorage.getItem(this.TICKETS_KEY)
      if (stored) {
        const value = parseInt(stored)
        if (!isNaN(value) && value >= 0) return value
      }
    } catch {
      // Silently handle
    }
    return 0
  }

  static addTickets(amount: number): number {
    if (amount <= 0) return this.getTicketBalance()
    const newBalance = this.getTicketBalance() + amount
    this.saveTicketBalance(newBalance)
    return newBalance
  }

  static spendTickets(amount: number): boolean {
    if (amount <= 0) return false
    const balance = this.getTicketBalance()
    if (balance < amount) return false
    this.saveTicketBalance(balance - amount)
    return true
  }

  static getUnlockedSkins(): string[] {
    const data = this.loadSkinData()
    return data.unlocked
  }

  static isSkinUnlocked(skinId: string): boolean {
    return this.getUnlockedSkins().includes(skinId)
  }

  static purchaseSkin(skinId: string): PurchaseResult {
    const skin = getSkinById(skinId)

    if (this.isSkinUnlocked(skinId)) {
      return { success: false, reason: 'Already owned' }
    }

    if (!this.spendTickets(skin.cost)) {
      return { success: false, reason: 'Insufficient tickets' }
    }

    const data = this.loadSkinData()
    data.unlocked.push(skinId)
    this.saveSkinData(data)

    return { success: true }
  }

  static getEquippedSkinId(): string {
    const data = this.loadSkinData()
    return data.equipped
  }

  static equipSkin(skinId: string): boolean {
    if (!this.isSkinUnlocked(skinId)) return false
    const data = this.loadSkinData()
    data.equipped = skinId
    this.saveSkinData(data)
    return true
  }

  static getEquippedSkin(): Skin {
    return getSkinById(this.getEquippedSkinId())
  }

  static calculateTicketsForStars(stars: number): number {
    if (stars < 0) return 0
    return Math.floor(stars)
  }

  static resetSkins(): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(this.TICKETS_KEY)
      localStorage.removeItem(this.SKINS_KEY)
    } catch {
      // Silently handle
    }
  }

  private static saveTicketBalance(amount: number): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(this.TICKETS_KEY, amount.toString())
    } catch {
      // Silently handle
    }
  }

  private static loadSkinData(): SkinData {
    if (typeof localStorage === 'undefined') {
      return { unlocked: ['classic'], equipped: this.DEFAULT_EQUIPPED }
    }
    try {
      const stored = localStorage.getItem(this.SKINS_KEY)
      if (stored) {
        const data = JSON.parse(stored) as SkinData
        if (Array.isArray(data.unlocked) && typeof data.equipped === 'string') {
          return data
        }
      }
    } catch {
      // Silently handle corrupted storage
    }
    return { unlocked: ['classic'], equipped: this.DEFAULT_EQUIPPED }
  }

  private static saveSkinData(data: SkinData): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(this.SKINS_KEY, JSON.stringify(data))
    } catch {
      // Silently handle
    }
  }
}
