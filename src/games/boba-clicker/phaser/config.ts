import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    width: 480,
    height: 854,
    parent,
    backgroundColor: '#1a0a2e',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [GameScene],
  })
}
