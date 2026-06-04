import Phaser from 'phaser'
import type { GameState } from '../../logic/game-state'

/** Data passed from Vue into BootScene → GameScene */
export interface GameCallbacks {
  getState: () => GameState
  onStroke: (levelId: number, strokes: number) => void
  onBallStopped: () => void
  onLevelComplete: (levelId: number, strokes: number, stars: boolean[]) => void
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  init(data: GameCallbacks): void {
    // Store callbacks in registry so all scenes can access them
    this.registry.set('callbacks', data)
  }

  preload(): void {
    const base = `${import.meta.env.BASE_URL}assets/bounce-golf/`
    this.load.image('ball', `${base}ball.webp`)
    this.load.image('hole', `${base}hole.webp`)
    this.load.image('bg-game', `${base}bg-game.webp`)
  }

  create(): void {
    this.scene.start('GameScene')
  }
}
