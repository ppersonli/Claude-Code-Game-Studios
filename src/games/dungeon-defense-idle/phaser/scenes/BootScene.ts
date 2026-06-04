import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }) }

  create(): void {
    const { width, height } = this.scale
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#00e5ff',
    }).setOrigin(0.5)
    this.time.delayedCall(200, () => this.scene.start('GameScene'))
  }
}
