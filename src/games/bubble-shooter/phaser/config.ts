import Phaser from 'phaser'
import { GAME_W, GAME_H } from '../logic/constants'
import { LevelSelectScene } from './scenes/LevelSelectScene'
import { GameScene } from './scenes/GameScene'
import { ResultScene } from './scenes/ResultScene'

export function createPhaserGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.CANVAS,
    width: GAME_W,
    height: GAME_H,
    parent,
    backgroundColor: '#2d1b4e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [LevelSelectScene, GameScene, ResultScene],
  })
}
