import type { Theme, StyleTag } from '../data/types'
import { THEMES } from '../data/themes'

export class ThemeSystem {
  private themes: Theme[] = [...THEMES]
  private weeklyTheme: Theme | undefined

  getTheme(id: string): Theme | undefined {
    return this.themes.find(t => t.id === id)
  }

  getAvailableThemes(playerLevel: number): Theme[] {
    return this.themes.filter(t => !t.isWeekly && t.unlockLevel <= playerLevel)
  }

  getWeeklyTheme(): Theme | undefined {
    return this.weeklyTheme
  }

  setWeeklyTheme(theme: Theme): void {
    this.weeklyTheme = theme
    // Add to themes list if not already present
    if (!this.themes.some(t => t.id === theme.id)) {
      this.themes.push(theme)
    }
  }

  isThemeUnlocked(id: string, playerLevel: number): boolean {
    const theme = this.getTheme(id)
    if (!theme) return false
    return theme.unlockLevel <= playerLevel
  }

  getStyleHint(id: string): StyleTag[] {
    const theme = this.getTheme(id)
    return theme ? [...theme.requiredStyles] : []
  }

  calculateThemeMatch(outfitStyles: StyleTag[], themeId: string): number {
    if (outfitStyles.length === 0) return 0
    const theme = this.getTheme(themeId)
    if (!theme) return 0

    const required = theme.requiredStyles
    let matchCount = 0
    for (const style of outfitStyles) {
      if (required.includes(style)) {
        matchCount++
      }
    }
    return (matchCount / outfitStyles.length) * 100
  }

  getThemesByScene(scene: string): Theme[] {
    return this.themes.filter(t => t.scene === scene)
  }

  getRandomTheme(playerLevel: number): Theme {
    const available = this.getAvailableThemes(playerLevel)
    return available[Math.floor(Math.random() * available.length)]
  }
}
