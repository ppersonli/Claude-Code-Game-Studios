export interface GameState {
  coins: number;
  upgradeLevels?: Record<string, number>;
  animalStates?: Record<string, { level: number; unlocked: boolean }>;
  productInventory?: Record<string, number>;
  gridSize?: number;
  productsSold?: number;
  mergeCount?: number;
  lastSaveTime?: number;
}

interface SaveData extends GameState {
  lastSaveTime: number;
}

const SAVE_KEY = 'critter-craft-save';

export class SaveSystem {
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Save game state to localStorage
   */
  save(state: GameState): void {
    const saveData: SaveData = {
      ...state,
      lastSaveTime: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  }

  /**
   * Load game state from localStorage
   */
  load(): GameState | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      // Basic validation
      if (typeof parsed !== 'object' || parsed === null) return null;
      return parsed as GameState;
    } catch {
      return null;
    }
  }

  /**
   * Start auto-save timer
   */
  startAutoSave(saveFn: () => void, intervalMs: number): void {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(saveFn, intervalMs);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Clear saved data
   */
  clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
