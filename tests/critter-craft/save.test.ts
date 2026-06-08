import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../../src/games/critter-craft/src/systems/SaveSystem';

describe('SaveSystem', () => {
  let saveSystem: SaveSystem;

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; }),
      get length() { return Object.keys(store).length; },
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
    vi.clearAllMocks();
    saveSystem = new SaveSystem();
  });

  describe('Save Data Structure', () => {
    it('should save game state with all required fields', () => {
      const state = {
        coins: 500,
        upgradeLevels: { animal_slot: 1, merge_grid: 0 },
        animalStates: { cat: { level: 2, unlocked: true }, dog: { level: 1, unlocked: true } },
        productInventory: { yarn_scarf: 3 },
        gridSize: 4,
        productsSold: 15,
        mergeCount: 50,
      };

      saveSystem.save(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'critter-craft-save',
        expect.any(String)
      );

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.coins).toBe(500);
      expect(savedData.upgradeLevels).toEqual({ animal_slot: 1, merge_grid: 0 });
      expect(savedData.animalStates).toEqual({ cat: { level: 2, unlocked: true }, dog: { level: 1, unlocked: true } });
      expect(savedData.productInventory).toEqual({ yarn_scarf: 3 });
      expect(savedData.gridSize).toBe(4);
      expect(savedData.productsSold).toBe(15);
      expect(savedData.mergeCount).toBe(50);
      expect(savedData.lastSaveTime).toBeTypeOf('number');
    });

    it('should save with a timestamp', () => {
      const before = Date.now();
      saveSystem.save({ coins: 0 });
      const after = Date.now();

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.lastSaveTime).toBeGreaterThanOrEqual(before);
      expect(savedData.lastSaveTime).toBeLessThanOrEqual(after);
    });
  });

  describe('Load Data', () => {
    it('should load saved game state', () => {
      const savedState = {
        coins: 1000,
        upgradeLevels: { production_speed: 2 },
        animalStates: { cat: { level: 3, unlocked: true } },
        productInventory: { wood_toy: 5 },
        gridSize: 5,
        productsSold: 30,
        mergeCount: 100,
        lastSaveTime: Date.now() - 60000,
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const loaded = saveSystem.load();
      expect(loaded).not.toBeNull();
      expect(loaded!.coins).toBe(1000);
      expect(loaded!.upgradeLevels).toEqual({ production_speed: 2 });
      expect(loaded!.gridSize).toBe(5);
    });

    it('should return null when no save data exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const loaded = saveSystem.load();
      expect(loaded).toBeNull();
    });

    it('should return null for corrupted save data', () => {
      localStorageMock.getItem.mockReturnValue('not-valid-json');

      const loaded = saveSystem.load();
      expect(loaded).toBeNull();
    });
  });

  describe('Auto Save', () => {
    it('should start auto-save timer', () => {
      vi.useFakeTimers();
      const saveFn = vi.fn();
      saveSystem.startAutoSave(saveFn, 30000);

      // Should not save immediately
      expect(saveFn).not.toHaveBeenCalled();

      // Should save after 30 seconds
      vi.advanceTimersByTime(30000);
      expect(saveFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should stop auto-save timer', () => {
      vi.useFakeTimers();
      const saveFn = vi.fn();
      saveSystem.startAutoSave(saveFn, 30000);

      saveSystem.stopAutoSave();
      vi.advanceTimersByTime(60000);
      expect(saveFn).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Clear Save', () => {
    it('should clear saved data', () => {
      saveSystem.clearSave();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('critter-craft-save');
    });
  });
});
