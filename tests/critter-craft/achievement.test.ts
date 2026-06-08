import { describe, it, expect, beforeEach } from 'vitest';
import { AchievementSystem } from '../../src/games/critter-craft/src/systems/AchievementSystem';

describe('AchievementSystem', () => {
  let achievementSystem: AchievementSystem;

  beforeEach(() => {
    achievementSystem = new AchievementSystem();
  });

  describe('Achievement Data', () => {
    it('should have all 6 achievements defined', () => {
      const achievements = achievementSystem.getAllAchievements();
      expect(achievements).toHaveLength(6);
    });

    it('should have first_merge achievement', () => {
      const achievement = achievementSystem.getAchievement('first_merge');
      expect(achievement).toBeDefined();
      expect(achievement!.name).toBe('First Merge');
      expect(achievement!.reward).toBe(100);
    });

    it('should have sell_10 achievement', () => {
      const achievement = achievementSystem.getAchievement('sell_10');
      expect(achievement).toBeDefined();
      expect(achievement!.reward).toBe(200);
    });
  });

  describe('Achievement Unlocking', () => {
    it('should unlock first_merge when merge count >= 1', () => {
      const unlocked = achievementSystem.checkAndUnlock('first_merge', { mergeCount: 1 });
      expect(unlocked).toBe(true);
      expect(achievementSystem.isUnlocked('first_merge')).toBe(true);
    });

    it('should not unlock first_merge when merge count < 1', () => {
      const unlocked = achievementSystem.checkAndUnlock('first_merge', { mergeCount: 0 });
      expect(unlocked).toBe(false);
      expect(achievementSystem.isUnlocked('first_merge')).toBe(false);
    });

    it('should unlock sell_10 when products sold >= 10', () => {
      const unlocked = achievementSystem.checkAndUnlock('sell_10', { productsSold: 10 });
      expect(unlocked).toBe(true);
      expect(achievementSystem.isUnlocked('sell_10')).toBe(true);
    });

    it('should not unlock sell_10 when products sold < 10', () => {
      const unlocked = achievementSystem.checkAndUnlock('sell_10', { productsSold: 9 });
      expect(unlocked).toBe(false);
    });

    it('should unlock unlock_3_animals when unlocked animals >= 3', () => {
      const unlocked = achievementSystem.checkAndUnlock('unlock_3_animals', { unlockedAnimals: 3 });
      expect(unlocked).toBe(true);
    });

    it('should unlock merge_100 when merge count >= 100', () => {
      const unlocked = achievementSystem.checkAndUnlock('merge_100', { mergeCount: 100 });
      expect(unlocked).toBe(true);
    });

    it('should unlock max_upgrade when any upgrade is at max level', () => {
      const unlocked = achievementSystem.checkAndUnlock('max_upgrade', { hasMaxUpgrade: true });
      expect(unlocked).toBe(true);
    });

    it('should unlock collect_all when all products collected', () => {
      const unlocked = achievementSystem.checkAndUnlock('collect_all', { allProductsCollected: true });
      expect(unlocked).toBe(true);
    });
  });

  describe('Achievement Rewards', () => {
    it('should return reward amount for an achievement', () => {
      const reward = achievementSystem.getReward('first_merge');
      expect(reward).toBe(100);
    });

    it('should return 0 for unknown achievement', () => {
      const reward = achievementSystem.getReward('unknown');
      expect(reward).toBe(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track which achievements are unlocked', () => {
      achievementSystem.checkAndUnlock('first_merge', { mergeCount: 5 });
      achievementSystem.checkAndUnlock('sell_10', { productsSold: 15 });

      const unlocked = achievementSystem.getUnlockedAchievements();
      expect(unlocked).toHaveLength(2);
      expect(unlocked.map(a => a.id)).toContain('first_merge');
      expect(unlocked.map(a => a.id)).toContain('sell_10');
    });

    it('should not unlock same achievement twice', () => {
      achievementSystem.checkAndUnlock('first_merge', { mergeCount: 5 });
      achievementSystem.checkAndUnlock('first_merge', { mergeCount: 10 });

      const unlocked = achievementSystem.getUnlockedAchievements();
      expect(unlocked).toHaveLength(1);
    });

    it('should return locked achievements', () => {
      achievementSystem.checkAndUnlock('first_merge', { mergeCount: 5 });

      const locked = achievementSystem.getLockedAchievements();
      expect(locked).toHaveLength(5);
      expect(locked.map(a => a.id)).not.toContain('first_merge');
    });
  });

  describe('Progress Percentage', () => {
    it('should return progress for sell_10 with partial completion', () => {
      const progress = achievementSystem.getProgress('sell_10', { productsSold: 5 });
      expect(progress.current).toBe(5);
      expect(progress.target).toBe(10);
      expect(progress.percentage).toBe(50);
    });

    it('should return 100% for completed achievement', () => {
      achievementSystem.checkAndUnlock('sell_10', { productsSold: 15 });
      const progress = achievementSystem.getProgress('sell_10', { productsSold: 15 });
      expect(progress.percentage).toBe(100);
    });

    it('should cap progress at 100%', () => {
      const progress = achievementSystem.getProgress('sell_10', { productsSold: 50 });
      expect(progress.percentage).toBe(100);
    });

    it('should return 0% when no progress', () => {
      const progress = achievementSystem.getProgress('merge_100', { mergeCount: 0 });
      expect(progress.percentage).toBe(0);
    });

    it('should track unlock_3_animals progress', () => {
      const progress = achievementSystem.getProgress('unlock_3_animals', { unlockedAnimals: 2 });
      expect(progress.current).toBe(2);
      expect(progress.target).toBe(3);
      expect(progress.percentage).toBeCloseTo(66.67, 1);
    });

    it('should return 0/1 for binary achievements like max_upgrade', () => {
      const progress = achievementSystem.getProgress('max_upgrade', { hasMaxUpgrade: false });
      expect(progress.current).toBe(0);
      expect(progress.target).toBe(1);
      expect(progress.percentage).toBe(0);
    });

    it('should return 100 for binary achievements when condition met', () => {
      const progress = achievementSystem.getProgress('max_upgrade', { hasMaxUpgrade: true });
      expect(progress.current).toBe(1);
      expect(progress.percentage).toBe(100);
    });

    it('should return all achievement progress at once', () => {
      const allProgress = achievementSystem.getAllProgress({
        mergeCount: 50,
        productsSold: 3,
        unlockedAnimals: 1,
        hasMaxUpgrade: false,
        allProductsCollected: false,
      });

      expect(allProgress).toHaveLength(6);
      const sellProgress = allProgress.find(p => p.id === 'sell_10');
      expect(sellProgress!.percentage).toBe(30);
      const mergeProgress = allProgress.find(p => p.id === 'merge_100');
      expect(mergeProgress!.percentage).toBe(50);
    });
  });

  describe('Batch Check', () => {
    it('should check all achievements at once', () => {
      const newlyUnlocked = achievementSystem.checkAll({
        mergeCount: 1,
        productsSold: 10,
        unlockedAnimals: 2,
        hasMaxUpgrade: false,
        allProductsCollected: false,
      });

      expect(newlyUnlocked).toHaveLength(2);
      expect(newlyUnlocked.map(a => a.id)).toContain('first_merge');
      expect(newlyUnlocked.map(a => a.id)).toContain('sell_10');
    });
  });
});
