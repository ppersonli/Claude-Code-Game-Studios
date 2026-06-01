<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { AdManager } from '../../services/AdManager'
import { createPhaserGame } from './phaser/config'
const gameContainer = ref<HTMLElement | null>(null)
const adManager = AdManager.getInstance()
let game: Phaser.Game | null = null
adManager.setAdCallbacks(
  () => { if (game) game.scene.pause('GameScene') },
  () => { if (game) game.scene.resume('GameScene') },
)
onMounted(() => { if (gameContainer.value) { game = createPhaserGame(gameContainer.value); adManager.gameplayStart() } })
onUnmounted(() => { adManager.gameplayStop(); if (game) { game.destroy(true); game = null } })
</script>
<template><div ref="gameContainer" class="td-container"></div></template>
<style scoped>.td-container { width: 100%; height: 100dvh; overflow: hidden; background: #1a2e1a; }</style>
