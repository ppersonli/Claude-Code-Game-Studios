import { Tube } from './Tube'

/**
 * Move result - what happens when a player tries to move colors between tubes.
 */
export interface MoveResult {
  success: boolean
  layersMoved: number
  reason?: string
}

/**
 * Level configuration - defines the starting state of a level.
 */
export interface LevelConfig {
  /** Number of tubes in the level */
  tubeCount: number
  /** Max capacity per tube */
  tubeCapacity: number
  /** Initial layers for each tube (bottom to top). Empty tubes are [] */
  initialTubes: number[][]
  /** Total number of unique colors used */
  colorCount: number
}

/**
 * Game state - represents the current state of the game.
 * Pure data class with no rendering logic.
 */
export class GameState {
  tubes: Tube[]
  readonly tubeCapacity: number
  readonly colorCount: number
  moveCount: number
  private _isComplete: boolean

  constructor(config: LevelConfig) {
    this.tubeCapacity = config.tubeCapacity
    this.colorCount = config.colorCount
    this.moveCount = 0
    this._isComplete = false
    this.tubes = []

    for (let i = 0; i < config.tubeCount; i++) {
      const tube = new Tube(config.tubeCapacity)
      if (config.initialTubes[i]) {
        tube.setLayers(config.initialTubes[i])
      }
      this.tubes.push(tube)
    }

    // Check initial completion state
    this.checkCompletion()
  }

  /**
   * Get the number of tubes.
   */
  get tubeCount(): number {
    return this.tubes.length
  }

  /**
   * Check if the game is complete (all non-empty tubes are sorted).
   */
  get isComplete(): boolean {
    return this._isComplete
  }

  /**
   * Attempt to move layers from one tube to another.
   * Moves all consecutive matching top layers if possible.
   *
   * @param fromIndex - source tube index
   * @param toIndex - destination tube index
   * @returns MoveResult with details about the move
   */
  move(fromIndex: number, toIndex: number): MoveResult {
    // Validate indices
    if (fromIndex < 0 || fromIndex >= this.tubes.length) {
      return { success: false, layersMoved: 0, reason: 'Invalid source tube index' }
    }
    if (toIndex < 0 || toIndex >= this.tubes.length) {
      return { success: false, layersMoved: 0, reason: 'Invalid destination tube index' }
    }
    if (fromIndex === toIndex) {
      return { success: false, layersMoved: 0, reason: 'Cannot move to the same tube' }
    }

    const fromTube = this.tubes[fromIndex]
    const toTube = this.tubes[toIndex]

    // Check source is not empty
    if (fromTube.isEmpty()) {
      return { success: false, layersMoved: 0, reason: 'Source tube is empty' }
    }

    // Check destination is not full
    if (toTube.isFull()) {
      return { success: false, layersMoved: 0, reason: 'Destination tube is full' }
    }

    const topColor = fromTube.peekTop()!

    // Check if destination accepts this color (empty or matching top)
    if (!toTube.isEmpty() && toTube.peekTop() !== topColor) {
      return { success: false, layersMoved: 0, reason: 'Color mismatch' }
    }

    // Calculate how many layers to move (consecutive matching top layers)
    const colorCount = fromTube.getTopColorCount()
    const availableSpace = toTube.maxCapacity - toTube.size
    const layersToMove = Math.min(colorCount, availableSpace)

    // Perform the move
    for (let i = 0; i < layersToMove; i++) {
      const color = fromTube.pop()
      if (color !== undefined) {
        toTube.push(color)
      }
    }

    this.moveCount++

    // Check if game is complete
    this.checkCompletion()

    return { success: true, layersMoved: layersToMove }
  }

  /**
   * Check if the game is complete.
   * Game is complete when all non-empty tubes are sorted.
   */
  private checkCompletion(): void {
    for (const tube of this.tubes) {
      if (!tube.isEmpty() && !tube.isSorted()) {
        this._isComplete = false
        return
      }
    }
    this._isComplete = true
  }

  /**
   * Get a snapshot of the current state (for undo/history).
   */
  getStateSnapshot(): number[][] {
    return this.tubes.map(tube => [...tube.getLayers()])
  }

  /**
   * Restore state from a snapshot.
   */
  restoreState(snapshot: number[][]): void {
    for (let i = 0; i < this.tubes.length; i++) {
      this.tubes[i].setLayers(snapshot[i] || [])
    }
    this._isComplete = false
    this.checkCompletion()
  }

  /**
   * Get the number of sorted tubes.
   */
  getSortedTubeCount(): number {
    return this.tubes.filter(t => t.isSorted() && !t.isEmpty()).length
  }

  /**
   * Get the number of empty tubes.
   */
  getEmptyTubeCount(): number {
    return this.tubes.filter(t => t.isEmpty()).length
  }

  /**
   * Count total layers across all tubes.
   */
  getTotalLayers(): number {
    return this.tubes.reduce((sum, tube) => sum + tube.size, 0)
  }
}
