/** Kawaii color palette for blocks */
export interface KawaiiColor {
  id: string
  name: string
  emoji: string
  hex: string
  glow: string
}

export const KAWAII_COLORS: readonly KawaiiColor[] = [
  { id: 'pink', name: '貓咪粉', emoji: '🐱', hex: '#FF69B4', glow: '#FF1493' },
  { id: 'blue', name: '狗狗藍', emoji: '🐶', hex: '#4FC3F7', glow: '#0288D1' },
  { id: 'green', name: '青蛙綠', emoji: '🐸', hex: '#66BB6A', glow: '#2E7D32' },
  { id: 'yellow', name: '小雞黃', emoji: '🐥', hex: '#FFD54F', glow: '#F9A825' },
  { id: 'orange', name: '狐狸橙', emoji: '🦊', hex: '#FF8A65', glow: '#E64A19' },
  { id: 'purple', name: '兔兔紫', emoji: '🐰', hex: '#CE93D8', glow: '#7B1FA2' },
] as const

export function getKawaiiColor(index: number): KawaiiColor {
  return KAWAII_COLORS[index % KAWAII_COLORS.length]
}
