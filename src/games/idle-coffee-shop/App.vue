<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'

const gameContainer = ref<HTMLDivElement | null>(null)
let game: Phaser.Game | null = null

onMounted(() => {
  if (!gameContainer.value) return
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.CANVAS,
    width: 480,
    height: 854,
    parent: gameContainer.value,
    backgroundColor: '#3E2723',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
  }
  game = new Phaser.Game(config)
})

onUnmounted(() => {
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
  background: #3e2723;
  overflow: hidden;
}

#game-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
}
</style>
