import type { LevelConfig } from '../core/GameState'
import { LevelGenerator } from '../core/LevelGenerator'

/**
 * Level progress data stored in LocalStorage.
 */
export interface LevelProgress {
  completed: boolean
  stars: number // 0-3
  bestMoves: number
}

/**
 * Level difficulty configuration for a range of levels.
 */
interface DifficultyRange {
  minLevel: number
  maxLevel: number
  colorCount: number
  tubeCapacity: number
  emptyTubes: number
}

/**
 * LevelManager - manages level progression, difficulty curve, and progress persistence.
 * Levels 1-100 with increasing difficulty.
 */
export class LevelManager {
  private static readonly STORAGE_KEY = 'color-chaos-progress'
  private static readonly CURRENT_LEVEL_KEY = 'color-chaos-current-level'

  /**
   * Difficulty ranges for the 100 levels.
   */
  private static readonly DIFFICULTY_RANGES: DifficultyRange[] = [
    { minLevel: 1, maxLevel: 10, colorCount: 3, tubeCapacity: 4, emptyTubes: 2 },
    { minLevel: 11, maxLevel: 25, colorCount: 4, tubeCapacity: 4, emptyTubes: 2 },
    { minLevel: 26, maxLevel: 50, colorCount: 5, tubeCapacity: 4, emptyTubes: 2 },
    { minLevel: 51, maxLevel: 75, colorCount: 7, tubeCapacity: 4, emptyTubes: 2 },
    { minLevel: 76, maxLevel: 100, colorCount: 9, tubeCapacity: 4, emptyTubes: 2 },
  ]

  /**
   * Get the difficulty range for a given level.
   */
  static getDifficultyRange(level: number): DifficultyRange {
    if (level < 1) level = 1
    if (level > 100) level = 100

    for (const range of this.DIFFICULTY_RANGES) {
      if (level >= range.minLevel && level <= range.maxLevel) {
        return range
      }
    }

    return this.DIFFICULTY_RANGES[0]
  }

  /**
   * Adjust color count for intermediate levels within a range.
   */
  static getColorCountForLevel(level: number): number {
    const range = this.getDifficultyRange(level)
    const rangeSize = range.maxLevel - range.minLevel + 1
    const positionInRange = level - range.minLevel

    if (range.minLevel <= 10) return 3
    if (range.minLevel >= 11 && range.maxLevel <= 25) return 4

    let startColors: number
    let endColors: number

    if (level >= 26 && level <= 50) {
      startColors = 5
      endColors = 6
    } else if (level >= 51 && level <= 75) {
      startColors = 7
      endColors = 8
    } else if (level >= 76 && level <= 100) {
      startColors = 9
      endColors = 12
    } else {
      return range.colorCount
    }

    const t = positionInRange / (rangeSize - 1)
    return Math.round(startColors + t * (endColors - startColors))
  }

  /**
   * Get empty tube count for a level.
   */
  static getEmptyTubeCountForLevel(_level: number): number {
    return 2
  }

  /**
   * Get tube capacity for a level.
   */
  static getTubeCapacityForLevel(_level: number): number {
    return 4
  }

  /**
   * Generate a level configuration for a given level number.
   */
  static generateLevel(level: number): LevelConfig {
    const colorCount = this.getColorCountForLevel(level)
    const tubeCapacity = this.getTubeCapacityForLevel(level)
    const emptyTubes = this.getEmptyTubeCountForLevel(level)
    const clampedColors = Math.max(1, Math.min(12, colorCount))

    return LevelGenerator.generate(clampedColors, tubeCapacity, emptyTubes)
  }

  /**
   * Calculate the optimal (minimum) number of moves for a level.
   */
  static getOptimalMoves(level: number): number {
    const colorCount = this.getColorCountForLevel(level)
    return colorCount * 2 + 1
  }

  /**
   * Calculate star rating based on moves taken.
   * 3 stars: moves <= optimal
   * 2 stars: moves <= optimal * 1.5
   * 1 star: otherwise
   */
  static calculateStars(moves: number, level: number): number {
    const optimal = this.getOptimalMoves(level)
    if (moves <= optimal) return 3
    if (moves <= Math.floor(optimal * 1.5)) return 2
    return 1
  }

  /**
   * Get the maximum number of moves for a "sane" rating.
   */
  static getMaxReasonableMoves(level: number): number {
    const optimal = this.getOptimalMoves(level)
    return optimal * 3
  }

  /**
   * Load all level progress from LocalStorage.
   */
  static loadProgress(): Map<number, LevelProgress> {
    const progress = new Map<number, LevelProgress>()

    if (typeof localStorage === 'undefined') {
      return progress
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as Record<number, LevelProgress>
        for (const [key, value] of Object.entries(data)) {
          progress.set(parseInt(key), value as LevelProgress)
        }
      }
    } catch {
      // Silently handle corrupted storage
    }

    return progress
  }

  /**
   * Save all level progress to LocalStorage.
   */
  static saveProgress(progress: Map<number, LevelProgress>): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const data: Record<number, LevelProgress> = {}
      for (const [key, value] of progress) {
        data[key] = value
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Silently handle storage errors
    }
  }

  /**
   * Save progress for a specific level.
   */
  static saveLevelProgress(level: number, moves: number): LevelProgress {
    const allProgress = this.loadProgress()
    const stars = this.calculateStars(moves, level)

    const existing = allProgress.get(level)
    if (!existing || !existing.completed || moves < existing.bestMoves) {
      const newProgress: LevelProgress = {
        completed: true,
        stars: Math.max(stars, existing?.stars ?? 0),
        bestMoves: Math.min(moves, existing?.bestMoves ?? Infinity),
      }
      allProgress.set(level, newProgress)
      this.saveProgress(allProgress)
      return newProgress
    }

    if (stars > existing.stars) {
      existing.stars = stars
      allProgress.set(level, existing)
      this.saveProgress(allProgress)
    }

    return existing
  }

  /**
   * Check if a level is unlocked (can be played).
   */
  static isLevelUnlocked(level: number, progress: Map<number, LevelProgress>): boolean {
    if (level <= 1) return true
    const prevLevel = progress.get(level - 1)
    return prevLevel?.completed === true
  }

  /**
   * Get the highest unlocked level.
   */
  static getHighestUnlockedLevel(progress: Map<number, LevelProgress>): number {
    let highest = 1
    for (let i = 1; i <= 100; i++) {
      if (this.isLevelUnlocked(i, progress)) {
        highest = i
      } else {
        break
      }
    }
    return highest
  }

  /**
   * Get the next level after current.
   * Returns null if at max level.
   */
  static getNextLevel(currentLevel: number): number | null {
    if (currentLevel >= 100) return null
    return currentLevel + 1
  }

  /**
   * Load the current level from LocalStorage.
   */
  static loadCurrentLevel(): number {
    if (typeof localStorage === 'undefined') {
      return 1
    }

    try {
      const stored = localStorage.getItem(this.CURRENT_LEVEL_KEY)
      if (stored) {
        const level = parseInt(stored)
        if (level >= 1 && level <= 100) return level
      }
    } catch {
      // Silently handle
    }

    return 1
  }

  /**
   * Save the current level to LocalStorage.
   */
  static saveCurrentLevel(level: number): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.setItem(this.CURRENT_LEVEL_KEY, level.toString())
    } catch {
      // Silently handle
    }
  }

  /**
   * Reset all progress (for testing/debugging).
   */
  static resetProgress(): void {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.CURRENT_LEVEL_KEY)
    } catch {
      // Silently handle
    }
  }
}
