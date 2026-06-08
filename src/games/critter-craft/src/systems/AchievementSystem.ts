import { Achievement, ACHIEVEMENTS } from '../data/achievements';

export interface AchievementProgress {
  id: string;
  name: string;
  current: number;
  target: number;
  percentage: number;
}

export interface CheckContext {
  mergeCount?: number;
  productsSold?: number;
  unlockedAnimals?: number;
  hasMaxUpgrade?: boolean;
  allProductsCollected?: boolean;
}

export class AchievementSystem {
  private unlockedIds: Set<string>;
  private mergeCount: number = 0;
  private productsSold: number = 0;

  constructor() {
    this.unlockedIds = new Set();
  }

  /**
   * Record a merge event
   */
  recordMerge(): void {
    this.mergeCount++;
  }

  /**
   * Record a product sale
   */
  recordSale(): void {
    this.productsSold++;
  }

  /**
   * Get total merge count
   */
  getMergeCount(): number {
    return this.mergeCount;
  }

  /**
   * Get total products sold
   */
  getProductsSold(): number {
    return this.productsSold;
  }

  /**
   * Set merge count (for loading from save)
   */
  setMergeCount(count: number): void {
    this.mergeCount = count;
  }

  /**
   * Set products sold (for loading from save)
   */
  setProductsSold(count: number): void {
    this.productsSold = count;
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
   * Get progress toward a specific achievement
   */
  getProgress(id: string, context: CheckContext): AchievementProgress {
    const achievement = this.getAchievement(id);
    const { current, target } = this.evaluateProgress(id, context);
    const percentage = this.unlockedIds.has(id) ? 100 : Math.min(100, target > 0 ? (current / target) * 100 : 0);
    return {
      id,
      name: achievement?.name ?? id,
      current: Math.min(current, target),
      target,
      percentage,
    };
  }

  /**
   * Get progress for all achievements
   */
  getAllProgress(context: CheckContext): AchievementProgress[] {
    return ACHIEVEMENTS.map(a => this.getProgress(a.id, context));
  }

  /**
   * Evaluate current progress value and target for an achievement
   */
  private evaluateProgress(id: string, context: CheckContext): { current: number; target: number } {
    switch (id) {
      case 'first_merge':
        return { current: context.mergeCount ?? 0, target: 1 };
      case 'sell_10':
        return { current: context.productsSold ?? 0, target: 10 };
      case 'unlock_3_animals':
        return { current: context.unlockedAnimals ?? 0, target: 3 };
      case 'merge_100':
        return { current: context.mergeCount ?? 0, target: 100 };
      case 'max_upgrade':
        return { current: context.hasMaxUpgrade ? 1 : 0, target: 1 };
      case 'collect_all':
        return { current: context.allProductsCollected ? 1 : 0, target: 1 };
      default:
        return { current: 0, target: 1 };
    }
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
