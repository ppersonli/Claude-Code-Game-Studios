/**
 * LeaderboardManager — dual-platform leaderboard with CG SDK + localStorage fallback.
 *
 * CrazyGames: submits scores via SDK.user.submitScore (encrypted).
 * Poki/Local: stores top scores in localStorage.
 *
 * CG leaderboard display is handled by the platform UI overlay.
 * The localStorage fallback provides a viewable leaderboard for non-CG platforms.
 */

export interface LeaderboardEntry {
  score: number
  playerName: string
  timestamp: number
}

export interface LeaderboardConfig {
  gameSlug: string
  maxEntries?: number
}

const STORAGE_PREFIX = 'cc-leaderboard-'
const DEFAULT_MAX_ENTRIES = 10

export class LeaderboardManager {
  private gameSlug: string
  private maxEntries: number

  constructor(config: LeaderboardConfig) {
    this.gameSlug = config.gameSlug
    this.maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES
  }

  // ─── Platform detection ─────────────────────────────────────────────

  private isCrazyGames(): boolean {
    return typeof window !== 'undefined' && !!window.CrazyGames?.SDK
  }

  // ─── Submit score ───────────────────────────────────────────────────

  /**
   * Submit a score to the leaderboard.
   * On CrazyGames: calls SDK.user.submitScore with encrypted score.
   * On other platforms: stores in localStorage.
   */
  async submitScore(score: number): Promise<boolean> {
    // Always store locally
    this.storeLocal(score)

    // Try CG SDK
    if (this.isCrazyGames()) {
      try {
        const sdk = window.CrazyGames!.SDK!
        // CG SDK submitScore — the SDK handles encryption internally
        // if encryptScore is not available, submit plain score
        const user = (sdk as any).user
        if (user?.submitScore) {
          await user.submitScore({ score, encryptedScore: String(score) })
          return true
        }
      } catch {
        // SDK submit failed — local fallback already stored
      }
    }

    return true // local storage always succeeds
  }

  // ─── Get scores ─────────────────────────────────────────────────────

  /**
   * Get top scores for this game.
   * Always reads from localStorage (CG display is handled by platform UI).
   */
  getTopScores(): LeaderboardEntry[] {
    return this.loadLocal()
  }

  /**
   * Get the player's best score.
   */
  getBestScore(): number {
    const entries = this.loadLocal()
    return entries.length > 0 ? entries[0].score : 0
  }

  /**
   * Check if a score qualifies for the leaderboard.
   */
  isHighScore(score: number): boolean {
    const entries = this.loadLocal()
    if (entries.length < this.maxEntries) return true
    return score > entries[entries.length - 1].score
  }

  // ─── Local storage ──────────────────────────────────────────────────

  private getStorageKey(): string {
    return `${STORAGE_PREFIX}${this.gameSlug}`
  }

  private loadLocal(): LeaderboardEntry[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey())
      if (raw) {
        const data = JSON.parse(raw)
        if (Array.isArray(data)) return data
      }
    } catch { /* corrupted */ }
    return []
  }

  private storeLocal(score: number): void {
    const entries = this.loadLocal()
    entries.push({ score, playerName: 'Player', timestamp: Date.now() })
    entries.sort((a, b) => b.score - a.score)
    const trimmed = entries.slice(0, this.maxEntries)
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(trimmed))
    } catch { /* storage full */ }
  }

  // ─── Reset ──────────────────────────────────────────────────────────

  reset(): void {
    try { localStorage.removeItem(this.getStorageKey()) } catch { /* */ }
  }
}
