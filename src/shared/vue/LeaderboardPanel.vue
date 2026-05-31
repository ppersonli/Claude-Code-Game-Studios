<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { LeaderboardManager, type LeaderboardEntry } from '../../services/LeaderboardManager'

const props = defineProps<{
  gameSlug: string
  gameName: string
}>()

const visible = ref(false)
const entries = ref<LeaderboardEntry[]>([])
const bestScore = ref(0)

const manager = new LeaderboardManager({ gameSlug: props.gameSlug })

function refresh() {
  entries.value = manager.getTopScores()
  bestScore.value = manager.getBestScore()
}

function toggle() {
  visible.value = !visible.value
  if (visible.value) refresh()
}

onMounted(refresh)

defineExpose({ refresh, submitScore: (score: number) => manager.submitScore(score) })
</script>

<template>
  <div class="lb-panel">
    <button class="lb-toggle" @click="toggle" title="排行榜">
      {{ visible ? '✕' : '🏆' }}
    </button>
    <div v-if="visible" class="lb-content">
      <h3 class="lb-title">🏆 排行榜</h3>
      <div v-if="bestScore > 0" class="lb-best">
        最高分: {{ bestScore }}
      </div>
      <div v-if="entries.length === 0" class="lb-empty">
        暂无记录，开始游戏吧！
      </div>
      <div v-else class="lb-entries">
        <div
          v-for="(entry, i) in entries"
          :key="i"
          class="lb-entry"
          :class="{ 'lb-top': i < 3 }"
        >
          <span class="lb-rank">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) }}</span>
          <span class="lb-score">{{ entry.score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lb-panel {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.lb-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.lb-toggle:hover { background: rgba(0, 0, 0, 0.6); }
.lb-content {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 12px;
  min-width: 160px;
  max-height: 300px;
  overflow-y: auto;
}
.lb-title {
  font-size: 14px;
  color: #FFD700;
  margin: 0 0 8px 0;
  text-align: center;
}
.lb-best {
  font-size: 12px;
  color: #66BB6A;
  text-align: center;
  margin-bottom: 8px;
}
.lb-empty {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 12px 0;
}
.lb-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.lb-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: #fff;
}
.lb-entry.lb-top {
  background: rgba(255, 215, 0, 0.15);
}
.lb-rank { min-width: 24px; }
.lb-score { font-weight: 700; color: #FFD700; }
</style>
