/**
 * Drawing helpers for Mochi Merge mochi.
 * Kawaii-style circles with faces.
 */

import Phaser from 'phaser'
import { MOCHI_TYPES } from '../data/mochi-types'

/**
 * Draw a kawaii mochi circle at (x, y) on the given graphics object.
 */
export function drawMochi(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  level: number,
  scale: number = 1,
): void {
  const info = MOCHI_TYPES[level]
  if (!info) return
  const r = info.radius * scale

  // Main body
  gfx.fillStyle(info.color, 1)
  gfx.fillCircle(x, y, r)

  // Soft highlight
  gfx.fillStyle(0xFFFFFF, 0.25)
  gfx.fillCircle(x - r * 0.2, y - r * 0.25, r * 0.45)

  // Outline
  gfx.lineStyle(2, 0x000000, 0.2)
  gfx.strokeCircle(x, y, r)

  // Eyes
  const eyeSpacing = r * 0.3
  const eyeY = y - r * 0.1
  gfx.fillStyle(0x000000, 1)
  gfx.fillCircle(x - eyeSpacing, eyeY, r * 0.1)
  gfx.fillCircle(x + eyeSpacing, eyeY, r * 0.1)

  // Eye highlights
  gfx.fillStyle(0xFFFFFF, 0.9)
  gfx.fillCircle(x - eyeSpacing + r * 0.035, eyeY - r * 0.035, r * 0.04)
  gfx.fillCircle(x + eyeSpacing + r * 0.035, eyeY - r * 0.035, r * 0.04)

  // Blush
  gfx.fillStyle(0xFF9999, 0.35)
  gfx.fillCircle(x - r * 0.45, y + r * 0.1, r * 0.15)
  gfx.fillCircle(x + r * 0.45, y + r * 0.1, r * 0.15)

  // Mouth — small happy curve
  gfx.lineStyle(1.5, 0x000000, 0.7)
  gfx.beginPath()
  const mouthY = y + r * 0.18
  gfx.arc(x, mouthY - r * 0.04, r * 0.18, 0.3, Math.PI - 0.3, false)
  gfx.strokePath()
}

/**
 * Draw rainbow sparkle particles around the Grand Mochi (max level).
 */
export function drawSparkles(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  time: number,
): void {
  const count = 8
  for (let i = 0; i < count; i++) {
    const angle = time * 2 + (i * Math.PI * 2) / count
    const dist = radius + 10 + Math.sin(time * 3 + i) * 5
    const sx = x + Math.cos(angle) * dist
    const sy = y + Math.sin(angle) * dist
    const hue = (time * 60 + i * 45) % 360
    const color = hsvToHex(hue, 1, 1)
    gfx.fillStyle(color, 0.7 + 0.3 * Math.sin(time * 4 + i))
    gfx.fillCircle(sx, sy, 3)
    gfx.fillStyle(0xFFFFFF, 0.5)
    gfx.fillCircle(sx, sy, 1.5)
  }
}

/** Simple HSV to hex conversion for sparkle colors. */
function hsvToHex(h: number, s: number, v: number): number {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return ((Math.round((r + m) * 255) << 16) + (Math.round((g + m) * 255) << 8) + Math.round((b + m) * 255))
}
