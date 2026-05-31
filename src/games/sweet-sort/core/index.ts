export { GAME_CANDY_COLORS, COLOR_NAMES, COLOR_VALUES, getColorByIndex, getColorHex } from './Color'
export type { CandyColor } from './Color'

export {
  createRNG,
  getLevelConfig,
  calculateOptimalMoves,
  createSolvableLevel,
  generateLevel,
  getStarRating
} from './LevelGenerator'
export type { LevelConfig, LevelData } from './LevelGenerator'

export {
  isValidMove,
  executeMove,
  checkCompletion,
  getDefaultSave,
  updateLevelResult
} from './GameState'
export type { SaveData, GameMove } from './GameState'
