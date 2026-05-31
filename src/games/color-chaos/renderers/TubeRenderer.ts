import Phaser from 'phaser'
import { GAME_COLORS } from '../core'
import type { SkinVisuals } from '../core/Skin'

const DEFAULT_VISUALS: SkinVisuals = {
  glassColor: 0xffffff,
  glassAlpha: 0.15,
  borderColor: 0xffffff,
  borderAlpha: 0.5,
  borderWidth: 3,
  rimColor: 0xffffff,
  highlightColor: 0xffffff,
  highlightAlpha: 0.08,
}

/**
 * TubeRenderer - handles rendering a single tube with its color layers.
 * Supports skin visual customization via setSkin().
 */
export class TubeRenderer {
  private container: Phaser.GameObjects.Container
  private tubeGraphics: Phaser.GameObjects.Graphics
  private layerGraphics: Phaser.GameObjects.Graphics[]
  private index: number
  private x: number
  private y: number
  private width: number
  private height: number
  private tubeCapacity: number
  private isSelected: boolean = false
  private scene: Phaser.Scene
  private skinVisuals: SkinVisuals = DEFAULT_VISUALS

  constructor(
    scene: Phaser.Scene,
    index: number,
    x: number,
    y: number,
    width: number,
    height: number,
    tubeCapacity: number
  ) {
    this.scene = scene
    this.index = index
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.tubeCapacity = tubeCapacity
    this.layerGraphics = []

    this.container = scene.add.container(x, y)
    this.tubeGraphics = scene.add.graphics()
    this.container.add(this.tubeGraphics)

    this.drawTube()
  }

  /**
   * Apply a skin's visual configuration to this tube.
   */
  setSkin(visuals: SkinVisuals | null): void {
    this.skinVisuals = visuals ?? DEFAULT_VISUALS
    this.drawTube()
  }

  private drawTube(): void {
    this.tubeGraphics.clear()

    const tubeHeight = this.height
    const tubeWidth = this.width
    const cornerRadius = 8
    const v = this.skinVisuals

    // Glow effect (behind tube body)
    if (v.glow) {
      this.tubeGraphics.fillStyle(v.glow.color, v.glow.alpha)
      this.tubeGraphics.fillCircle(0, 0, v.glow.radius)
    }

    // Outer tube (glass body)
    this.tubeGraphics.fillStyle(v.glassColor, v.glassAlpha)
    this.tubeGraphics.fillRoundedRect(
      -tubeWidth / 2,
      -tubeHeight / 2,
      tubeWidth,
      tubeHeight,
      cornerRadius
    )

    // Tube border
    this.tubeGraphics.lineStyle(v.borderWidth, v.borderColor, v.borderAlpha)
    this.tubeGraphics.strokeRoundedRect(
      -tubeWidth / 2,
      -tubeHeight / 2,
      tubeWidth,
      tubeHeight,
      cornerRadius
    )

    // Glass highlight (left edge shine)
    this.tubeGraphics.fillStyle(v.highlightColor, v.highlightAlpha)
    this.tubeGraphics.fillRoundedRect(
      -tubeWidth / 2 + 4,
      -tubeHeight / 2 + 4,
      8,
      tubeHeight - 8,
      4
    )

    // Rim at top
    this.tubeGraphics.lineStyle(2, v.rimColor, 0.4)
    this.tubeGraphics.beginPath()
    this.tubeGraphics.moveTo(-tubeWidth / 2 - 4, -tubeHeight / 2)
    this.tubeGraphics.lineTo(tubeWidth / 2 + 4, -tubeHeight / 2)
    this.tubeGraphics.strokePath()
  }

  /**
   * Update the color layers inside the tube.
   * Layers are rendered bottom to top.
   */
  updateLayers(layers: readonly number[]): void {
    this.layerGraphics.forEach(g => g.destroy())
    this.layerGraphics = []

    const layerHeight = (this.height - 16) / this.tubeCapacity
    const bottomY = this.height / 2 - 8

    layers.forEach((colorId, i) => {
      const color = GAME_COLORS[colorId]
      if (!color) return

      const g = this.scene.add.graphics()
      const layerY = bottomY - (i + 1) * layerHeight

      const layerColor = parseInt(color.hex.replace('#', ''), 16)
      g.fillStyle(layerColor, 1)
      g.fillRoundedRect(
        -this.width / 2 + 6,
        layerY,
        this.width - 12,
        layerHeight - 2,
        4
      )

      g.fillStyle(0xffffff, 0.2)
      g.fillRoundedRect(
        -this.width / 2 + 6,
        layerY,
        this.width - 12,
        layerHeight / 2 - 1,
        { tl: 4, tr: 4, bl: 0, br: 0 }
      )

      this.container.add(g)
      this.layerGraphics.push(g)
    })
  }

  /**
   * Get the world position of the top of this tube (for pouring animation).
   */
  getTopPosition(): { x: number; y: number } {
    return {
      x: this.container.x,
      y: this.container.y - this.height / 2,
    }
  }

  /**
   * Get the world position of a specific layer slot.
   */
  getLayerPosition(layerIndex: number): { x: number; y: number } {
    const layerHeight = (this.height - 16) / this.tubeCapacity
    const bottomY = this.height / 2 - 8
    const layerY = bottomY - (layerIndex + 1) * layerHeight
    return {
      x: this.container.x,
      y: this.container.y + layerY,
    }
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected
    if (selected) {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 150,
        ease: 'Back.easeOut',
      })
    } else {
      this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150,
        ease: 'Quad.easeInOut',
      })
    }
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container
  }

  getIndex(): number {
    return this.index
  }

  destroy(): void {
    this.layerGraphics.forEach(g => g.destroy())
    this.container.destroy()
  }
}
