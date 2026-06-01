/**
 * MenuScene.vue — Main menu for Number Merge 2048.
 */
<script setup lang="ts">
defineEmits<{
  (e: 'new-game'): void
  (e: 'continue'): void
  (e: 'daily'): void
  (e: 'themes'): void
}>()

defineProps<{
  hasSave: boolean
  bestScore: number
}>()
</script>

<template>
  <div class="menu">
    <div class="title-area">
      <h1 class="title">2048</h1>
      <p class="subtitle">數字合併 ✨</p>
    </div>
    <div class="best-display" v-if="bestScore > 0">
      最高分：{{ bestScore }}
    </div>
    <div class="buttons">
      <button class="btn btn-primary" @click="$emit('new-game')">
        🎮 開始遊戲
      </button>
      <button v-if="hasSave" class="btn btn-continue" @click="$emit('continue')">
        ▶️ 繼續遊戲
      </button>
      <button class="btn btn-secondary" @click="$emit('daily')">
        🎁 每日獎勵
      </button>
      <button class="btn btn-secondary" @click="$emit('themes')">
        🎨 主題商店
      </button>
    </div>
    <p class="hint">滑動或方向鍵移動方塊</p>
  </div>
</template>

<style scoped>
.menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.title-area {
  text-align: center;
}

.title {
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FF69B4, #FFD700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
}

.subtitle {
  font-size: 1.2rem;
  color: #888;
  margin: 4px 0 0;
}

.best-display {
  background: rgba(255, 105, 180, 0.15);
  padding: 6px 20px;
  border-radius: 20px;
  font-weight: 700;
  color: #FF69B4;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 280px;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn:active {
  transform: scale(0.96);
}

.btn-primary {
  background: linear-gradient(135deg, #FF69B4, #FF1493);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
}

.btn-continue {
  background: linear-gradient(135deg, #4FC3F7, #0288D1);
  color: #fff;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.8);
  color: #555;
  backdrop-filter: blur(4px);
}

.hint {
  color: #aaa;
  font-size: 0.8rem;
  margin-top: 8px;
}
</style>
