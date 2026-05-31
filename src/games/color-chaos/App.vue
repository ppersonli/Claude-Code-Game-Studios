<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import { LevelSelectScene } from './scenes/LevelSelectScene'
import { ShopScene } from './scenes/ShopScene'
import { AdManager } from './services/AdManager'
import LevelCompleteOverlay from './components/LevelCompleteOverlay.vue'
import SocialPanel from '@shared/vue/SocialPanel.vue'
import type { LevelConfig } from './core/GameState'

const gameContainer = ref<HTMLDivElement | null>(null)
const showOverlay = ref(false)
const overlayData = ref({
  level: 0,
  stars: 0,
  moves: 0,
  optimal: 0,
  ticketsEarned: 0,
})

let game: Phaser.Game | null = null

onMounted(() => {
  // Initialize AdManager
  const adManager = AdManager.getInstance()
  adManager.init()

  if (!gameContainer.value) return

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: gameContainer.value,
    backgroundColor: '#1a1a2e',
    scene: [LevelSelectScene, GameScene, ShopScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
  }

  game = new Phaser.Game(config)
})

onUnmounted(() => {
  if (game) {
    game.destroy(true)
    game = null
  }
})

function handleNextLevel() {
  showOverlay.value = false
}

function handleRestart() {
  showOverlay.value = false
}

function handleLevelSelect() {
  showOverlay.value = false
}
</script>

<template>
  <div class="game-wrapper">
    <div ref="gameContainer" id="game-container"></div>
    <LevelCompleteOverlay
      v-if="showOverlay"
      :level="overlayData.level"
      :stars="overlayData.stars"
      :moves="overlayData.moves"
      :optimal="overlayData.optimal"
      :tickets-earned="overlayData.ticketsEarned"
      @next-level="handleNextLevel"
      @restart="handleRestart"
      @level-select="handleLevelSelect"
    />
    <SocialPanel game-name="色彩混乱" game-slug="color-chaos" share-text="来挑战色彩排序吧！100关等你来！" />
  </div>
</template>

<style scoped>
.game-wrapper {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0a0a1a;
  overflow: hidden;
}

#game-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
}
</style>
