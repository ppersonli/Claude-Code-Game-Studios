<script setup lang="ts">
import type { Ingredient } from '@types'
import { t } from '../i18n'

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
  <div class="shelf-wrapper">
    <div class="shelf-fade-right"></div>
    <div class="shelf">
      <div class="shelf-label">— {{ t('hud.shelfLabel') }} —</div>
      <div class="shelf-items">
      <div
        v-for="ing in ingredients"
        :key="ing.id"
        class="shelf-item"
        :class="{ locked: !isUnlocked(ing), unlocked: isUnlocked(ing) }"
        @click="isUnlocked(ing) ? emit('select', ing) : emit('unlock', ing)"
      >
        <div class="item-img-wrap">
          <img :src="ing.img" :alt="ing.name">
          <div v-if="!isUnlocked(ing)" class="lock-overlay">
            <span class="lock-icon">🔒</span>
          </div>
        </div>
        <span class="item-name">{{ t('ingredients.' + ing.id) || ing.name }}</span>
        <span v-if="!isUnlocked(ing)" class="lock-cost">💰{{ ing.unlockCost }}</span>
      </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.shelf-wrapper {
  position: relative;
  flex-shrink: 0;
}
.shelf-fade-right {
  position: absolute;
  right: 0; top: 0; bottom: 0; width: 40px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.6));
  pointer-events: none;
  z-index: 2;
}
.shelf {
  background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.35));
  backdrop-filter: blur(14px);
  padding: 8px 6px 14px;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.shelf::-webkit-scrollbar { display: none; }
.shelf-label {
  color: rgba(255,255,255,0.5);
  font-size: 0.7em;
  text-align: center;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: 600;
}
.shelf-items {
  display: inline-flex;
  gap: 10px;
  padding: 0 10px;
}
.shelf-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: transform 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  min-width: 64px;
}
.shelf-item:active { transform: scale(0.88); }

/* Unlocked items have subtle glow */
.shelf-item.unlocked .item-img-wrap {
  box-shadow: 0 0 8px rgba(255,215,0,0.2);
  border-radius: 14px;
}
.shelf-item.unlocked:active .item-img-wrap {
  box-shadow: 0 0 14px rgba(255,215,0,0.4);
}

/* Locked items are dimmed */
.shelf-item.locked {
  opacity: 0.45;
}

.item-img-wrap {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  transition: all 0.2s ease;
}
.shelf-item.unlocked .item-img-wrap {
  border-color: rgba(255,255,255,0.25);
}
.shelf-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.shelf-item.unlocked:active img {
  transform: scale(1.1);
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}
.lock-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.item-name {
  color: #fff;
  font-size: 0.72em;
  text-align: center;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
  font-weight: 500;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lock-cost {
  color: #ffd700;
  font-size: 0.7em;
  text-align: center;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
</style>
