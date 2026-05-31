<script setup lang="ts">
import type { Ingredient } from '@types'

const props = defineProps<{
  ingredients: readonly Ingredient[]
  unlockedIds: readonly string[]
}>()

const emit = defineEmits<{
  select: [ingredient: Ingredient]
  unlock: [ingredient: Ingredient]
}>()

function isUnlocked(ing: Ingredient): boolean {
  return !ing.locked || props.unlockedIds.includes(ing.id)
}
</script>

<template>
  <div class="ingredient-shelf">
    <div
      v-for="ing in ingredients"
      :key="ing.id"
      class="shelf-item"
      :class="{ locked: !isUnlocked(ing) }"
      @click="isUnlocked(ing) ? emit('select', ing) : emit('unlock', ing)"
    >
      <img :src="ing.img" :alt="ing.name">
      <span class="item-name">{{ ing.name }}</span>
      <span v-if="!isUnlocked(ing)" class="lock-cost">💰{{ ing.unlockCost }}</span>
    </div>
  </div>
</template>

<style scoped>
.ingredient-shelf {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 8px;
  -webkit-overflow-scrolling: touch;
}
.shelf-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255,255,255,0.9);
  cursor: pointer;
  transition: transform 0.15s;
}
.shelf-item:active { transform: scale(0.92); }
.shelf-item.locked { opacity: 0.5; background: rgba(200,200,200,0.5); }
.shelf-item img { width: 40px; height: 40px; object-fit: contain; }
.item-name { font-size: 11px; margin-top: 4px; color: #333; }
.lock-cost { font-size: 10px; color: #e67e22; }
</style>
