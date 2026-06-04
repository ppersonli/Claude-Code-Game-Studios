<script setup lang="ts">
import type { Customer, Ingredient } from '@types'
import { ref, watch, onUnmounted } from 'vue'
import { t } from '../i18n'

function getPersonalityLabel(personality: string): string {
  const labels: Record<string, string> = {
    office_worker: t('customers.office_worker'),
    student: t('customers.student'),
    grandpa: t('customers.grandpa'),
    blogger: t('customers.blogger'),
    demon: t('customers.demon'),
    vip: t('customers.vip_label'),
    mystery: t('customers.mystery'),
  }
  return labels[personality] || personality
}

const props = defineProps<{
  customer: Customer | null
  order: readonly Ingredient[]
  mood: 'neutral' | 'happy' | 'sad' | 'worried' | 'angry'
  fulfilledIndices?: Set<number>
  personality?: string // 顾客性格类型
  patience?: number // 当前耐心值
  maxPatience?: number // 最大耐心值
}>()

const moodEmoji = ref('😊')
let moodTimer: ReturnType<typeof setInterval> | null = null

// 情绪emoji映射
const MOOD_EMOJIS = {
  happy: '😊',
  neutral: '😐',
  worried: '😟',
  angry: '😡',
}

// 根据耐心值计算情绪
function calculateMoodFromPatience(patience: number, maxPatience: number): string {
  if (maxPatience === 0) return '😊'
  const ratio = patience / maxPatience
  
  if (ratio >= 0.7) return '😊'
  if (ratio >= 0.5) return '😐'
  if (ratio >= 0.3) return '😟'
  return '😡'
}

// 监听耐心变化更新情绪
watch(() => [props.patience, props.maxPatience], ([p, max]) => {
  if (p !== undefined && max !== undefined) {
    moodEmoji.value = calculateMoodFromPatience(p, max)
  }
}, { immediate: true })

// 定时更新情绪（如果提供了interval）
watch(() => props.mood, (newMood) => {
  if (props.maxPatience) {
    // 使用耐心值计算
    return
  }
  // 使用传统的mood
  moodEmoji.value = MOOD_EMOJIS[newMood as keyof typeof MOOD_EMOJIS] || '😐'
}, { immediate: true })

// 顾客离开动画
const isLeaving = ref(false)

function triggerLeaveAnimation() {
  isLeaving.value = true
  setTimeout(() => {
    isLeaving.value = false
  }, 1000)
}

// 暴露方法给父组件
defineExpose({
  triggerLeaveAnimation,
})

onUnmounted(() => {
  if (moodTimer) {
    clearInterval(moodTimer)
  }
})
</script>

<template>
  <div class="customer-display-enhanced" v-if="customer">
    <div class="customer-container" :class="{ leaving: isLeaving }">
      <!-- 顾客头像 -->
      <div class="avatar-wrapper">
        <img
          :src="customer.img"
          :alt="customer.name"
          class="customer-avatar"
          :class="{ [mood]: true }"
        >
        
        <!-- 情绪表情叠加 -->
        <div class="mood-overlay" v-if="patience !== undefined && maxPatience !== undefined">
          <span class="mood-emoji">{{ moodEmoji }}</span>
        </div>

        <!-- 耐心进度条 -->
        <div class="patience-bar" v-if="patience !== undefined && maxPatience !== undefined">
          <div 
            class="patience-fill"
            :class="{
              'high': patience / maxPatience >= 0.7,
              'medium': patience / maxPatience >= 0.3 && patience / maxPatience < 0.7,
              'low': patience / maxPatience < 0.3,
            }"
            :style="{ width: (patience / maxPatience * 100) + '%' }"
          />
        </div>

        <!-- VIP标记 -->
        <div class="vip-badge" v-if="personality === 'vip'">
          👑
        </div>

        <!-- 神秘顾客标记 -->
        <div class="mystery-badge" v-else-if="personality === 'mystery'">
          ❓
        </div>
      </div>

      <!-- 订单气泡 -->
      <div class="order-bubble">
        <span class="order-label">{{ t('customers.wants') }}...</span>
        <div class="order-items">
          <img
            v-for="(ing, i) in order"
            :key="i"
            :src="ing.img"
            :alt="ing.name"
            class="order-item"
            :class="{ fulfilled: fulfilledIndices?.has(i) }"
          >
        </div>
        
        <!-- 顾客性格标签 -->
        <div class="personality-tag" v-if="personality">
          {{ getPersonalityLabel(personality) }}
        </div>
      </div>

      <!-- 离开动画提示 -->
      <div class="leave-indicator" v-if="isLeaving">
        💢
      </div>
    </div>
  </div>
</template>

<style scoped>
.customer-display-enhanced {
  padding: 8px 14px;
}

.customer-container {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.5s;
}

.customer-container.leaving {
  opacity: 0;
  transform: translateX(-100px);
}

.avatar-wrapper {
  position: relative;
  width: 76px;
  height: 76px;
}

.customer-avatar {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s;
}

.customer-avatar.happy { 
  animation: bounce 0.5s ease; 
}

.customer-avatar.sad { 
  animation: shake 0.5s ease; 
}

.mood-overlay {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #fff;
}

.mood-emoji {
  font-size: 1.2em;
}

.patience-bar {
  position: absolute;
  bottom: -12px;
  left: 0;
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.patience-fill {
  height: 100%;
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: 3px;
}

.patience-fill.high {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.patience-fill.medium {
  background: linear-gradient(90deg, #FF9800, #FFC107);
  animation: pulse 1s infinite;
}

.patience-fill.low {
  background: linear-gradient(90deg, #F44336, #FF5722);
  animation: pulse 0.5s infinite;
}

.vip-badge,
.mystery-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1.5em;
  background: rgba(255, 215, 0, 0.9);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: bounce 1s infinite;
}

.mystery-badge {
  background: rgba(156, 89, 182, 0.9);
  animation: float 2s infinite;
}

.order-bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  max-width: 260px;
}

.order-bubble::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border: 8px solid transparent;
  border-right-color: rgba(255, 255, 255, 0.95);
}

.order-label {
  font-size: 0.7em;
  color: #666;
  white-space: nowrap;
}

.order-items {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.order-item {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid #eee;
  transition: all 0.3s;
}

.order-item.fulfilled {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  animation: pop 0.3s ease;
}

.personality-tag {
  font-size: 0.7em;
  color: #667eea;
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  align-self: flex-start;
}

.leave-indicator {
  position: absolute;
  top: -20px;
  right: -20px;
  font-size: 2em;
  animation: leave-bounce 1s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(10deg); }
}

@keyframes leave-bounce {
  0% { transform: scale(0) rotate(0deg); }
  50% { transform: scale(1.5) rotate(180deg); }
  100% { transform: scale(1) rotate(360deg); }
}
</style>
