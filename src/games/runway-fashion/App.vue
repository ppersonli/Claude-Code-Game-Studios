<template>
  <div id="game-container" class="game-wrapper"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { createGameConfig } from './phaser/config'

let game: Phaser.Game | null = null

onMounted(() => {
  game = new Phaser.Game(createGameConfig('game-container'))
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<style scoped>
.game-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2d1b4e 0%, #1a0a2e 100%);
}
</style>
