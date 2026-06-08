import type { Clothing, Theme, ScoreBreakdown, Grade } from '../data/types'
import { SCORING_CONFIG, GRADE_THRESHOLDS, RUNWAY_ACTIONS } from '../data/scoring'

const TOTAL_CATEGORIES = 5 // top, bottom, shoes, accessory, hair

export class ScoringSystem {
  calculateStyleMatch(clothing: Clothing[], theme: Theme): number {
    if (clothing.length === 0) return 0
    const required = theme.requiredStyles
    let matchCount = 0
    for (const item of clothing) {
      if (item.style.some(s => required.includes(s))) {
        matchCount++
      }
    }
    return (matchCount / clothing.length) * 100
  }

  calculateCoordination(clothing: Clothing[]): number {
    if (clothing.length === 0) return 0
    if (clothing.length === 1) return 100

    const colorScore = this.calculateColorHarmony(clothing.map(c => c.color))
    const styleScore = this.calculateStyleConsistency(clothing)
    // Color matters more than style consistency; both must be decent for high score
    const combined = Math.sqrt(colorScore) * styleScore
    return Math.round(Math.min(1, combined) * 100)
  }

  calculatePerformance(actions: readonly string[]): number {
    const base = 40
    if (actions.length === 0) return base

    const bonusMap = new Map(RUNWAY_ACTIONS.map(a => [a.id, a.bonusScore]))
    const uniqueActions = new Set(actions).size
    const totalBonus = actions.reduce((sum, action) => sum + (bonusMap.get(action) ?? 5), 0)
    const diversityBonus = uniqueActions * 5

    return Math.min(100, base + totalBonus + diversityBonus)
  }

  calculateCreativity(clothing: Clothing[]): number {
    if (clothing.length === 0) return 0

    const rarityScores: Record<string, number> = { common: 0, rare: 40, epic: 60, legendary: 80 }
    const rarityTotal = clothing.reduce((sum, item) => sum + (rarityScores[item.rarity] ?? 0), 0)
    const rarityAvg = rarityTotal / clothing.length

    const allStyles = clothing.flatMap(c => c.style)
    const uniqueStyles = new Set(allStyles).size
    const diversityBonus = Math.min(40, uniqueStyles * 8)

    return Math.min(100, Math.round(rarityAvg + diversityBonus))
  }

  calculateTotalScore(
    styleMatch: number,
    coordination: number,
    performance: number,
    creativity: number,
  ): number {
    return Math.round(
      styleMatch * SCORING_CONFIG.styleMatchWeight +
      coordination * SCORING_CONFIG.coordinationWeight +
      performance * SCORING_CONFIG.performanceWeight +
      creativity * SCORING_CONFIG.creativityWeight,
    )
  }

  getGrade(score: number): { grade: Grade; rewardMultiplier: number } {
    for (const threshold of GRADE_THRESHOLDS) {
      if (score >= threshold.minScore) {
        return { grade: threshold.grade, rewardMultiplier: threshold.rewardMultiplier }
      }
    }
    return { grade: 'D', rewardMultiplier: 0.5 }
  }

  evaluate(outfit: Clothing[], theme: Theme, actions: string[]): ScoreBreakdown {
    const styleMatch = this.calculateStyleMatch(outfit, theme)
    const coordination = this.calculateCoordination(outfit)
    const performance = this.calculatePerformance(actions)
    const creativity = this.calculateCreativity(outfit)
    const total = this.calculateTotalScore(styleMatch, coordination, performance, creativity)
    const { grade, rewardMultiplier } = this.getGrade(total)

    return { styleMatch, coordination, performance, creativity, total, grade, rewardMultiplier }
  }

  private calculateColorHarmony(colors: string[]): number {
    if (colors.length <= 1) return 1
    const rgbs = colors.map(c => this.hexToRgb(c))
    let totalSimilarity = 0
    let pairs = 0
    for (let i = 0; i < rgbs.length; i++) {
      for (let j = i + 1; j < rgbs.length; j++) {
        const dist = Math.sqrt(
          (rgbs[i].r - rgbs[j].r) ** 2 +
          (rgbs[i].g - rgbs[j].g) ** 2 +
          (rgbs[i].b - rgbs[j].b) ** 2,
        )
        totalSimilarity += 1 - dist / 441.67 // max dist = sqrt(255^2 * 3)
        pairs++
      }
    }
    return pairs > 0 ? totalSimilarity / pairs : 0
  }

  private calculateStyleConsistency(clothing: Clothing[]): number {
    if (clothing.length <= 1) return 1
    const styleCounts = new Map<string, number>()
    for (const item of clothing) {
      for (const s of item.style) {
        styleCounts.set(s, (styleCounts.get(s) ?? 0) + 1)
      }
    }
    const maxItemsForAStyle = Math.max(...styleCounts.values())
    return maxItemsForAStyle / clothing.length
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 }
  }
}
