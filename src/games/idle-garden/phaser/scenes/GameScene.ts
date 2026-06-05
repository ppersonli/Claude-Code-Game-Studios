/**
 * Idle Garden Tycoon — Game Scene
 * Renders the garden with pots, flowers, growth animations, and harvest effects.
 * Receives state and callbacks from Vue via scene data.
 */
import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS, POT_LAYOUT } from '../config'
import { getFlowerById } from '../../data/flowers'
import { calcGrowthProgress, calcPriceMultiplier, calcGrowthMultiplier, CONSTANTS } from '../../data/constants'
import type { GameState, PotState } from '../../data/types'

export interface GameSceneData {
  getState: () => GameState
  onPlantFlower: (potId: number, flowerId: string) => void
  onHarvestPot: (potId: number) => void
  onWaterPot: (potId: number) => void
  onRequestSync: () => void
}

export class GameScene extends Phaser.Scene {
  private state!: GameState
  private sceneData!: GameSceneData

  // Visual elements
  private potGraphics: Phaser.GameObjects.Graphics[] = []
  private flowerTexts: Phaser.GameObjects.Text[] = []
  private progressBars: Phaser.GameObjects.Graphics[] = []
  private potZones: Phaser.GameObjects.Zone[] = []
  private readyIndicators: Phaser.GameObjects.Text[] = []

  // Seed selector
  private seedSelectorVisible = false
  private seedSelectorContainer: Phaser.GameObjects.Container | null = null
  private selectedPotId = -1

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: GameSceneData): void {
    this.sceneData = data
    this.state = data.getState()
  }

  create(): void {
    this.drawBackground()
    this.drawGarden()
    this.drawSeedSelector()
  }

  private drawBackground(): void {
    // Sky gradient
    const sky = this.add.graphics()
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x98FB98, 0x98FB98, 1)
    sky.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Ground
    const ground = this.add.graphics()
    ground.fillStyle(0x4CAF50, 1)
    ground.fillRect(0, GAME_HEIGHT * 0.35, GAME_WIDTH, GAME_HEIGHT * 0.65)

    // Grass tufts
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20)
      const y = Phaser.Math.Between(GAME_HEIGHT * 0.35, GAME_HEIGHT - 30)
      const grass = this.add.graphics()
      grass.fillStyle(0x66BB6A, 0.6)
      grass.fillEllipse(x, y, 12, 6)
    }

    // Sun
    const sun = this.add.graphics()
    sun.fillStyle(0xFFD740, 1)
    sun.fillCircle(GAME_WIDTH - 60, 60, 35)
    sun.fillStyle(0xFFE082, 0.5)
    sun.fillCircle(GAME_WIDTH - 60, 60, 45)
  }

  private drawGarden(): void {
    this.state = this.sceneData.getState()

    // Clear old elements
    this.potGraphics.forEach(g => g.destroy())
    this.flowerTexts.forEach(t => t.destroy())
    this.progressBars.forEach(g => g.destroy())
    this.potZones.forEach(z => z.destroy())
    this.readyIndicators.forEach(t => t.destroy())
    this.potGraphics = []
    this.flowerTexts = []
    this.progressBars = []
    this.potZones = []
    this.readyIndicators = []

    const { startX, startY, spacingX, spacingY, potsPerRow, potWidth, potHeight } = POT_LAYOUT
    const growthMult = calcGrowthMultiplier(this.state.spGrowthUpgrades)

    this.state.pots.forEach((pot, i) => {
      const col = i % potsPerRow
      const row = Math.floor(i / potsPerRow)
      const x = startX + col * spacingX
      const y = startY + row * spacingY

      // Draw pot
      const potGfx = this.add.graphics()
      this.drawPot(potGfx, x, y, potWidth, potHeight, pot)
      this.potGraphics.push(potGfx)

      if (pot.flowerId) {
        const flower = getFlowerById(pot.flowerId)
        if (flower) {
          const progress = calcGrowthProgress(
            (Date.now() - pot.plantedAt) / 1000,
            flower.growTime,
            pot.isWatered,
            growthMult,
          )

          // Flower name/status
          const statusText = pot.isReady
            ? `${flower.name} ✓`
            : `${Math.floor(progress * 100)}%`
          const status = this.add.text(x, y - potHeight / 2 - 12, statusText, {
            fontFamily: 'Fredoka One, cursive',
            fontSize: '12px',
            color: pot.isReady ? COLORS.accent : '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
          }).setOrigin(0.5)
          this.flowerTexts.push(status)

          // Progress bar
          if (!pot.isReady) {
            const barGfx = this.add.graphics()
            const barW = potWidth - 10
            const barH = 6
            const barX = x - barW / 2
            const barY = y + potHeight / 2 + 4
            barGfx.fillStyle(0x333333, 0.8)
            barGfx.fillRoundedRect(barX, barY, barW, barH, 3)
            barGfx.fillStyle(pot.isWatered ? 0x42A5F5 : 0x66BB6A, 1)
            barGfx.fillRoundedRect(barX, barY, barW * progress, barH, 3)
            this.progressBars.push(barGfx)
          }

          // Ready indicator (bounce animation)
          if (pot.isReady) {
            const ready = this.add.text(x, y - potHeight / 2 - 28, '🌸', {
              fontSize: '20px',
            }).setOrigin(0.5)
            this.tweens.add({
              targets: ready,
              y: ready.y - 6,
              duration: 500,
              ease: 'Sine.easeInOut',
              yoyo: true,
              repeat: -1,
            })
            this.readyIndicators.push(ready)
          }

          // Watered indicator
          if (pot.isWatered && !pot.isReady) {
            const drop = this.add.text(x + potWidth / 2 - 8, y - potHeight / 2, '💧', {
              fontSize: '12px',
            }).setOrigin(0.5)
            this.flowerTexts.push(drop)
          }
        }
      } else {
        // Empty pot hint
        const hint = this.add.text(x, y, '+', {
          fontFamily: 'Fredoka One, cursive',
          fontSize: '28px',
          color: 'rgba(255,255,255,0.3)',
        }).setOrigin(0.5)
        this.flowerTexts.push(hint)
      }

      // Interactive zone for pot
      const zone = this.add.zone(x, y, potWidth + 20, potHeight + 30).setInteractive()
      zone.on('pointerdown', () => this.handlePotClick(pot))
      this.potZones.push(zone)
    })
  }

  private drawPot(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    pot: PotState,
  ): void {
    const halfW = w / 2
    const halfH = h / 2

    // Pot body (trapezoid)
    gfx.fillStyle(0xD2691E, 1)
    gfx.beginPath()
    gfx.moveTo(x - halfW, y - halfH + 10)
    gfx.lineTo(x + halfW, y - halfH + 10)
    gfx.lineTo(x + halfW - 8, y + halfH)
    gfx.lineTo(x - halfW + 8, y + halfH)
    gfx.closePath()
    gfx.fillPath()

    // Pot rim
    gfx.fillStyle(0xA0522D, 1)
    gfx.fillRoundedRect(x - halfW - 4, y - halfH, w + 8, 14, 4)

    // Soil
    gfx.fillStyle(0x5D4037, 1)
    gfx.fillRoundedRect(x - halfW + 4, y - halfH + 6, w - 8, 18, 4)

    // Highlight
    gfx.fillStyle(0xE8A065, 0.3)
    gfx.fillRect(x - halfW + 6, y - halfH + 16, 8, h - 30)

    // Glow if ready
    if (pot.isReady) {
      gfx.lineStyle(3, 0xFFD740, 0.7)
      gfx.strokeRoundedRect(x - halfW - 6, y - halfH - 4, w + 12, h + 8, 8)
    }
  }

  private drawSeedSelector(): void {
    this.seedSelectorContainer = this.add.container(0, 0).setVisible(false)
  }

  private showSeedSelector(potId: number): void {
    if (!this.seedSelectorContainer) return
    const container = this.seedSelectorContainer

    container.removeAll(true)
    this.selectedPotId = potId
    this.seedSelectorVisible = true

    // Background overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    container.add(overlay)

    // Panel
    const panelW = 360
    const panelH = 300
    const panelX = (GAME_WIDTH - panelW) / 2
    const panelY = (GAME_HEIGHT - panelH) / 2

    const panel = this.add.graphics()
    panel.fillStyle(0x2d5a3f, 0.95)
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16)
    panel.lineStyle(2, 0x4CAF50, 1)
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16)
    container.add(panel)

    // Title
    const title = this.add.text(GAME_WIDTH / 2, panelY + 25, 'Choose a Seed', {
      fontFamily: 'Fredoka One, cursive',
      fontSize: '20px',
      color: COLORS.accent,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)
    container.add(title)

    // Available flowers
    const available = this.state.unlockedFlowers
    available.forEach((flowerId, i) => {
      const flower = getFlowerById(flowerId)
      if (!flower) return

      const row = Math.floor(i / 2)
      const col = i % 2
      const btnX = panelX + 30 + col * 165
      const btnY = panelY + 60 + row * 65
      const btnW = 150
      const btnH = 55

      const canAfford = this.state.coins >= flower.seedCost

      const btn = this.add.graphics()
      btn.fillStyle(canAfford ? 0x388E3C : 0x555555, 1)
      btn.fillRoundedRect(btnX, btnY, btnW, btnH, 10)
      container.add(btn)

      const label = this.add.text(btnX + btnW / 2, btnY + 16, flower.name, {
        fontFamily: 'Fredoka One, cursive',
        fontSize: '14px',
        color: canAfford ? '#FFFFFF' : '#999999',
      }).setOrigin(0.5)
      container.add(label)

      const costText = this.add.text(btnX + btnW / 2, btnY + 36, `💰 ${flower.seedCost}  ⏱ ${flower.growTime}s`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '11px',
        color: canAfford ? COLORS.accent : '#777777',
      }).setOrigin(0.5)
      container.add(costText)

      if (canAfford) {
        const zone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH).setInteractive()
        zone.on('pointerdown', () => {
          this.sceneData.onPlantFlower(potId, flowerId)
          this.hideSeedSelector()
          this.refresh()
        })
        container.add(zone)
      }
    })

    // Close button
    const closeBtn = this.add.text(GAME_WIDTH / 2, panelY + panelH - 25, '[ Close ]', {
      fontFamily: 'Fredoka One, cursive',
      fontSize: '16px',
      color: '#AAAAAA',
    }).setOrigin(0.5).setInteractive()
    closeBtn.on('pointerdown', () => this.hideSeedSelector())
    container.add(closeBtn)

    this.seedSelectorContainer.setVisible(true)
  }

  private hideSeedSelector(): void {
    this.seedSelectorVisible = false
    this.seedSelectorContainer?.setVisible(false)
  }

  private handlePotClick(pot: PotState): void {
    if (this.seedSelectorVisible) return

    if (pot.isReady && pot.flowerId) {
      // Harvest
      this.spawnHarvestEffect(pot)
      this.sceneData.onHarvestPot(pot.id)
      this.time.delayedCall(100, () => this.refresh())
    } else if (!pot.flowerId) {
      // Show seed selector
      this.showSeedSelector(pot.id)
    } else if (!pot.isWatered && pot.flowerId) {
      // Water
      this.sceneData.onWaterPot(pot.id)
      this.refresh()
    }
  }

  private spawnHarvestEffect(pot: PotState): void {
    const { startX, startY, spacingX, spacingY, potsPerRow, potHeight } = POT_LAYOUT
    const idx = this.state.pots.findIndex(p => p.id === pot.id)
    const col = idx % potsPerRow
    const row = Math.floor(idx / potsPerRow)
    const x = startX + col * spacingX
    const y = startY + row * spacingY - potHeight / 2

    // Coin particles
    for (let i = 0; i < 6; i++) {
      const coin = this.add.text(x, y, '💰', { fontSize: '16px' }).setOrigin(0.5)
      const angle = (Math.PI * 2 * i) / 6
      this.tweens.add({
        targets: coin,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60 - 30,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => coin.destroy(),
      })
    }

    // Sparkle text
    const sparkle = this.add.text(x, y - 20, '✨ +coins', {
      fontFamily: 'Fredoka One, cursive',
      fontSize: '16px',
      color: COLORS.accent,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)
    this.tweens.add({
      targets: sparkle,
      y: y - 60,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => sparkle.destroy(),
    })
  }

  /**
   * Called by Vue to refresh the scene after state changes.
   */
  refresh(): void {
    this.drawGarden()
  }

  /**
   * Spawn a floating coin particle at a position (called from Vue).
   */
  spawnCoinParticle(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, `+${amount}`, {
      fontFamily: 'Fredoka One, cursive',
      fontSize: '18px',
      color: COLORS.accent,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    })
  }
}
