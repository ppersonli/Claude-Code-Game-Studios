export interface BubbleColor {
  id: number
  name: string
  emoji: string
  hex: number
}

export const BUBBLE_COLORS: readonly BubbleColor[] = [
  { id: 0, name: '草莓粉', emoji: '🩷', hex: 0xFF69B4 },
  { id: 1, name: '抹茶绿', emoji: '🟢', hex: 0x66CC66 },
  { id: 2, name: '芒果黄', emoji: '🟡', hex: 0xFFD700 },
  { id: 3, name: '蓝莓紫', emoji: '🟣', hex: 0x9966CC },
  { id: 4, name: '椰子白', emoji: '⚪', hex: 0xF5F5F5 },
  { id: 5, name: '焦糖棕', emoji: '🟤', hex: 0xCC8833 },
] as const

export function getColorById(id: number): BubbleColor {
  const c = BUBBLE_COLORS.find(bc => bc.id === id)
  if (!c) throw new Error(`Bubble color not found: ${id}`)
  return c
}
