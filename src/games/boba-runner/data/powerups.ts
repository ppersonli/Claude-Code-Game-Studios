export interface PowerUpDef {
  id: string
  name: string
  emoji: string
  duration: number // ms, 0 = instant
  color: number
}

export const POWERUPS: readonly PowerUpDef[] = [
  { id: 'magnet', name: '磁铁', emoji: '🧲', duration: 5000, color: 0xFF4444 },
  { id: 'shield', name: '护盾', emoji: '🛡️', duration: 0, color: 0x4488FF },
  { id: 'double', name: '双倍', emoji: '✨', duration: 8000, color: 0xFFD700 },
] as const

export function getPowerUpById(id: string): PowerUpDef {
  const p = POWERUPS.find(pu => pu.id === id)
  if (!p) throw new Error(`PowerUp not found: ${id}`)
  return p
}
