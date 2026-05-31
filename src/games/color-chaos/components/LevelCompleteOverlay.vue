<script setup lang="ts">
defineProps<{
  level: number
  stars: number
  moves: number
  optimal: number
  ticketsEarned: number
}>()

const emit = defineEmits<{
  'next-level': []
  'restart': []
  'level-select': []
}>()

function getStarString(stars: number): string {
  switch (stars) {
    case 3: return '⭐⭐⭐'
    case 2: return '⭐⭐'
    case 1: return '⭐'
    default: return '☆'
  }
}
</script>

<template>
  <div class="overlay">
    <div class="complete-card">
      <h2 class="title">🎉 Level Complete!</h2>
      <div class="stars">{{ getStarString(stars) }}</div>
      <div class="stats">
        <span>{{ moves }} moves</span>
        <span class="target">(target: {{ optimal }})</span>
      </div>
      <div class="tickets">🎫 +{{ ticketsEarned }} tickets</div>
      <div class="actions">
        <button class="btn btn-next" @click="emit('next-level')">NEXT LEVEL</button>
        <button class="btn btn-restart" @click="emit('restart')">RESTART</button>
        <button class="btn btn-select" @click="emit('level-select')">LEVEL SELECT</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.complete-card {
  background: #1a1a2e;
  border: 2px solid #4488ff;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  color: #fff;
  min-width: 280px;
}

.title {
  font-size: 28px;
  color: #FFD700;
  margin-bottom: 16px;
}

.stars {
  font-size: 36px;
  margin-bottom: 12px;
}

.stats {
  font-size: 16px;
  color: #cccccc;
  margin-bottom: 8px;
}

.target {
  color: #888888;
  font-size: 13px;
}

.tickets {
  font-size: 15px;
  color: #FFD700;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.15s;
}

.btn:active {
  transform: scale(0.95);
}

.btn-next {
  background: #44ff44;
  color: #000;
}

.btn-restart {
  background: #ff8844;
  color: #fff;
}

.btn-select {
  background: #88aaff;
  color: #fff;
}
</style>
