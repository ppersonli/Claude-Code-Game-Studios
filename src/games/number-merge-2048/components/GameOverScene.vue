/**
 * GameOverScene.vue — Shown when no moves remain.
 */
<script setup lang="ts">
defineEmits<{
  (e: 'new-game'): void
  (e: 'share'): void
}>()

defineProps<{
  score: number
  bestScore: number
  isNewBest: boolean
  highestTile: number
}>()
</script>

<template>
  <div class="overlay">
    <div class="card">
      <h2 class="title">遊戲結束</h2>
      <div v-if="isNewBest" class="new-best">🎉 新紀錄！</div>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">得分</div>
          <div class="stat-value">{{ score }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">最高方塊</div>
          <div class="stat-value">{{ highestTile }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">最高分</div>
          <div class="stat-value">{{ bestScore }}</div>
        </div>
      </div>
      <div class="buttons">
        <button class="btn btn-primary" @click="$emit('new-game')">
          🔄 再來一局
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  max-width: 340px;
  width: 90%;
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #333;
  margin: 0 0 8px;
}

.new-best {
  color: #FFD700;
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 12px;
}

.stats {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.stat {
  flex: 1;
  background: #f8f8f8;
  border-radius: 12px;
  padding: 10px 4px;
}

.stat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #888;
  font-weight: 600;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 800;
  color: #333;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.btn {
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn:active {
  transform: scale(0.96);
}

.btn-primary {
  background: linear-gradient(135deg, #FF69B4, #FF1493);
  color: #fff;
}
</style>
