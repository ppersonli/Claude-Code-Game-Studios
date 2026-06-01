/**
 * ScoreDisplay.vue — Score + combo indicator.
 */
<script setup lang="ts">
defineProps<{
  score: number
  bestScore: number
  combo: number
}>()
</script>

<template>
  <div class="display">
    <div class="score-box">
      <div class="label">SCORE</div>
      <div class="value">{{ score }}</div>
    </div>
    <div class="combo-box" v-if="combo > 0">
      <div class="combo-value">x{{ combo >= 9 ? 5 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1.5 }}</div>
      <div class="combo-label">COMBO</div>
    </div>
    <div class="score-box best">
      <div class="label">BEST</div>
      <div class="value">{{ bestScore }}</div>
    </div>
  </div>
</template>

<style scoped>
.display {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  max-width: 420px;
}

.score-box {
  flex: 1;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 12px;
  padding: 6px 12px;
  text-align: center;
  backdrop-filter: blur(4px);
}

.score-box.best {
  background: rgba(255, 105, 180, 0.15);
}

.label {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
}

.value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #333;
}

.combo-box {
  background: linear-gradient(135deg, #FFD700, #FF9800);
  border-radius: 12px;
  padding: 6px 12px;
  text-align: center;
  animation: combo-pulse 0.4s ease;
}

@keyframes combo-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.combo-value {
  font-size: 1.2rem;
  font-weight: 900;
  color: #fff;
}

.combo-label {
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
}
</style>
