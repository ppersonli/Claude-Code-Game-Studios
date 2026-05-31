import type { LevelConfig } from './GameState'

/**
 * LevelGenerator - generates valid level configurations.
 * Ensures levels are always solvable by starting from sorted state and shuffling.
 */
export class LevelGenerator {
  /**
   * Generate a random solvable level.
   *
   * @param colorCount - number of unique colors (1-12)
   * @param tubeCapacity - max layers per tube (default 4)
   * @param emptyTubeCount - number of extra empty tubes (default 2)
   * @returns LevelConfig for a solvable level
   */
  static generate(
    colorCount: number,
    tubeCapacity: number = 4,
    emptyTubeCount: number = 2
  ): LevelConfig {
    if (colorCount < 1 || colorCount > 12) {
      throw new Error('Color count must be between 1 and 12')
    }
    if (tubeCapacity < 2 || tubeCapacity > 6) {
      throw new Error('Tube capacity must be between 2 and 6')
    }

    const filledTubeCount = colorCount
    const totalTubes = filledTubeCount + emptyTubeCount

    // Create sorted tubes first
    const initialTubes: number[][] = []
    for (let i = 0; i < filledTubeCount; i++) {
      const tube: number[] = []
      for (let j = 0; j < tubeCapacity; j++) {
        tube.push(i)
      }
      initialTubes.push(tube)
    }

    // Add empty tubes
    for (let i = 0; i < emptyTubeCount; i++) {
      initialTubes.push([])
    }

    // Shuffle the tubes to randomize the puzzle
    const shuffled = LevelGenerator.shuffleArray([...initialTubes])

    return {
      tubeCount: totalTubes,
      tubeCapacity,
      initialTubes: shuffled,
      colorCount,
    }
  }

  /**
   * Create a level from a specific configuration.
   */
  static create(
    tubeCount: number,
    tubeCapacity: number,
    initialTubes: number[][],
    colorCount: number
  ): LevelConfig {
    return {
      tubeCount,
      tubeCapacity,
      initialTubes,
      colorCount,
    }
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm.
   */
  static shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  /**
   * Validate a level config.
   * Returns true if valid, throws if not.
   */
  static validate(config: LevelConfig): boolean {
    if (config.tubeCount < 3) {
      throw new Error('Need at least 3 tubes')
    }
    if (config.tubeCapacity < 2) {
      throw new Error('Tube capacity must be at least 2')
    }
    if (config.colorCount < 1 || config.colorCount > 12) {
      throw new Error('Color count must be between 1 and 12')
    }
    if (config.initialTubes.length !== config.tubeCount) {
      throw new Error('initialTubes length must match tubeCount')
    }
    for (const tube of config.initialTubes) {
      if (tube.length > config.tubeCapacity) {
        throw new Error('Tube exceeds max capacity')
      }
    }
    return true
  }
}
