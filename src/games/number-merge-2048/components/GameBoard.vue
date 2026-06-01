/**
 * GameBoard.vue — 4×4 grid with touch swipe + keyboard support.
 * Pure Vue rendering (no Phaser), kawaii tile styles.
 */
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Grid, Direction, Tile } from '../logic/grid'
import { slideGrid, spawnTile, clearAnimations } from '../logic/grid'
import { getTileStyle } from '../data/tile-colors'

const props = defineProps<{ grid: Grid; score: number; bestScore: number }>()
const emit = defineEmits<{
  (e: 'move', direction: Direction): void
  (e: 'new-game'): void
}>()

// Touch tracking
const touchStart = ref<{ x: number; y: number } | null>(null)
const SWIPE_THRESHOLD = 30

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd(e: TouchEvent) {
  if (!touchStart.value) return
  const touch = e.changedTouches[0]
  const dx = touch.clientX - touchStart.value.x
  const dy = touch.clientY - touchStart.value.y
  touchStart.value = null

  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return

  if (Math.abs(dx) > Math.abs(dy)) {
    emit('move', dx > 0 ? 'right' : 'left')
  } else {
    emit('move', dy > 0 ? 'down' : 'up')
  }
}

// Keyboard support
function handleKeydown(e: KeyboardEvent) {
  const keyMap: Record<string, Direction> = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
  }
  const dir = keyMap[e.key]
  if (dir) {
    e.preventDefault()
    emit('move', dir)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function tileClasses(tile: Tile | null): string[] {
  if (!tile) return ['tile-empty']
  const classes = ['tile']
  if (tile.isNew) classes.push('tile-new')
  if (tile.mergedFrom) classes.push('tile-merged')
  return classes
}

function tileStyle(tile: Tile | null): Record<string, string> {
  if (!tile) return {}
  const s = getTileStyle(tile.value)
  const style: Record<string, string> = {
    background: s.bg,
    color: s.color,
    fontSize: s.fontSize,
  }
  if (s.glow) style.boxShadow = s.glow
  return style
}
</script>

<template>
  <div class="board-container">
    <div class="header">
      <div class="score-box">
        <div class="score-label">SCORE</div>
        <div class="score-value">{{ score }}</div>
      </div>
      <div class="score-box best">
        <div class="score-label">BEST</div>
        <div class="score-value">{{ bestScore }}</div>
      </div>
    </div>
    <div
      class="grid"
      @touchstart.passive="handleTouchStart"
      @touchend.passive="handleTouchEnd"
    >
      <template v-for="(row, r) in grid" :key="r">
        <div
          v-for="(tile, c) in row"
          :key="`${r}-${c}-${tile?.id ?? 'e'}`"
          :class="tileClasses(tile)"
          :style="tileStyle(tile)"
          class="cell"
        >
          <span v-if="tile" class="tile-value">{{ tile.value }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.header {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 380px;
}

.score-box {
  flex: 1;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 8px 16px;
  text-align: center;
  backdrop-filter: blur(4px);
}

.score-box.best {
  background: rgba(255, 105, 180, 0.2);
}

.score-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #333;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px;
  background: rgba(245, 198, 208, 0.5);
  border-radius: 16px;
  width: min(90vw, 380px);
  aspect-ratio: 1;
  backdrop-filter: blur(4px);
  touch-action: none;
}

.cell {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  background: rgba(250, 224, 230, 0.4);
  transition: all 0.12s ease;
}

.tile {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.tile-empty {
  width: 100%;
  height: 100%;
}

.tile-new {
  animation: tile-appear 0.2s ease-out;
}

.tile-merged {
  animation: tile-pop 0.2s ease-out;
}

@keyframes tile-appear {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes tile-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
