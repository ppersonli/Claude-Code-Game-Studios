<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { AdManager } from '../../services/AdManager'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './scenes/MenuScene'
import { LevelSelectScene } from './scenes/LevelSelectScene'

const gameContainer = ref<HTMLDivElement | null>(null)
const adManager = AdManager.getInstance()
let game: Phaser.Game | null = null

adManager.setAdCallbacks(
  () => { if (game) game.scene.pause('GameScene') },
  () => { if (game) game.scene.resume('GameScene') },
)

onMounted(() => {
  if (!gameContainer.value) return

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 480,
    height: 854,
    parent: gameContainer.value,
    backgroundColor: '#FFF5E6',
    scene: [MenuScene, LevelSelectScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  }

  game = new Phaser.Game(config)
  adManager.gameplayStart()
})

onUnmounted(() => {
  adManager.gameplayStop()
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<template>
  <div class="game-wrapper">
    <div ref="gameContainer" id="game-container"></div>
  </div>
</template>

<style scoped>
.game-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #FFF5E6;
  overflow: hidden;
}

#game-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
}
</style>
