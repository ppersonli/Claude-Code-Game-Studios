import type { Grade } from '../data/types'

const SAVE_KEY = 'runway-fashion-save'

export interface SaveData {
  coins: number
  highScore: number
  playerLevel: number
  collectedClothing: string[]
  totalGamesPlayed: number
  gradeCount: Record<Grade, number>
}

export function createDefaultSaveData(): SaveData {
  return {
    coins: 0,
    highScore: 0,
    playerLevel: 1,
    collectedClothing: [],
    totalGamesPlayed: 0,
    gradeCount: { S: 0, A: 0, B: 0, C: 0, D: 0 },
  }
}

function mergeWithDefaults(raw: Record<string, unknown>): SaveData {
  const defaults = createDefaultSaveData()
  return {
    coins: typeof raw.coins === 'number' ? raw.coins : defaults.coins,
    highScore: typeof raw.highScore === 'number' ? raw.highScore : defaults.highScore,
    playerLevel: typeof raw.playerLevel === 'number' ? raw.playerLevel : defaults.playerLevel,
    collectedClothing: Array.isArray(raw.collectedClothing)
      ? raw.collectedClothing as string[]
      : defaults.collectedClothing,
    totalGamesPlayed: typeof raw.totalGamesPlayed === 'number'
      ? raw.totalGamesPlayed
      : defaults.totalGamesPlayed,
    gradeCount: raw.gradeCount && typeof raw.gradeCount === 'object'
      ? { ...defaults.gradeCount, ...(raw.gradeCount as Record<string, number>) }
      : defaults.gradeCount,
  }
}

export class SaveSystem {
  /** Load save data, falling back to defaults for missing/corrupt saves. */
  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return createDefaultSaveData()
      const parsed = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return createDefaultSaveData()
      return mergeWithDefaults(parsed)
    } catch {
      return createDefaultSaveData()
    }
  }

  /** Persist save data to localStorage. */
  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch { /* quota exceeded — silently ignore */ }
  }

  /** Add coins to the player's balance. */
  addCoins(amount: number): void {
    const data = this.load()
    data.coins += amount
    this.save(data)
  }

  /** Update high score only if the new score is higher. */
  updateHighScore(score: number): void {
    const data = this.load()
    if (score > data.highScore) {
      data.highScore = score
      this.save(data)
    }
  }

  /** Unlock a clothing item (idempotent). */
  unlockClothing(clothingId: string): void {
    const data = this.load()
    if (!data.collectedClothing.includes(clothingId)) {
      data.collectedClothing.push(clothingId)
      this.save(data)
    }
  }

  /** Check if a clothing item has been collected. */
  isClothingCollected(clothingId: string): boolean {
    return this.load().collectedClothing.includes(clothingId)
  }

  /** Record that a game was played. */
  recordGamePlayed(): void {
    const data = this.load()
    data.totalGamesPlayed += 1
    this.save(data)
  }

  /** Record a grade result. */
  recordGrade(grade: Grade): void {
    const data = this.load()
    data.gradeCount[grade] += 1
    this.save(data)
  }

  /** Get the current player level. */
  getPlayerLevel(): number {
    return this.load().playerLevel
  }

  /** Reset all save data to defaults. */
  reset(): void {
    this.save(createDefaultSaveData())
  }
}
