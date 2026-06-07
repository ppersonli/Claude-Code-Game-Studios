import type { GameState } from './game-state'
import { GAME_CONFIG, type CharacterId } from '../config'

export type CharacterUnlockCondition =
  | { type: 'default' }
  | { type: 'complete_levels'; target: number }
  | { type: 'collect_stars'; target: number }
  | { type: 'prestige'; target: number }

export interface CharacterPassiveEffect {
  type: 'none' | 'bounce_multiplier' | 'power_multiplier' | 'extra_stars' | 'phase_through_walls' | 'split_balls'
  value: number
}

/** Character unlock conditions */
const UNLOCK_CONDITIONS: Record<CharacterId, CharacterUnlockCondition> = {
  rookie: { type: 'default' },
  bouncy: { type: 'complete_levels', target: 5 },
  power: { type: 'complete_levels', target: 10 },
  lucky: { type: 'collect_stars', target: 50 },
  ghost: { type: 'prestige', target: 1 },
  splitter: { type: 'complete_levels', target: 25 },
}

/** Character passive effects */
const PASSIVE_EFFECTS: Record<CharacterId, CharacterPassiveEffect> = {
  rookie: { type: 'none', value: 0 },
  bouncy: { type: 'bounce_multiplier', value: 1.1 },
  power: { type: 'power_multiplier', value: 1.1 },
  lucky: { type: 'extra_stars', value: 1 },
  ghost: { type: 'phase_through_walls', value: 1 },
  splitter: { type: 'split_balls', value: 3 },
}

/**
 * Check if a character can be unlocked based on game state
 */
export function canUnlockCharacter(state: GameState, condition: CharacterUnlockCondition): boolean {
  switch (condition.type) {
    case 'default':
      return true
    case 'complete_levels':
      return state.completedLevels.length >= condition.target
    case 'collect_stars':
      return state.totalStars >= condition.target
    case 'prestige':
      return state.prestigeCount >= condition.target
    default:
      return false
  }
}

/**
 * Unlock a character (adds to unlocked list)
 */
export function unlockCharacter(state: GameState, characterId: CharacterId): GameState {
  if (state.unlockedCharacters.includes(characterId)) {
    return state
  }
  
  return {
    ...state,
    unlockedCharacters: [...state.unlockedCharacters, characterId],
  }
}

/**
 * Get passive effect for a character
 */
export function getCharacterPassiveEffect(characterId: CharacterId): CharacterPassiveEffect {
  return PASSIVE_EFFECTS[characterId] ?? { type: 'none', value: 0 }
}

/**
 * Get unlock condition for a character
 */
export function getCharacterUnlockCondition(characterId: CharacterId): CharacterUnlockCondition {
  return UNLOCK_CONDITIONS[characterId] ?? { type: 'default' }
}
