/**
 * GameBoard.vue — 10x10 grid with drop-zone highlighting.
 */
<script setup lang="ts">
import { computed } from 'vue'
import type { Grid } from '../logic/grid'
import { canPlace } from '../logic/grid'
import { getKawaiiColor } from '../data/colors'

const props = defineProps<{
  grid: Grid
  previewMatrix?: number[][] | null
  previewRow?: number
  previewCol?: number
}>()

const emit = defineEmits<{
  (e: 'cell-click', row: number, col: number): void
}>()

function canPreviewFit(): boolean {
  if (!props.previewMatrix || props.previewRow == null || props.previewCol == null) return false
  return canPlace(props.grid, props.previewMatrix, props.previewRow, props.previewCol)
}

function isPreviewCell(r: number, c: number): boolean {
  if (!props.previewMatrix || props.previewRow == null || props.previewCol == null) return false
  const mr = r - props.previewRow
  const mc = c - props.previewCol
  return mr >= 0 && mr < props.previewMatrix.length
    && mc >= 0 && mc < (props.previewMatrix[0]?.length ?? 0)
    && props.previewMatrix[mr][mc] === 1
}

function cellColor(r: number, c: number): string | null {
  const val = props.grid[r][c]
  if (val === null) return null
  return getKawaiiColor(val).hex
}

function cellGlow(r: number, c: number): string | null {
  const val = props.grid[r][c]
  if (val === null) return null
  return getKawaiiColor(val).glow
}
</script>

<template>
  <div class="board" @pointerleave="">
    <template v-for="(row, r) in grid" :key="r">
      <div
        v-for="(cell, c) in row"
        :key="`${r}-${c}`"
        class="cell"
        :class="{
          'cell-filled': cell !== null,
          'cell-preview': isPreviewCell(r, c) && canPreviewFit(),
          'cell-preview-invalid': isPreviewCell(r, c) && !canPreviewFit(),
        }"
        :style="cell !== null ? {
          background: cellColor(r, c) || undefined,
          boxShadow: `0 0 6px ${cellGlow(r, c) || cellColor(r, c) || ''}`,
        } : {}"
        @click="emit('cell-click', r, c)"
      />
    </template>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  padding: 6px;
  background: rgba(245, 198, 208, 0.4);
  border-radius: 12px;
  width: min(88vw, 420px);
  aspect-ratio: 1;
  backdrop-filter: blur(4px);
}

.cell {
  aspect-ratio: 1;
  border-radius: 6px;
  background: rgba(250, 224, 230, 0.3);
  transition: background 0.1s, box-shadow 0.1s, transform 0.1s;
  cursor: pointer;
}

.cell-filled {
  transform: scale(0.95);
}

.cell-preview {
  background: rgba(255, 255, 255, 0.5) !important;
  box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.6);
}

.cell-preview-invalid {
  background: rgba(255, 0, 0, 0.3) !important;
  box-shadow: inset 0 0 8px rgba(255, 0, 0, 0.4);
}
</style>
