/**
 * DailyReward.vue — Daily reward popup with coins.
 */
<script setup lang="ts">
defineEmits<{
  (e: 'claim'): void
  (e: 'close'): void
}>()

defineProps<{
  available: boolean
  coins: number
}>()
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="card">
      <div class="icon">🎁</div>
      <h2 class="title">每日獎勵</h2>
      <template v-if="available">
        <p class="reward-text">獲得 <strong>{{ coins }}</strong> 金幣！</p>
        <button class="btn btn-claim" @click="$emit('claim')">領取獎勵</button>
      </template>
      <template v-else>
        <p class="claimed-text">今天已經領取過了 ✅</p>
        <p class="hint">明天再來吧！</p>
      </template>
      <button class="btn btn-close" @click="$emit('close')">關閉</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
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
  max-width: 300px;
  width: 90%;
  animation: pop-in 0.3s ease-out;
}

@keyframes pop-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.icon {
  font-size: 3rem;
  margin-bottom: 8px;
}

.title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #333;
  margin: 0 0 12px;
}

.reward-text {
  font-size: 1.1rem;
  color: #555;
  margin: 0 0 16px;
}

.reward-text strong {
  color: #FFD700;
  font-size: 1.4rem;
}

.claimed-text {
  font-size: 1rem;
  color: #4CAF50;
  margin: 0 0 8px;
}

.hint {
  font-size: 0.8rem;
  color: #aaa;
  margin: 0 0 16px;
}

.btn {
  display: block;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.1s;
}

.btn:active {
  transform: scale(0.96);
}

.btn-claim {
  background: linear-gradient(135deg, #FFD700, #FF9800);
  color: #fff;
}

.btn-close {
  background: #f0f0f0;
  color: #888;
}
</style>
