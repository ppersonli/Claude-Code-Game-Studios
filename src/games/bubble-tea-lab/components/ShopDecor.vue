<script setup lang="ts">
import { ref, computed } from 'vue'
import { t } from '../i18n'
import {
  ALL_DECOR,
  loadShopDecor,
  saveShopDecor,
  calculateDecorEffect,
  type ShopDecorState,
  type DecorItem,
} from '../data/shop-decor'

const props = defineProps<{
  visible: boolean
  coins: number
  level: number
}>()

const emit = defineEmits<{
  close: []
  buyDecor: [itemId: string, cost: number]
}>()

const decorState = ref<ShopDecorState>(loadShopDecor())
const unlockedDecor = ref<string[]>([
  'shop_front_classic', 'table_wooden', 'wall_none', 'shelf_basic', 'cup_classic'
])

// 从 localStorage 加载已解锁装修
try {
  const raw = localStorage.getItem('btlab_unlocked_decor')
  if (raw) {
    unlockedDecor.value = JSON.parse(raw)
  }
} catch {}

const currentTab = ref<DecorItem['category']>('shop_front')

const tabs = [
  { id: 'shop_front', labelKey: 'decor.shop_front' },
  { id: 'table', labelKey: 'decor.table' },
  { id: 'wall', labelKey: 'decor.wall' },
  { id: 'shelf', labelKey: 'decor.shelf' },
  { id: 'cup', labelKey: 'decor.cup' },
] as const

const filteredItems = computed(() => {
  return ALL_DECOR.filter(item => item.category === currentTab.value)
})

const decorEffect = computed(() => {
  return calculateDecorEffect(decorState.value)
})

function isUnlocked(itemId: string): boolean {
  return unlockedDecor.value.includes(itemId)
}

function isEquipped(itemId: string, category: string): boolean {
  const current = decorState.value[category as keyof ShopDecorState]
  return current === itemId
}

function canBuy(item: DecorItem): boolean {
  return !isUnlocked(item.id) && 
         props.coins >= item.cost && 
         props.level >= item.requiredLevel
}

function handleBuyAndEquip(item: DecorItem) {
  if (canBuy(item)) {
    // 购买
    emit('buyDecor', item.id, item.cost)
    
    // 解锁
    unlockedDecor.value.push(item.id)
    localStorage.setItem('btlab_unlocked_decor', JSON.stringify(unlockedDecor.value))
    
    // 装备
    equipItem(item.id, item.category)
  }
}

function equipItem(itemId: string, category: string) {
  if (isUnlocked(itemId)) {
    decorState.value = {
      ...decorState.value,
      [category]: itemId,
    }
    saveShopDecor(decorState.value)
  }
}
</script>

<template>
  <div v-if="visible" class="shop-decor-overlay" @click="emit('close')">
    <div class="shop-decor" @click.stop>
      <div class="shop-header">
        <h2>🎨 {{ t('decor.title') }}</h2>
        <button class="btn-close" @click="emit('close')">✕</button>
      </div>

      <div class="decor-stats">
        <div class="stat-item">
          <span class="stat-label">💰 {{ t('decor.coins') }}</span>
          <span class="stat-value">{{ coins }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">⭐ {{ t('decor.level') }}</span>
          <span class="stat-value">Lv.{{ level }}</span>
        </div>
      </div>

      <div class="decor-effects" v-if="decorEffect.patienceBonus > 0 || decorEffect.tipBonus > 0 || decorEffect.scoreBonus > 0">
        <h3>🎁 {{ t('decor.currentEffects') }}</h3>
        <div class="effect-list">
          <span v-if="decorEffect.patienceBonus > 0" class="effect-badge">
            {{ t('decor.patience', { value: decorEffect.patienceBonus }) }}
          </span>
          <span v-if="decorEffect.tipBonus > 0" class="effect-badge">
            {{ t('decor.tip', { value: (decorEffect.tipBonus * 100).toFixed(0) }) }}
          </span>
          <span v-if="decorEffect.scoreBonus > 0" class="effect-badge">
            {{ t('decor.score', { value: (decorEffect.scoreBonus * 100).toFixed(0) }) }}
          </span>
        </div>
      </div>

      <div class="category-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ t(tab.labelKey) }}
        </button>
      </div>

      <div class="decor-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="decor-card"
          :class="{
            equipped: isEquipped(item.id, item.category),
            unlocked: isUnlocked(item.id),
            locked: !isUnlocked(item.id),
            canBuy: canBuy(item),
          }"
          @click="isUnlocked(item.id) ? equipItem(item.id, item.category) : handleBuyAndEquip(item)"
        >
          <div class="decor-image" v-if="item.img">
            <img :src="item.img" :alt="item.name" />
          </div>
          <div class="decor-image placeholder" v-else>
            <span>{{ t('decor.noDecor') }}</span>
          </div>
          
          <div class="decor-info">
            <div class="decor-name">{{ t('decor.' + item.id) || item.name }}</div>
            <div class="decor-desc">{{ t('decor.desc.' + item.id) || item.description }}</div>
            
            <div class="decor-effects" v-if="item.effect.patienceBonus || item.effect.tipBonus || item.effect.scoreBonus">
              <span v-if="item.effect.patienceBonus" class="effect-small">
                +{{ item.effect.patienceBonus }}s
              </span>
              <span v-if="item.effect.tipBonus" class="effect-small">
                +{{ (item.effect.tipBonus * 100).toFixed(0) }}%
              </span>
              <span v-if="item.effect.scoreBonus" class="effect-small">
                +{{ (item.effect.scoreBonus * 100).toFixed(0) }}%
              </span>
            </div>

            <div v-if="isEquipped(item.id, item.category)" class="decor-status equipped">
              ✅ {{ t('buttons.inUse') }}
            </div>
            <div v-else-if="isUnlocked(item.id)" class="decor-status unlocked">
              {{ t('buttons.equip') }}
            </div>
            <div v-else-if="canBuy(item)" class="decor-status can-buy">
              💰 {{ item.cost }}
            </div>
            <div v-else class="decor-status locked">
              🔒 Lv.{{ item.requiredLevel }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-decor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.shop-decor {
  background: linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%);
  border-radius: 20px;
  padding: 24px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  color: #333;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.shop-header h2 {
  font-size: 1.8em;
  margin: 0;
  color: #fff;
}

.btn-close {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: #fff;
  font-size: 1.5em;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.decor-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  gap: 8px;
  font-size: 0.95em;
  font-weight: 600;
}

.stat-value {
  color: #FFD700;
}

.decor-effects {
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.decor-effects h3 {
  font-size: 1em;
  margin-bottom: 8px;
  color: #667eea;
}

.effect-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.effect-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
}

.decor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.decor-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 3px solid transparent;
}

.decor-card.equipped {
  border-color: #4CAF50;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

.decor-card.can-buy:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.decor-image {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
  background: rgba(0, 0, 0, 0.1);
}

.decor-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.decor-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  color: #999;
}

.decor-info {
  text-align: center;
}

.decor-name {
  font-size: 0.9em;
  font-weight: 700;
  margin-bottom: 4px;
  color: #333;
}

.decor-desc {
  font-size: 0.7em;
  color: #666;
  margin-bottom: 6px;
}

.decor-effects {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.effect-small {
  background: #667eea;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.65em;
  font-weight: 600;
}

.decor-status {
  font-size: 0.75em;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
}

.decor-status.equipped {
  background: #4CAF50;
  color: #fff;
}

.decor-status.unlocked {
  background: #2196F3;
  color: #fff;
}

.decor-status.can-buy {
  background: #FF9800;
  color: #fff;
}

.decor-status.locked {
  background: #999;
  color: #fff;
}
</style>
