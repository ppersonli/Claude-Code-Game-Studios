<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createPhaserGame } from './phaser/config'

const gameContainer = ref<HTMLElement | null>(null)
let game: Phaser.Game | null = null

onMounted(() => {
  if (gameContainer.value) {
    game = createPhaserGame(gameContainer.value)
  }
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})
</script>

<template>
  <div ref="gameContainer" class="boba-drop-container"></div>
</template>

<style scoped>
.boba-drop-container {
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #1a0a2e;
}
</style>
