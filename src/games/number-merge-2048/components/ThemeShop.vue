/**
 * ThemeShop.vue — Theme shop overlay.
 */
<script setup lang="ts">
import { getMergeThemeById, type Merge2048Theme } from '../data/themes'

defineEmits<{
  (e: 'buy', themeId: string): void
  (e: 'equip', themeId: string): void
  (e: 'close'): void
}>()

defineProps<{
  themes: { theme: Merge2048Theme; unlocked: boolean; canBuy: boolean }[]
  equippedTheme: string
  coins: number
}>()
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="card">
      <div class="header">
        <h2 class="title">🎨 主題商店</h2>
        <div class="coins">🪙 {{ coins }}</div>
      </div>
      <div class="theme-list">
        <div
          v-for="item in themes"
          :key="item.theme.id"
          class="theme-item"
          :class="{ equipped: equippedTheme === item.theme.id }"
        >
          <div
            class="theme-preview"
            :style="{ background: item.theme.bgTop }"
          >
            <span class="theme-emoji">{{ item.theme.emoji }}</span>
          </div>
          <div class="theme-info">
            <div class="theme-name">{{ item.theme.name }}</div>
            <div class="theme-desc">{{ item.theme.description }}</div>
          </div>
          <div class="theme-action">
            <button
              v-if="item.unlocked && equippedTheme === item.theme.id"
              class="btn-equipped"
              disabled
            >
              使用中
            </button>
            <button
              v-else-if="item.unlocked"
              class="btn-equip"
              @click="$emit('equip', item.theme.id)"
            >
              使用
            </button>
            <button
              v-else-if="item.canBuy"
              class="btn-buy"
              @click="$emit('buy', item.theme.id)"
            >
              🪙 {{ item.theme.cost }}
            </button>
            <button v-else class="btn-locked" disabled>
              🔒 {{ item.theme.cost }}
            </button>
          </div>
        </div>
      </div>
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
  padding: 24px;
  max-width: 360px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: pop-in 0.3s ease-out;
}

@keyframes pop-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #333;
  margin: 0;
}

.coins {
  font-weight: 700;
  color: #FFD700;
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.theme-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background: #f8f8f8;
  transition: background 0.2s;
}

.theme-item.equipped {
  background: rgba(255, 105, 180, 0.1);
  border: 2px solid #FF69B4;
}

.theme-preview {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-emoji {
  font-size: 1.2rem;
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #333;
}

.theme-desc {
  font-size: 0.7rem;
  color: #888;
}

.theme-action button {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-equipped {
  background: #FF69B4;
  color: #fff;
}

.btn-equip {
  background: #4FC3F7;
  color: #fff;
}

.btn-buy {
  background: #FFD700;
  color: #333;
}

.btn-locked {
  background: #ddd;
  color: #999;
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
  transition: transform 0.1s;
}

.btn:active {
  transform: scale(0.96);
}

.btn-close {
  background: #f0f0f0;
  color: #888;
}
</style>
