/** Phaser game configuration — idle/farm, no physics needed */

import Phaser from 'phaser'

export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 480,
    height: 854,
    backgroundColor: '#0a1a0a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [],
  }
}
