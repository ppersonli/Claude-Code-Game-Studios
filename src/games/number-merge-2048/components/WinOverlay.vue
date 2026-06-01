/**
 * WinOverlay.vue — Shown when player reaches 2048.
 */
<script setup lang="ts">
defineEmits<{
  (e: 'keep-playing'): void
  (e: 'new-game'): void
}>()

defineProps<{
  score: number
}>()
</script>

<template>
  <div class="overlay">
    <div class="card">
      <div class="crown">👑</div>
      <h2 class="title">2048！</h2>
      <p class="subtitle">恭喜你達成 2048！</p>
      <div class="score">得分：{{ score }}</div>
      <div class="buttons">
        <button class="btn btn-primary" @click="$emit('keep-playing')">
          🚀 繼續挑戰
        </button>
        <button class="btn btn-secondary" @click="$emit('new-game')">
          🔄 新遊戲
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

.crown {
  font-size: 3rem;
  margin-bottom: 8px;
}

.title {
  font-size: 2rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FFD700, #FF6F00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 4px;
}

.subtitle {
  color: #888;
  margin: 0 0 12px;
}

.score {
  font-size: 1.2rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 20px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  background: linear-gradient(135deg, #FFD700, #FF6F00);
  color: #fff;
}

.btn-secondary {
  background: #f0f0f0;
  color: #555;
}
</style>
