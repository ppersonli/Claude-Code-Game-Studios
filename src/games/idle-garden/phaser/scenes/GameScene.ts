/**
 * Idle Garden Tycoon — Game Scene
 * Renders the garden with pot sprites, flower sprites, growth animations, and harvest effects.
 * Receives state and callbacks from Vue via scene data.
 */
import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, COLORS, POT_LAYOUT } from '../config'
import { getFlowerById } from '../../data/flowers'
import { calcGrowthProgress, CONSTANTS } from '../../data/constants'
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

  // Visual element groups (for cleanup on refresh)
  private potSprites: Phaser.GameObjects.Image[] = []
  private flowerSprites: Phaser.GameObjects.Image[] = []
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
    // Background image
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-game')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    this.drawGarden()
    this.drawSeedSelector()
  }

  private drawGarden(): void {
    this.state = this.sceneData.getState()

    // Clear old elements
    this.potSprites.forEach(s => s.destroy())
    this.flowerSprites.forEach(s => s.destroy())
    this.flowerTexts.forEach(t => t.destroy())
    this.progressBars.forEach(g => g.destroy())
    this.potZones.forEach(z => z.destroy())
    this.readyIndicators.forEach(t => t.destroy())
    this.potSprites = []
    this.flowerSprites = []
    this.flowerTexts = []
    this.progressBars = []
    this.potZones = []
    this.readyIndicators = []

    const { startX, startY, spacingX, spacingY, potsPerRow, potWidth, potHeight } = POT_LAYOUT

    // Include growth-speed upgrade in multiplier
    const growthSpeedLevel = this.state.upgrades['growth-speed'] || 0
    const growthMult = 1
      + this.state.spGrowthUpgrades * CONSTANTS.SP_GROWTH_BOOST
      + growthSpeedLevel * CONSTANTS.GROWTH_SPEED_PER_LEVEL

    this.state.pots.forEach((pot, i) => {
      const col = i % potsPerRow
      const row = Math.floor(i / potsPerRow)
      const x = startX + col * spacingX
      const y = startY + row * spacingY

      // Pot sprite
      const potSprite = this.add.image(x, y, 'pot-empty')
        .setDisplaySize(potWidth, potHeight)
      this.potSprites.push(potSprite)

      if (pot.flowerId) {
        const flower = getFlowerById(pot.flowerId)
        if (flower) {
          const progress = calcGrowthProgress(
            (Date.now() - pot.plantedAt) / 1000,
            flower.growTime,
            pot.isWatered,
            growthMult,
          )

          // Flower sprite above pot
          const flowerSprite = this.add.image(x, y - potHeight / 2 - 10, flower.img)
            .setDisplaySize(potWidth - 10, potWidth - 10)
          this.flowerSprites.push(flowerSprite)

          if (pot.isReady) {
            // Ready indicator — bounce the flower sprite
            this.tweens.add({
              targets: flowerSprite,
              y: flowerSprite.y - 6,
              duration: 500,
              ease: 'Sine.easeInOut',
              yoyo: true,
              repeat: -1,
            })

            const ready = this.add.text(x, y - potHeight / 2 - 38, `${flower.name} ✓`, {
              fontFamily: 'Fredoka One, cursive',
              fontSize: '12px',
              color: COLORS.accent,
              stroke: '#000000',
              strokeThickness: 2,
            }).setOrigin(0.5)
            this.readyIndicators.push(ready)
          } else {
            // Growth percentage label
            const status = this.add.text(x, y - potHeight / 2 - 30, `${Math.floor(progress * 100)}%`, {
              fontFamily: 'Fredoka One, cursive',
              fontSize: '12px',
              color: '#FFFFFF',
              stroke: '#000000',
              strokeThickness: 2,
            }).setOrigin(0.5)
            this.flowerTexts.push(status)

            // Progress bar
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

            // Watered indicator
            if (pot.isWatered) {
              const drop = this.add.text(x + potWidth / 2 - 8, y - potHeight / 2, '💧', {
                fontSize: '12px',
              }).setOrigin(0.5)
              this.flowerTexts.push(drop)
            }
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

      // Flower icon in seed selector
      const icon = this.add.image(btnX + 24, btnY + btnH / 2, flower.img)
        .setDisplaySize(32, 32)
      container.add(icon)

      const label = this.add.text(btnX + 50, btnY + 16, flower.name, {
        fontFamily: 'Fredoka One, cursive',
        fontSize: '14px',
        color: canAfford ? '#FFFFFF' : '#999999',
      }).setOrigin(0, 0.5)
      container.add(label)

      const costText = this.add.text(btnX + 50, btnY + 36, `💰 ${flower.seedCost}  ⏱ ${flower.growTime}s`, {
        fontFamily: 'Nunito, sans-serif',
        fontSize: '11px',
        color: canAfford ? COLORS.accent : '#777777',
      }).setOrigin(0, 0.5)
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
      this.spawnHarvestEffect(pot)
      this.sceneData.onHarvestPot(pot.id)
      this.time.delayedCall(100, () => this.refresh())
    } else if (!pot.flowerId) {
      this.showSeedSelector(pot.id)
    } else if (!pot.isWatered && pot.flowerId) {
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

  refresh(): void {
    this.drawGarden()
  }

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
