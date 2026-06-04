import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createInitialState,
  calcOfflineIncome,
  serializeState,
  deserializeState,
  calcOfflineTime,
  GameState,
} from '../src/games/space-factory-idle/logic/game-state';

describe('game state', () => {
  describe('createInitialState', () => {
    it('creates a fresh state with sensible defaults', () => {
      const state = createInitialState();
      expect(state.coins).toBe(0);
      expect(state.stardust).toBe(0);
      expect(state.factoryLevel).toBe(1);
      expect(state.workers).toBe(1);
      expect(state.workerSpeed).toBe(1);
      expect(state.unlockedRecipes).toContain('electronic-components');
      expect(state.unlockedPlanets).toContain('earth');
      expect(state.prestigeCount).toBe(0);
    });

    it('each call returns a new object', () => {
      const a = createInitialState();
      const b = createInitialState();
      a.coins = 100;
      expect(b.coins).toBe(0);
    });
  });

  describe('calcOfflineIncome', () => {
    it('returns 0 for 0 seconds offline', () => {
      expect(calcOfflineIncome(100, 0)).toBe(0);
    });

    it('calculates income at 50% efficiency', () => {
      // 60 seconds = 1 minute
      // income = 100 × 1 × 0.5 × inflation(1min)
      // inflation(1) = 1 / (1 + 0.005) ≈ 0.995
      const result = calcOfflineIncome(100, 60);
      expect(result).toBeCloseTo(100 * 1 * 0.5 * (1 / 1.005), 1);
    });

    it('caps at 8 hours (28800 seconds)', () => {
      const result1 = calcOfflineIncome(100, 28800);
      const result2 = calcOfflineIncome(100, 999999);
      expect(result1).toBeCloseTo(result2, 0);
    });
  });

  describe('serializeState / deserializeState', () => {
    it('roundtrips a state', () => {
      const original = createInitialState();
      original.coins = 12345;
      original.stardust = 42;
      original.unlockedRecipes = ['electronic-components', 'helium-battery'];

      const json = serializeState(original);
      const restored = deserializeState(json);

      expect(restored.coins).toBe(12345);
      expect(restored.stardust).toBe(42);
      expect(restored.unlockedRecipes).toEqual([
        'electronic-components',
        'helium-battery',
      ]);
    });

    it('returns initial state for null input', () => {
      const state = deserializeState(null);
      expect(state.coins).toBe(0);
      expect(state.unlockedPlanets).toContain('earth');
    });

    it('returns initial state for corrupt JSON', () => {
      const state = deserializeState('not valid json{{{');
      expect(state.coins).toBe(0);
    });

    it('merges with defaults for partial saves', () => {
      // Old save might not have totalPlayTime
      const partial = JSON.stringify({ coins: 500, stardust: 10 });
      const state = deserializeState(partial);
      expect(state.coins).toBe(500);
      expect(state.totalPlayTime).toBe(0); // default
      expect(state.unlockedPlanets).toContain('earth'); // default
    });
  });

  describe('calcOfflineTime', () => {
    it('returns ~0 for current timestamp', () => {
      expect(calcOfflineTime(Date.now())).toBeLessThan(0.1);
    });

    it('returns positive seconds for past timestamp', () => {
      const oneMinuteAgo = Date.now() - 60_000;
      const elapsed = calcOfflineTime(oneMinuteAgo);
      expect(elapsed).toBeGreaterThanOrEqual(59);
      expect(elapsed).toBeLessThan(62);
    });

    it('never returns negative', () => {
      const future = Date.now() + 60_000;
      expect(calcOfflineTime(future)).toBe(0);
    });
  });
});
