import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, CLOTHING_TABS } from '../../data/constants'
import { CLOTHING } from '../../data/clothing'
import { DressUpSystem } from '../../systems/DressUpSystem'
import { ScoringSystem } from '../../systems/ScoringSystem'
import { fadeIn, fadeOut, spawnParticles } from '@shared/utils/poki-polish'
import { audioEngine } from '@shared/phaser/audio'
import { t } from '../../i18n'
import type { Theme, Clothing, ClothingCategory } from '../../data/types'

const TAB_HEIGHT = 80
const GRID_TOP = 750
const GRID_COLS = 4
const GRID_CELL = 140
const GRID_GAP = 14

export class DressUpScene extends Phaser.Scene {
  private dressUp!: DressUpSystem
  private scoring!: ScoringSystem
  private theme!: Theme

  // UI refs
  private tabContainers: Map<ClothingCategory, Phaser.GameObjects.Container> = new Map()
  private activeTab: ClothingCategory = 'top'
  private clothingGrid: Phaser.GameObjects.Container | null = null
  private styleBar: Phaser.GameObjects.Graphics | null = null
  private styleText: Phaser.GameObjects.Text | null = null
  private modelContainer: Phaser.GameObjects.Container | null = null
  private equippedSprites: Map<ClothingCategory, Phaser.GameObjects.Image> = new Map()
  private tabLabels: Map<ClothingCategory, Phaser.GameObjects.Text> = new Map()

  constructor() {
    super({ key: 'DressUpScene' })
  }

  init(data: { theme: Theme }): void {
    this.theme = data.theme
    this.dressUp = new DressUpSystem()
    this.scoring = new ScoringSystem()
    this.equippedSprites.clear()
    this.tabContainers.clear()
    this.tabLabels.clear()
    this.activeTab = 'top'
    this.clothingGrid = null
    this.styleBar = null
    this.styleText = null
    this.modelContainer = null
  }

  create(): void {
    const cx = GAME_WIDTH / 2

    // Background
    const bg = this.add.image(cx, GAME_HEIGHT / 2, 'bg-dressup')
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT)

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x1a0a2e, 0.45)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Theme header
    const headerBg = this.add.graphics()
    headerBg.fillStyle(0x2d1b4e, 0.85)
    headerBg.fillRect(0, 0, GAME_WIDTH, 130)

    this.add.text(cx, 30, this.theme.name, {
      fontFamily: 'Fredoka One, cursive', fontSize: '32px', color: '#FF6B9D',
    }).setOrigin(0.5)

    this.add.text(cx, 68, `${t('required')}: ${this.theme.requiredStyles.join(' + ')}`, {
      fontFamily: 'Nunito, sans-serif', fontSize: '18px', color: '#E8B4CB',
    }).setOrigin(0.5)

    // Style match bar
    this.styleBar = this.add.graphics()
    this.styleText = this.add.text(cx, 110, `${t('styleMatch')}: 0%`, {
      fontFamily: 'Nunito, sans-serif', fontSize: '16px', color: '#FFFFFF',
    }).setOrigin(0.5)

    // Model preview area
    this.modelContainer = this.add.container(cx, 450)
    const modelBase = this.add.image(0, 0, 'model_default')
    modelBase.setDisplaySize(300, 420)
    this.modelContainer.add(modelBase)

    // Gentle model bounce
    this.tweens.add({
      targets: this.modelContainer, y: 460, duration: 2500,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    })

    // Category tabs
    this.createTabs()

    // Clothing grid for active tab
    this.createClothingGrid()

    // Start Runway button
    this.createStartButton()

    // Back button
    const backBtn = this.add.text(30, 140, '< Back', {
      fontFamily: 'Nunito, sans-serif', fontSize: '20px', color: '#E8B4CB',
    }).setInteractive({ useHandCursor: true })
    backBtn.on('pointerdown', () => {
      audioEngine.play('tick')
      fadeOut(this, 200).then(() => this.scene.start('ThemeSelectScene'))
    })

    fadeIn(this, 300)
  }

  private createTabs(): void {
    const tabW = GAME_WIDTH / CLOTHING_TABS.length
    const tabY = GRID_TOP - 40

    for (let i = 0; i < CLOTHING_TABS.length; i++) {
      const cat = CLOTHING_TABS[i]
      const x = i * tabW + tabW / 2
      const container = this.add.container(x, tabY)

      const bg = this.add.graphics()
      const isActive = cat === this.activeTab
      bg.fillStyle(isActive ? 0xFF6B9D : 0x2d1b4e, isActive ? 1 : 0.8)
      bg.fillRoundedRect(-tabW / 2 + 4, -20, tabW - 8, 40, 10)
      container.add(bg)

      const label = this.add.text(0, 0, t(cat), {
        fontFamily: 'Nunito, sans-serif', fontSize: '16px',
        color: isActive ? '#FFFFFF' : '#E8B4CB',
        fontStyle: isActive ? 'bold' : 'normal',
      }).setOrigin(0.5)
      container.add(label)

      this.tabContainers.set(cat, container)
      this.tabLabels.set(cat, label)

      const hitZone = this.add.zone(x, tabY, tabW, 40).setInteractive({ useHandCursor: true })
      hitZone.on('pointerdown', () => {
        audioEngine.play('tick')
        this.switchTab(cat)
      })
    }
  }

  private switchTab(cat: ClothingCategory): void {
    this.activeTab = cat

    // Update tab visuals
    const tabW = GAME_WIDTH / CLOTHING_TABS.length
    for (let i = 0; i < CLOTHING_TABS.length; i++) {
      const c = CLOTHING_TABS[i]
      const container = this.tabContainers.get(c)!
      const isActive = c === cat

      container.removeAll(true)
      const bg = this.add.graphics()
      bg.fillStyle(isActive ? 0xFF6B9D : 0x2d1b4e, isActive ? 1 : 0.8)
      bg.fillRoundedRect(-tabW / 2 + 4, -20, tabW - 8, 40, 10)
      container.add(bg)

      const label = this.add.text(0, 0, t(c), {
        fontFamily: 'Nunito, sans-serif', fontSize: '16px',
        color: isActive ? '#FFFFFF' : '#E8B4CB',
        fontStyle: isActive ? 'bold' : 'normal',
      }).setOrigin(0.5)
      container.add(label)
      this.tabLabels.set(c, label)
    }

    // Refresh clothing grid
    this.createClothingGrid()
  }

  private createClothingGrid(): void {
    if (this.clothingGrid) this.clothingGrid.destroy()

    const items = CLOTHING.filter(c => c.category === this.activeTab)
    const gridCx = GAME_WIDTH / 2
    const gridStartY = GRID_TOP

    this.clothingGrid = this.add.container(0, 0)

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const col = i % GRID_COLS
      const row = Math.floor(i / GRID_COLS)
      const x = gridCx + (col - (GRID_COLS - 1) / 2) * (GRID_CELL + GRID_GAP)
      const y = gridStartY + row * (GRID_CELL + GRID_GAP) + GRID_CELL / 2

      const isEquipped = this.dressUp.getEquipped(item.category)?.id === item.id

      // Cell background
      const cellBg = this.add.graphics()
      cellBg.fillStyle(isEquipped ? 0xFF6B9D : 0x2d1b4e, isEquipped ? 0.6 : 0.8)
      cellBg.lineStyle(2, isEquipped ? 0xFFFFFF : 0x5a3d7a, 1)
      cellBg.fillRoundedRect(-GRID_CELL / 2, -GRID_CELL / 2, GRID_CELL, GRID_CELL, 12)
      cellBg.strokeRoundedRect(-GRID_CELL / 2, -GRID_CELL / 2, GRID_CELL, GRID_CELL, 12)

      // Item image
      const img = this.add.image(0, -5, item.id)
      img.setDisplaySize(90, 90)

      // Item name
      const name = this.add.text(0, GRID_CELL / 2 - 18, item.name, {
        fontFamily: 'Nunito, sans-serif', fontSize: '11px', color: '#E8B4CB',
      }).setOrigin(0.5)

      // Rarity dot
      const rarityColors: Record<string, number> = { common: 0x888888, rare: 0x4488FF, epic: 0xAA44FF, legendary: 0xFFD700 }
      const dot = this.add.circle(-GRID_CELL / 2 + 12, -GRID_CELL / 2 + 12, 6, rarityColors[item.rarity] ?? 0x888888)

      const cellContainer = this.add.container(x, y, [cellBg, img, name, dot])
      this.clothingGrid.add(cellContainer)

      // Interactive hit zone (NOT in container to avoid double-positioning)
      const hit = this.add.zone(x, y, GRID_CELL, GRID_CELL).setInteractive({ useHandCursor: true })
      hit.on('pointerdown', () => {
        audioEngine.play('add')
        this.equipItem(item)
      })
      hit.on('pointerover', () => {
        cellContainer.setScale(1.05)
      })
      hit.on('pointerout', () => {
        cellContainer.setScale(1)
      })
    }
  }

  private equipItem(item: Clothing): void {
    this.dressUp.equip(item)

    // Update model preview - show equipped item on model
    const existing = this.equippedSprites.get(item.category)
    if (existing) existing.destroy()

    if (this.modelContainer) {
      const overlay = this.add.image(0, 0, item.id)
      overlay.setDisplaySize(120, 120)

      // Position based on category
      const positions: Record<string, { x: number; y: number }> = {
        top: { x: 0, y: -80 },
        bottom: { x: 0, y: 20 },
        shoes: { x: 0, y: 140 },
        accessory: { x: 60, y: -40 },
        hair: { x: 0, y: -150 },
      }
      const pos = positions[item.category] ?? { x: 0, y: 0 }
      overlay.setPosition(pos.x, pos.y)
      this.modelContainer.add(overlay)
      this.equippedSprites.set(item.category, overlay)

      // Pop animation
      overlay.setScale(0)
      this.tweens.add({
        targets: overlay, scaleX: 1, scaleY: 1,
        duration: 200, ease: 'Back.easeOut',
      })

      spawnParticles(this, this.modelContainer.x + pos.x, this.modelContainer.y + pos.y, [0xFF6B9D, 0xFFFFFF], 5)
    }

    // Refresh grid to show new equipped state
    this.createClothingGrid()
    this.updateStylePreview()
  }

  private updateStylePreview(): void {
    const outfit = this.dressUp.getOutfit()
    const matchScore = this.scoring.calculateStyleMatch(outfit, this.theme)

    if (this.styleBar) {
      this.styleBar.clear()
      // Background
      this.styleBar.fillStyle(0x2d1b4e, 0.8)
      this.styleBar.fillRoundedRect(GAME_WIDTH / 2 - 200, 95, 400, 20, 10)
      // Fill
      const fillW = Math.max(0, (matchScore / 100) * 396)
      if (fillW > 0) {
        const color = matchScore >= 80 ? 0x44FF44 : matchScore >= 50 ? 0xFFD700 : 0xFF6B9D
        this.styleBar.fillStyle(color, 1)
        this.styleBar.fillRoundedRect(GAME_WIDTH / 2 - 198, 97, fillW, 16, 8)
      }
    }

    if (this.styleText) {
      this.styleText.setText(`${t('styleMatch')}: ${Math.round(matchScore)}%`)
    }
  }

  private createStartButton(): void {
    const cx = GAME_WIDTH / 2
    const btnY = GAME_HEIGHT - 80
    const btnW = 340
    const btnH = 65

    const btn = this.add.container(cx, btnY)

    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.25)
    shadow.fillRoundedRect(-btnW / 2 + 3, -btnH / 2 + 3, btnW, btnH, 20)
    btn.add(shadow)

    const bg = this.add.graphics()
    bg.fillStyle(0xFF6B9D, 1)
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 20)
    btn.add(bg)

    const txt = this.add.text(0, 0, t('startRunway'), {
      fontFamily: 'Fredoka One, cursive', fontSize: '24px', color: '#FFFFFF',
    }).setOrigin(0.5)
    btn.add(txt)

    const hit = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => btn.setScale(1.05))
    hit.on('pointerout', () => btn.setScale(1))
    hit.on('pointerdown', () => {
      const outfit = this.dressUp.getOutfit()
      if (outfit.length === 0) return

      audioEngine.play('levelup')
      btn.setScale(0.92)
      this.time.delayedCall(150, () => {
        fadeOut(this, 300).then(() => {
          this.scene.start('RunwayScene', { theme: this.theme, outfit })
        })
      })
    })
    btn.add(hit)

    // Pulse
    this.tweens.add({
      targets: btn, scaleX: 1.03, scaleY: 1.03,
      duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    })
  }
}
