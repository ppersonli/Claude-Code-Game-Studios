/** ResultScene — End-of-session summary with stats + optional ad prompt */

import Phaser from 'phaser'

export interface ResultSceneData {
  coinsEarned: number
  itemsProduced: number
  upgradesMade: number
  prestigeCount: number
  starDust: number
  onPlayAgain: () => void
  onWatchAd: () => void
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' })
  }

  create(data: ResultSceneData): void {
    const { width, height } = this.scale

    // Dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b2a, 0.95)

    // Title
    this.add.text(width / 2, 80, '📊 SESSION SUMMARY', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '22px', color: '#00e5ff',
    }).setOrigin(0.5)

    // Stats
    const stats = [
      { icon: '💰', label: 'Coins Earned', value: this.fmt(data.coinsEarned) },
      { icon: '🏭', label: 'Items Produced', value: data.itemsProduced.toLocaleString() },
      { icon: '⬆️', label: 'Upgrades Made', value: data.upgradesMade.toString() },
      { icon: '⭐', label: 'Star Dust', value: data.starDust.toString() },
    ]

    stats.forEach((s, i) => {
      const y = 140 + i * 60
      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a4e, 1)
      bg.fillRoundedRect(40, y, width - 80, 48, 10)

      this.add.text(60, y + 12, `${s.icon}  ${s.label}`, {
        fontFamily: 'Exo 2, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)',
      })
      this.add.text(width - 60, y + 12, s.value, {
        fontFamily: 'Orbitron, sans-serif', fontSize: '16px', color: '#ffd740',
      }).setOrigin(1, 0)
    })

    // Play Again button
    const btnY = 400
    this.createBtn(width / 2, btnY, 200, 44, '🔄 PLAY AGAIN', 0x00e5ff, () => {
      data.onPlayAgain()
    })

    // Watch Ad button
    this.createBtn(width / 2, btnY + 56, 200, 44, '📺 WATCH AD ×2', 0xff4081, () => {
      data.onWatchAd()
    })
  }

  private createBtn(x: number, y: number, w: number, h: number, label: string, color: number, onClick: () => void): void {
    const btn = this.add.container(x, y)
    const bg = this.add.graphics()
    bg.fillStyle(color, 0.85)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10)
    btn.add(bg)

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5)
    btn.add(txt)

    const hit = this.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true })
    hit.on('pointerdown', () => {
      btn.setScale(0.92)
      this.time.delayedCall(100, () => { btn.setScale(1); onClick() })
    })
    btn.add(hit)
  }

  private fmt(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
    return n.toLocaleString()
  }
}
