/**
 * Tube - represents a single tube in the sorting game.
 * A tube holds a stack of color layers (bottom to top).
 * Maximum capacity is configurable (default 4).
 */
export class Tube {
  private layers: number[]
  readonly maxCapacity: number

  constructor(maxCapacity: number = 4) {
    this.layers = []
    this.maxCapacity = maxCapacity
  }

  /**
   * Get the current layers in the tube (bottom to top order).
   */
  getLayers(): readonly number[] {
    return [...this.layers]
  }

  /**
   * Get the number of layers currently in the tube.
   */
  get size(): number {
    return this.layers.length
  }

  /**
   * Check if the tube is empty.
   */
  isEmpty(): boolean {
    return this.layers.length === 0
  }

  /**
   * Check if the tube is full.
   */
  isFull(): boolean {
    return this.layers.length >= this.maxCapacity
  }

  /**
   * Get the top color ID without removing it.
   * Returns undefined if the tube is empty.
   */
  peekTop(): number | undefined {
    return this.layers.length > 0 ? this.layers[this.layers.length - 1] : undefined
  }

  /**
   * Get the bottom color ID.
   * Returns undefined if the tube is empty.
   */
  peekBottom(): number | undefined {
    return this.layers.length > 0 ? this.layers[0] : undefined
  }

  /**
   * Push a color onto the top of the tube.
   * Returns true if successful, false if tube is full.
   */
  push(colorId: number): boolean {
    if (this.isFull()) {
      return false
    }
    this.layers.push(colorId)
    return true
  }

  /**
   * Pop (remove and return) the top color from the tube.
   * Returns undefined if the tube is empty.
   */
  pop(): number | undefined {
    return this.layers.pop()
  }

  /**
   * Check if the tube is sorted (all same color and full, or empty).
   * A tube is sorted if it's empty, or all layers are the same color AND the tube is full.
   */
  isSorted(): boolean {
    if (this.layers.length === 0) return true
    if (this.layers.length !== this.maxCapacity) return false
    return this.layers.every(layer => layer === this.layers[0])
  }

  /**
   * Get the count of consecutive matching top layers (for multi-pour).
   * Returns how many layers from the top have the same color.
   */
  getTopColorCount(): number {
    if (this.layers.length === 0) return 0
    const topColor = this.layers[this.layers.length - 1]
    let count = 0
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (this.layers[i] === topColor) {
        count++
      } else {
        break
      }
    }
    return count
  }

  /**
   * Clear all layers from the tube.
   */
  clear(): void {
    this.layers = []
  }

  /**
   * Set layers directly (for testing and level loading).
   */
  setLayers(layers: number[]): void {
    this.layers = [...layers]
  }
}
