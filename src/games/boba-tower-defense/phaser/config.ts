import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../logic/constants'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { ResultScene } from './scenes/ResultScene'

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    width: GAME_W,
    height: GAME_H,
    parent,
    backgroundColor: '#1a2e1a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, MenuScene, GameScene, ResultScene],
  })
}
