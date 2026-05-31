/**
 * Drawing helpers for Boba Drop ingredients.
 * These are Phaser Graphics-dependent but factored out for clarity.
 */

import Phaser from 'phaser'
import { INGREDIENTS } from '../data/ingredients'

/**
 * Draw a kawaii-faced ingredient circle at (x, y) on the given graphics object.
 */
export function drawIngredient(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  level: number,
  scale: number = 1,
): void {
  const info = INGREDIENTS[level]
  if (!info) return
  const r = info.radius * scale

  gfx.fillStyle(info.color, 1)
  gfx.fillCircle(x, y, r)
  gfx.lineStyle(2, 0x000000, 0.3)
  gfx.strokeCircle(x, y, r)

  // Eyes
  const eyeSpacing = r * 0.35
  const eyeY = y - r * 0.15
  gfx.fillStyle(0x000000, 1)
  gfx.fillCircle(x - eyeSpacing, eyeY, r * 0.12)
  gfx.fillCircle(x + eyeSpacing, eyeY, r * 0.12)

  // Eye highlights
  gfx.fillStyle(0xFFFFFF, 0.8)
  gfx.fillCircle(x - eyeSpacing + r * 0.04, eyeY - r * 0.04, r * 0.05)
  gfx.fillCircle(x + eyeSpacing + r * 0.04, eyeY - r * 0.04, r * 0.05)

  // Mouth
  gfx.lineStyle(2, 0x000000, 0.8)
  gfx.beginPath()
  const mouthWidth = r * 0.25
  const mouthY = y + r * 0.15
  gfx.arc(x, mouthY - r * 0.05, mouthWidth, 0.2, Math.PI - 0.2, false)
  gfx.strokePath()
}

/**
 * Draw sparkle particles around the Super Boba (level 7).
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
    const angle = time * 2 + (i * Math.PI * 2) / count
    const dist = radius + 8 + Math.sin(time * 3 + i) * 5
    const sx = x + Math.cos(angle) * dist
    const sy = y + Math.sin(angle) * dist
    gfx.fillStyle(0xffffff, 0.7 + 0.3 * Math.sin(time * 4 + i))
    gfx.fillCircle(sx, sy, 2)
  }
}
