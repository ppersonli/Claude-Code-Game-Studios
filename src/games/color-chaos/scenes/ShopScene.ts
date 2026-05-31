import Phaser from 'phaser'
import { GAME_SKINS, type Skin, type SkinRarity } from '../core/Skin'
import { SkinManager } from '../services/SkinManager'
import { AudioManager } from '../services/AudioManager'
import { AdManager } from '../services/AdManager'

const RARITY_COLORS: Record<SkinRarity, string> = {
  common: '#aaaaaa',
  rare: '#44aaff',
  epic: '#aa44ff',
  legendary: '#FFD700',
}

/**
 * ShopScene - skin shop where players browse and purchase skins with Color Tickets.
 */
export class ShopScene extends Phaser.Scene {
  private ticketText!: Phaser.GameObjects.Text
  private cardContainers: Map<string, Phaser.GameObjects.Container> = new Map()
  private scrollY: number = 0
  private gridContainer!: Phaser.GameObjects.Container
  private maxScroll: number = 0
  private audioManager: AudioManager = new AudioManager()
  private adManager: AdManager = AdManager.getInstance()
  private freeTicketBtn!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'ShopScene' })
  }

  create(): void {
    const { width, height } = this.scale

    this.input.once('pointerdown', () => {
      this.audioManager.init()
    })

    this.cameras.main.setBackgroundColor('#1a1a2e')

    this.add.text(width / 2, 35, 'SKIN SHOP', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const backBtn = this.add.text(30, 35, '← BACK', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#44ff44',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

    backBtn.on('pointerdown', () => {
      this.audioManager.playClick()
      this.scene.start('LevelSelectScene')
    })

    backBtn.on('pointerover', () => backBtn.setScale(1.1))
    backBtn.on('pointerout', () => backBtn.setScale(1.0))

    this.ticketText = this.add.text(width - 30, 35, `🎫 ${SkinManager.getTicketBalance()}`, {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5)

    if (this.adManager.isEnabled && !this.adManager.shopRewardClaimed) {
      this.freeTicketBtn = this.add.text(width / 2, 65, '[ 🎬 Free 5 Tickets ]', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#ff8844',
        fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      this.freeTicketBtn.on('pointerdown', async () => {
        const rewarded = await this.adManager.requestRewardedAd()
        if (rewarded) {
          this.adManager.shopRewardClaimed = true
          SkinManager.addTickets(5)
          this.ticketText.setText(`🎫 ${SkinManager.getTicketBalance()}`)
          this.freeTicketBtn.setText('[ ✓ Claimed ]')
          this.freeTicketBtn.disableInteractive()
          this.freeTicketBtn.setColor('#44ff44')
        }
      })

      this.freeTicketBtn.on('pointerover', () => this.freeTicketBtn.setScale(1.1))
      this.freeTicketBtn.on('pointerout', () => this.freeTicketBtn.setScale(1.0))
    }

    this.gridContainer = this.add.container(0, 0)

    const cols = 3
    const cardWidth = 200
    const cardHeight = 200
    const padding = 20
    const gridStartY = 80
    const gridStartX = (width - (cols * (cardWidth + padding) - padding)) / 2

    GAME_SKINS.forEach((skin, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = gridStartX + col * (cardWidth + padding) + cardWidth / 2
      const y = gridStartY + row * (cardHeight + padding) + cardHeight / 2

      const card = this.createSkinCard(x, y, cardWidth, cardHeight, skin)
      this.gridContainer.add(card)
      this.cardContainers.set(skin.id, card)
    })

    const totalRows = Math.ceil(GAME_SKINS.length / cols)
    const totalGridHeight = totalRows * (cardHeight + padding)
    const visibleHeight = height - gridStartY - 20
    this.maxScroll = Math.max(0, totalGridHeight - visibleHeight)

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gos: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScroll)
      this.gridContainer.y = -this.scrollY
    })

    let dragStartY = 0
    let dragStartScroll = 0
    let isDragging = false

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragStartY = pointer.y
      dragStartScroll = this.scrollY
      isDragging = false
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const dy = dragStartY - pointer.y
        if (Math.abs(dy) > 5) {
          isDragging = true
        }
        if (isDragging) {
          this.scrollY = Phaser.Math.Clamp(dragStartScroll + dy, 0, this.maxScroll)
          this.gridContainer.y = -this.scrollY
        }
      }
    })
  }

  private createSkinCard(
    x: number,
    y: number,
    width: number,
    height: number,
    skin: Skin
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const isUnlocked = SkinManager.isSkinUnlocked(skin.id)
    const isEquipped = SkinManager.getEquippedSkinId() === skin.id

    const bg = this.add.graphics()
    bg.fillStyle(0x222233, 1)
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12)

    const borderColor = isEquipped ? 0xFFD700 : 0x4488ff
    const borderAlpha = isEquipped ? 1 : 0.4
    bg.lineStyle(isEquipped ? 3 : 2, borderColor, borderAlpha)
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12)

    container.add(bg)

    const previewContainer = this.add.container(0, -40)
    const previewG = this.add.graphics()
    const v = skin.visuals

    if (v.glow) {
      previewG.fillStyle(v.glow.color, v.glow.alpha)
      previewG.fillCircle(0, 0, v.glow.radius * 0.5)
    }

    const tw = 30
    const th = 70
    previewG.fillStyle(v.glassColor, v.glassAlpha)
    previewG.fillRoundedRect(-tw / 2, -th / 2, tw, th, 6)
    previewG.lineStyle(2, v.borderColor, v.borderAlpha)
    previewG.strokeRoundedRect(-tw / 2, -th / 2, tw, th, 6)

    previewG.fillStyle(v.highlightColor, v.highlightAlpha)
    previewG.fillRoundedRect(-tw / 2 + 2, -th / 2 + 2, 4, th - 4, 3)

    const sampleColors = [0xFF4444, 0x4488FF, 0x44CC44]
    const layerH = (th - 12) / 4
    sampleColors.forEach((color, i) => {
      const layerY = th / 2 - 6 - (i + 1) * layerH
      previewG.fillStyle(color, 1)
      previewG.fillRoundedRect(-tw / 2 + 3, layerY, tw - 6, layerH - 1, 3)
      previewG.fillStyle(0xffffff, 0.2)
      previewG.fillRoundedRect(-tw / 2 + 3, layerY, tw - 6, (layerH - 1) / 2, { tl: 3, tr: 3, bl: 0, br: 0 })
    })

    previewContainer.add(previewG)
    container.add(previewContainer)

    const nameText = this.add.text(0, 25, skin.name, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    container.add(nameText)

    const rarityColor = RARITY_COLORS[skin.rarity]
    const rarityText = this.add.text(0, 42, skin.rarity.toUpperCase(), {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: rarityColor,
    }).setOrigin(0.5)
    container.add(rarityText)

    let statusText: Phaser.GameObjects.Text
    if (isEquipped) {
      statusText = this.add.text(0, 65, '✓ EQUIPPED', {
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        color: '#44ff44',
        fontStyle: 'bold',
      }).setOrigin(0.5)
    } else if (isUnlocked) {
      statusText = this.add.text(0, 65, 'TAP TO EQUIP', {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#88aaff',
      }).setOrigin(0.5)
    } else {
      statusText = this.add.text(0, 65, `🎫 ${skin.cost}`, {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#FFD700',
        fontStyle: 'bold',
      }).setOrigin(0.5)
    }
    container.add(statusText)

    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0).setInteractive({ useHandCursor: true })
    container.add(hitArea)

    hitArea.on('pointerdown', () => {
      this.audioManager.resume()
      this.onCardTap(skin, container, statusText, bg, width, height, isEquipped, isUnlocked)
    })

    hitArea.on('pointerover', () => container.setScale(1.05))
    hitArea.on('pointerout', () => container.setScale(1.0))

    return container
  }

  private onCardTap(
    skin: Skin,
    container: Phaser.GameObjects.Container,
    statusText: Phaser.GameObjects.Text,
    bg: Phaser.GameObjects.Graphics,
    cardWidth: number,
    cardHeight: number,
    wasEquipped: boolean,
    wasUnlocked: boolean
  ): void {
    void bg
    void cardWidth
    void cardHeight

    if (wasEquipped) return

    if (wasUnlocked) {
      SkinManager.equipSkin(skin.id)
      this.audioManager.playClick()
      this.refreshShop()
      return
    }

    const result = SkinManager.purchaseSkin(skin.id)
    if (result.success) {
      this.audioManager.playClick()
      this.ticketText.setText(`🎫 ${SkinManager.getTicketBalance()}`)
      this.refreshShop()
    } else {
      this.audioManager.playError()
      const originalX = container.x
      this.tweens.add({
        targets: container,
        x: originalX + 8,
        duration: 50,
        yoyo: true,
        repeat: 2,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          container.x = originalX
        },
      })
    }
  }

  private refreshShop(): void {
    this.cleanUp()
    this.scene.restart()
  }

  private cleanUp(): void {
    this.cardContainers.clear()
    this.audioManager.destroy()
  }
}
