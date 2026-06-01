/**
 * ThemeShop.vue — Theme shop overlay.
 */
<script setup lang="ts">
import type { BlastTheme } from '../data/themes'

defineEmits<{
  (e: 'buy', themeId: string): void
  (e: 'equip', themeId: string): void
  (e: 'close'): void
}>()

defineProps<{
  themes: { theme: BlastTheme; unlocked: boolean; canBuy: boolean }[]
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
          <div class="theme-preview" :style="{ background: item.theme.bgTop }">
            <span class="theme-emoji">{{ item.theme.emoji }}</span>
          </div>
          <div class="theme-info">
            <div class="theme-name">{{ item.theme.name }}</div>
            <div class="theme-desc">{{ item.theme.description }}</div>
          </div>
          <div class="theme-action">
            <button v-if="item.unlocked && equippedTheme === item.theme.id" class="btn-equipped" disabled>使用中</button>
            <button v-else-if="item.unlocked" class="btn-equip" @click="$emit('equip', item.theme.id)">使用</button>
            <button v-else-if="item.canBuy" class="btn-buy" @click="$emit('buy', item.theme.id)">🪙 {{ item.theme.cost }}</button>
            <button v-else class="btn-locked" disabled>🔒 {{ item.theme.cost }}</button>
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
  padding: 20px;
  max-width: 340px;
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
  margin-bottom: 12px;
}

.title { font-size: 1.2rem; font-weight: 800; color: #333; margin: 0; }
.coins { font-weight: 700; color: #FFD700; }

.theme-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }

.theme-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  background: #f8f8f8;
}

.theme-item.equipped {
  background: rgba(255, 105, 180, 0.1);
  border: 2px solid #FF69B4;
}

.theme-preview {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.theme-emoji { font-size: 1.1rem; }
.theme-info { flex: 1; min-width: 0; }
.theme-name { font-weight: 700; font-size: 0.8rem; color: #333; }
.theme-desc { font-size: 0.65rem; color: #888; }

.theme-action button {
  padding: 5px 10px;
  border: none;
  border-radius: 7px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-equipped { background: #FF69B4; color: #fff; }
.btn-equip { background: #4FC3F7; color: #fff; }
.btn-buy { background: #FFD700; color: #333; }
.btn-locked { background: #ddd; color: #999; }

.btn {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-close { background: #f0f0f0; color: #888; }
</style>
