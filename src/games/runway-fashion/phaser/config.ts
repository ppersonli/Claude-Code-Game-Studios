import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../data/constants'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { ThemeSelectScene } from './scenes/ThemeSelectScene'
import { DressUpScene } from './scenes/DressUpScene'
import { RunwayScene } from './scenes/RunwayScene'
import { ResultScene } from './scenes/ResultScene'

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#1a0a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MenuScene, ThemeSelectScene, DressUpScene, RunwayScene, ResultScene],
  }
}
