<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Phaser from 'phaser'
import { AdManager } from '../../services/AdManager'
import { GameScene } from './scenes/GameScene'
import { GAME_W, GAME_H } from './core'
import SocialPanel from '@shared/vue/SocialPanel.vue'
import LeaderboardPanel from '@shared/vue/LeaderboardPanel.vue'

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
    type: Phaser.CANVAS,
    width: GAME_W,
    height: GAME_H,
    parent: gameContainer.value,
    backgroundColor: '#1a0a2e',
    scene: [GameScene],
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
    <SocialPanel game-name="果冻消消" game-slug="jelly-pop" share-text="来消除果冻吧！超爽的三消游戏！" />
    <LeaderboardPanel game-slug="jelly-pop" game-name="果冻消消" />
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
