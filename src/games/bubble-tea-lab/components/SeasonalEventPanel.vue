<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getActiveEvents,
  loadEventProgress,
  claimMissionReward,
  type SeasonalEvent,
  type EventProgress,
} from '../data/seasonal-events'

const props = defineProps<{
  visible: boolean
  coins: number
}>()

const emit = defineEmits<{
  close: []
  claimReward: [coins: number]
}>()

const activeEvents = ref<SeasonalEvent[]>([])
const eventProgress = ref<Record<string, EventProgress>>({})
const selectedEvent = ref<SeasonalEvent | null>(null)

onMounted(() => {
  activeEvents.value = getActiveEvents()
  eventProgress.value = loadEventProgress()
  if (activeEvents.value.length > 0) {
    selectedEvent.value = activeEvents.value[0]
  }
})

const selectedEventProgress = computed(() => {
  if (!selectedEvent.value) return null
  return eventProgress.value[selectedEvent.value.id]
})

function getMissionProgress(missionId: string): { progress: number; target: number; percent: number } {
  if (!selectedEvent.value) return { progress: 0, target: 0, percent: 0 }
  
  const progress = eventProgress.value[selectedEvent.value.id]?.missions[missionId]
  const mission = selectedEvent.value.missions.find(m => m.id === missionId)
  
  if (!mission) return { progress: 0, target: 0, percent: 0 }
  
  return {
    progress: progress?.progress ?? 0,
    target: mission.target,
    percent: Math.min(((progress?.progress ?? 0) / mission.target) * 100, 100),
  }
}

function isMissionCompleted(missionId: string): boolean {
  if (!selectedEvent.value) return false
  const progress = eventProgress.value[selectedEvent.value.id]?.missions[missionId]
  return progress?.completed ?? false
}

function isMissionClaimed(missionId: string): boolean {
  if (!selectedEvent.value) return false
  const progress = eventProgress.value[selectedEvent.value.id]?.missions[missionId]
  return progress?.claimed ?? false
}

function canClaimMission(missionId: string): boolean {
  return isMissionCompleted(missionId) && !isMissionClaimed(missionId)
}

function handleClaimReward(missionId: string) {
  if (!selectedEvent.value) return
  
  const reward = claimMissionReward(
    selectedEvent.value.id,
    missionId,
    eventProgress.value,
  )
  
  if (reward > 0) {
    emit('claimReward', reward)
  }
}

function getDaysRemaining(event: SeasonalEvent): number {
  const now = new Date()
  const endDate = new Date(2024, event.endDate.month - 1, event.endDate.day)
  const diff = endDate.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
</script>

<template>
  <div v-if="visible" class="seasonal-overlay" @click="emit('close')">
    <div class="seasonal-panel" @click.stop>
      <div class="panel-header">
        <h2>🎉 季节活动</h2>
        <button class="btn-close" @click="emit('close')">✕</button>
      </div>

      <!-- 无活动提示 -->
      <div v-if="activeEvents.length === 0" class="no-event">
        <div class="no-event-icon">📅</div>
        <p>当前没有活动</p>
        <p class="no-event-hint">敬请期待下一个节日活动！</p>
      </div>

      <!-- 活动列表 -->
      <div v-else>
        <!-- 活动选择标签 -->
        <div class="event-tabs" v-if="activeEvents.length > 1">
          <button
            v-for="event in activeEvents"
            :key="event.id"
            class="event-tab"
            :class="{ active: selectedEvent?.id === event.id }"
            @click="selectedEvent = event"
          >
            {{ event.emoji }} {{ event.name }}
          </button>
        </div>

        <!-- 活动详情 -->
        <div v-if="selectedEvent" class="event-detail">
          <!-- 活动头部 -->
          <div class="event-header">
            <div class="event-title">
              <span class="event-emoji">{{ selectedEvent.emoji }}</span>
              <div>
                <h3>{{ selectedEvent.name }}</h3>
                <p class="event-desc">{{ selectedEvent.description }}</p>
              </div>
            </div>
            <div class="event-timer">
              <span class="timer-label">剩余时间</span>
              <span class="timer-value">{{ getDaysRemaining(selectedEvent) }} 天</span>
            </div>
          </div>

          <!-- 限定内容 -->
          <div class="event-section">
            <h4>🎁 限定内容</h4>
            <div class="limited-content">
              <div class="limited-item" v-if="selectedEvent.limitedIngredients.length > 0">
                <span class="limited-icon">🧪</span>
                <span>限定配料: {{ selectedEvent.limitedIngredients.length }}种</span>
              </div>
              <div class="limited-item" v-if="selectedEvent.limitedCustomers.length > 0">
                <span class="limited-icon">👤</span>
                <span>限定顾客: {{ selectedEvent.limitedCustomers.length }}位</span>
              </div>
            </div>
          </div>

          <!-- 任务列表 -->
          <div class="event-section">
            <h4>📋 活动任务</h4>
            <div class="missions-list">
              <div
                v-for="mission in selectedEvent.missions"
                :key="mission.id"
                class="mission-card"
                :class="{ completed: isMissionCompleted(mission.id) }"
              >
                <div class="mission-header">
                  <div class="mission-name">{{ mission.name }}</div>
                  <div class="mission-reward">
                    💰 {{ mission.reward }}
                  </div>
                </div>
                
                <div class="mission-desc">{{ mission.description }}</div>
                
                <div class="mission-progress">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      :style="{ width: getMissionProgress(mission.id).percent + '%' }"
                      :class="{ completed: isMissionCompleted(mission.id) }"
                    />
                  </div>
                  <div class="progress-text">
                    {{ getMissionProgress(mission.id).progress }} / {{ getMissionProgress(mission.id).target }}
                  </div>
                </div>

                <button
                  v-if="canClaimMission(mission.id)"
                  class="btn-claim"
                  @click="handleClaimReward(mission.id)"
                >
                  🎁 领取奖励
                </button>
                <div v-else-if="isMissionClaimed(mission.id)" class="claimed-label">
                  ✅ 已领取
                </div>
              </div>
            </div>
          </div>

          <!-- 完成奖励 -->
          <div class="event-section" v-if="selectedEventProgress?.completed">
            <div class="completion-reward">
              <h4>🎊 活动完成！</h4>
              <p>恭喜完成所有任务！</p>
              <div class="completion-bonus">
                <span class="bonus-label">额外奖励:</span>
                <span class="bonus-value">💰 {{ selectedEvent.rewards.completionReward }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seasonal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.seasonal-panel {
  background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
  border-radius: 20px;
  padding: 24px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  color: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  font-size: 1.8em;
  margin: 0;
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

.no-event {
  text-align: center;
  padding: 40px 20px;
}

.no-event-icon {
  font-size: 4em;
  margin-bottom: 16px;
}

.no-event-hint {
  font-size: 0.9em;
  opacity: 0.8;
  margin-top: 8px;
}

.event-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.event-tab {
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

.event-tab.active {
  background: rgba(255, 255, 255, 0.95);
  color: #FF6B6B;
}

.event-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-header {
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.event-emoji {
  font-size: 3em;
}

.event-title h3 {
  font-size: 1.3em;
  margin: 0;
  color: #333;
}

.event-desc {
  font-size: 0.85em;
  color: #666;
  margin: 4px 0 0 0;
}

.event-timer {
  text-align: right;
}

.timer-label {
  display: block;
  font-size: 0.75em;
  color: #999;
  margin-bottom: 4px;
}

.timer-value {
  font-size: 1.3em;
  font-weight: 700;
  color: #FF6B6B;
}

.event-section {
  background: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 12px;
}

.event-section h4 {
  font-size: 1.1em;
  margin: 0 0 12px 0;
  color: #333;
}

.limited-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.limited-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
}

.limited-icon {
  font-size: 1.5em;
}

.missions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mission-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.mission-card.completed {
  border-color: #4CAF50;
}

.mission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.mission-name {
  font-size: 1em;
  font-weight: 700;
  color: #333;
}

.mission-reward {
  font-size: 0.9em;
  font-weight: 600;
  color: #FFD700;
}

.mission-desc {
  font-size: 0.8em;
  color: #666;
  margin-bottom: 8px;
}

.mission-progress {
  margin-bottom: 8px;
}

.progress-bar {
  height: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.5s ease;
  border-radius: 6px;
}

.progress-fill.completed {
  background: linear-gradient(90deg, #FFD700, #FFA500);
}

.progress-text {
  font-size: 0.75em;
  color: #666;
  text-align: right;
}

.btn-claim {
  width: 100%;
  padding: 10px;
  border: none;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #fff;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-claim:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
}

.claimed-label {
  text-align: center;
  font-size: 0.85em;
  color: #4CAF50;
  font-weight: 600;
  padding: 8px;
}

.completion-reward {
  text-align: center;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  padding: 20px;
  border-radius: 12px;
}

.completion-reward h4 {
  color: #fff;
  margin-bottom: 8px;
}

.completion-reward p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
}

.completion-bonus {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  font-weight: 700;
}

.bonus-label {
  color: rgba(255, 255, 255, 0.9);
}

.bonus-value {
  color: #fff;
  font-size: 1.3em;
}
</style>
