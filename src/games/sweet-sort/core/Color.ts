/** Candy color definitions and constants */

export interface CandyColor {
  name: string
  hex: number
  label: string
}

export const GAME_CANDY_COLORS: CandyColor[] = [
  { name: 'RED', hex: 0xFF6B6B, label: 'Red' },
  { name: 'BLUE', hex: 0x4ECDC4, label: 'Blue' },
  { name: 'GREEN', hex: 0x45B7D1, label: 'Green' },
  { name: 'YELLOW', hex: 0xFFA07A, label: 'Yellow' },
  { name: 'PURPLE', hex: 0xDDA0DD, label: 'Purple' },
  { name: 'ORANGE', hex: 0xFF8C42, label: 'Orange' },
  { name: 'PINK', hex: 0xFF85A1, label: 'Pink' },
  { name: 'TEAL', hex: 0x5F9EA0, label: 'Teal' },
]

export const COLOR_NAMES = GAME_CANDY_COLORS.map(c => c.name)
export const COLOR_VALUES = GAME_CANDY_COLORS.map(c => c.hex)

export function getColorByIndex(index: number): CandyColor {
  if (index < 0 || index >= GAME_CANDY_COLORS.length) {
    throw new Error(`Invalid color index: ${index}`)
  }
  return GAME_CANDY_COLORS[index]
}

export function getColorHex(index: number): number {
  return getColorByIndex(index).hex
}
