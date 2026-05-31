import { getIngredientByLevel, MAX_INGREDIENT_LEVEL } from '../data/ingredients'

/**
 * Draw a kawaii ingredient circle with eyes and mouth.
 * Coordinates are local (0, 0) centered.
 */
export function drawIngredient(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  level: number,
  scale: number = 1,
): void {
  const info = getIngredientByLevel(level)
  const r = info.radius * scale

  // Main body
  gfx.fillStyle(info.color, 1)
  gfx.fillCircle(x, y, r)

  // Darker border
  gfx.lineStyle(2, darkenColor(info.color, 0.3), 1)
  gfx.strokeCircle(x, y, r)

  // Eyes
  const eyeOffsetX = r * 0.28
  const eyeY = y - r * 0.12
  const eyeR = r * 0.12
  gfx.fillStyle(0x222222, 1)
  gfx.fillCircle(x - eyeOffsetX, eyeY, eyeR)
  gfx.fillCircle(x + eyeOffsetX, eyeY, eyeR)

  // Eye highlights
  gfx.fillStyle(0xffffff, 0.8)
  gfx.fillCircle(x - eyeOffsetX + eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.45)
  gfx.fillCircle(x + eyeOffsetX + eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.45)

  // Mouth (small arc)
  gfx.lineStyle(1.5, 0x222222, 0.7)
  gfx.beginPath()
  gfx.arc(x, y + r * 0.15, r * 0.18, 0.2, Math.PI - 0.2, false)
  gfx.strokePath()
}

function darkenColor(color: number, amount: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * (1 - amount))
  const g = Math.floor(((color >> 8) & 0xff) * (1 - amount))
  const b = Math.floor((color & 0xff) * (1 - amount))
  return (r << 16) | (g << 8) | b
}

/**
 * Draw sparkle dots around the max-level ingredient.
 */
export function drawSparkles(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  time: number,
): void {
  const count = 6
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + time * 1.5
    const dist = radius + 6 + Math.sin(time * 3 + i) * 3
    const sx = x + Math.cos(angle) * dist
    const sy = y + Math.sin(angle) * dist
    const sr = 2 + Math.sin(time * 4 + i * 2) * 1
    gfx.fillStyle(0xffffff, 0.7 + Math.sin(time * 3 + i) * 0.3)
    gfx.fillCircle(sx, sy, sr)
  }
}
