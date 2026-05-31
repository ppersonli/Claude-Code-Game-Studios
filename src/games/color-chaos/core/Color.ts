/**
 * Color - represents a color in the sorting game.
 * Each color has a unique ID, a human-readable name, and a hex color value.
 */
export interface Color {
  id: number
  name: string
  hex: string
}

/**
 * Predefined colors for the game.
 * Supports up to 12 colors as per the game plan.
 */
export const GAME_COLORS: Color[] = [
  { id: 0, name: 'red', hex: '#FF4444' },
  { id: 1, name: 'blue', hex: '#4488FF' },
  { id: 2, name: 'green', hex: '#44CC44' },
  { id: 3, name: 'yellow', hex: '#FFDD44' },
  { id: 4, name: 'purple', hex: '#AA44FF' },
  { id: 5, name: 'orange', hex: '#FF8844' },
  { id: 6, name: 'cyan', hex: '#44DDFF' },
  { id: 7, name: 'pink', hex: '#FF88CC' },
  { id: 8, name: 'brown', hex: '#AA6633' },
  { id: 9, name: 'teal', hex: '#44AAAA' },
  { id: 10, name: 'lime', hex: '#88DD44' },
  { id: 11, name: 'indigo', hex: '#6644CC' },
]

/**
 * Get a color by its ID.
 * @throws Error if the color ID is not found.
 */
export function getColorById(id: number): Color {
  const color = GAME_COLORS.find(c => c.id === id)
  if (!color) {
    throw new Error(`Color with id ${id} not found`)
  }
  return color
}
