import { Achievement, ACHIEVEMENTS } from '../data/achievements';

export interface CheckContext {
  mergeCount?: number;
  productsSold?: number;
  unlockedAnimals?: number;
  hasMaxUpgrade?: boolean;
  allProductsCollected?: boolean;
}

export class AchievementSystem {
  private unlockedIds: Set<string>;

  constructor() {
    this.unlockedIds = new Set();
  }

  /**
   * Get achievement definition by ID
   */
  getAchievement(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
  }

  /**
   * Get all achievement definitions
   */
  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS;
  }

  /**
   * Check if an achievement is unlocked
   */
  isUnlocked(id: string): boolean {
    return this.unlockedIds.has(id);
  }

  /**
   * Get all unlocked achievements
   */
  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.unlockedIds.has(a.id));
  }

  /**
   * Get all locked achievements
   */
  getLockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => !this.unlockedIds.has(a.id));
  }

  /**
   * Get reward amount for an achievement
   */
  getReward(id: string): number {
    const achievement = this.getAchievement(id);
    return achievement?.reward ?? 0;
  }

  /**
   * Check and unlock a specific achievement
   */
  checkAndUnlock(id: string, context: CheckContext): boolean {
    if (this.unlockedIds.has(id)) return false;

    if (!this.evaluateCondition(id, context)) return false;

    this.unlockedIds.add(id);
    return true;
  }

  /**
   * Check all achievements at once, returns newly unlocked ones
   */
  checkAll(context: CheckContext): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (this.unlockedIds.has(achievement.id)) continue;

      if (this.evaluateCondition(achievement.id, context)) {
        this.unlockedIds.add(achievement.id);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Set unlocked state (for loading from save)
   */
  setUnlocked(id: string): void {
    this.unlockedIds.add(id);
  }

  /**
   * Get all unlocked IDs (for saving)
   */
  getUnlockedIds(): string[] {
    return Array.from(this.unlockedIds);
  }

  /**
   * Evaluate achievement condition
   */
  private evaluateCondition(id: string, context: CheckContext): boolean {
    switch (id) {
      case 'first_merge':
        return (context.mergeCount ?? 0) >= 1;
      case 'sell_10':
        return (context.productsSold ?? 0) >= 10;
      case 'unlock_3_animals':
        return (context.unlockedAnimals ?? 0) >= 3;
      case 'merge_100':
        return (context.mergeCount ?? 0) >= 100;
      case 'max_upgrade':
        return context.hasMaxUpgrade === true;
      case 'collect_all':
        return context.allProductsCollected === true;
      default:
        return false;
    }
  }
}
