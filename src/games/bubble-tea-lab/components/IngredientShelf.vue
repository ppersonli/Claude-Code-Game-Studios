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
  <div class="shelf">
    <div class="shelf-label">— 食材架 —</div>
    <div class="shelf-items">
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
  </div>
</template>

<style scoped>
.shelf {
  background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2));
  backdrop-filter: blur(10px);
  padding: 8px 6px 14px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 0;
}
.shelf::-webkit-scrollbar { display: none; }
.shelf-label {
  color: rgba(255,255,255,0.6);
  font-size: 0.65em;
  text-align: center;
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.shelf-items {
  display: inline-flex;
  gap: 8px;
  padding: 0 6px;
}
.shelf-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
  position: relative;
}
.shelf-item:active { transform: scale(0.9); }
.shelf-item.locked { opacity: 0.5; }
.shelf-item.locked::after {
  content: '🔒';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2em;
  z-index: 2;
}
.shelf-item img {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  transition: all 0.2s;
}
.item-name {
  color: #fff;
  font-size: 0.6em;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.lock-cost {
  color: #ffd700;
  font-size: 0.55em;
  text-align: center;
}
</style>
