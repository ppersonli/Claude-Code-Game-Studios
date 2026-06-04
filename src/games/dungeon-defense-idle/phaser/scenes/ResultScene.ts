import Phaser from 'phaser'

export interface ResultSceneData {
  wave: number
  goldEarned: number
  kills: number
  onPlayAgain: () => void
  onWatchAd: () => void
}

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }) }

  create(data: ResultSceneData): void {
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a, 0.95)
    this.add.text(width / 2, 80, 'WAVE COMPLETE', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '24px', color: '#00e5ff',
    }).setOrigin(0.5)

    const stats = [
      { label: 'Wave', value: data.wave.toString() },
      { label: 'Gold Earned', value: data.goldEarned.toLocaleString() },
      { label: 'Kills', value: data.kills.toString() },
    ]
    stats.forEach((s, i) => {
      const y = 140 + i * 50
      this.add.text(60, y, s.label, {
        fontFamily: 'Exo 2, sans-serif', fontSize: '14px', color: 'rgba(255,255,255,0.7)',
      })
      this.add.text(width - 60, y, s.value, {
        fontFamily: 'Orbitron, sans-serif', fontSize: '16px', color: '#ffd740',
      }).setOrigin(1, 0)
    })

    // Continue button
    const btn = this.add.container(width / 2, 340)
    const bg = this.add.graphics()
    bg.fillStyle(0x00e5ff, 0.85)
    bg.fillRoundedRect(-100, -22, 200, 44, 10)
    btn.add(bg)
    btn.add(this.add.text(0, 0, 'CONTINUE', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#ffffff',
    }).setOrigin(0.5))
    const hit = this.add.zone(0, 0, 200, 44).setInteractive({ useHandCursor: true })
    hit.on('pointerdown', () => data.onPlayAgain())
    btn.add(hit)
  }
}
