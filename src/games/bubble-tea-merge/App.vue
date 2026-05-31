<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { AdManager } from '../../services/AdManager'
import { createPhaserGame } from './phaser/config'
import SocialPanel from '@shared/vue/SocialPanel.vue'
import LeaderboardPanel from '@shared/vue/LeaderboardPanel.vue'

const gameContainer = ref<HTMLElement | null>(null)
const adManager = AdManager.getInstance()
let game: Phaser.Game | null = null

adManager.setAdCallbacks(
  () => { if (game) game.scene.pause('GameScene') },
  () => { if (game) game.scene.resume('GameScene') },
)

onMounted(() => {
  if (gameContainer.value) {
    game = createPhaserGame(gameContainer.value)
    adManager.gameplayStart()
  }
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
  <div ref="gameContainer" class="merge-container"></div>
  <SocialPanel game-name="奶茶合成大作战" game-slug="bubble-tea-merge" share-text="来合成水晶波波吧！超好玩的奶茶合成游戏！" />
  <LeaderboardPanel game-slug="bubble-tea-merge" game-name="奶茶合成大作战" />
</template>

<style scoped>
.merge-container {
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #1a0a2e;
}
</style>
