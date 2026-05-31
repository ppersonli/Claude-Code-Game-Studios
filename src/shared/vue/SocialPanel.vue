<script setup lang="ts">
import { ref, computed } from 'vue'
import { shareGame, isFavorite, toggleFavorite, detectPlatform, type ShareConfig } from './social'

const props = defineProps<{
  gameName: string
  gameSlug: string
  shareText?: string
}>()

const emit = defineEmits<{
  shared: []
  favorited: [favorited: boolean]
}>()

const expanded = ref(false)
const favorited = ref(isFavorite(props.gameSlug))
const shared = ref(false)
const platform = computed(() => detectPlatform())

const config: ShareConfig = {
  gameName: props.gameName,
  gameSlug: props.gameSlug,
  shareText: props.shareText ?? `来玩${props.gameName}吧！`,
}

async function handleShare() {
  const ok = await shareGame(config)
  if (ok) {
    shared.value = true
    emit('shared')
    setTimeout(() => { shared.value = false }, 2000)
  }
}

function handleFavorite() {
  favorited.value = toggleFavorite(props.gameSlug)
  emit('favorited', favorited.value)
}
</script>

<template>
  <div class="social-panel">
    <button class="social-toggle" @click="expanded = !expanded" :title="'社交'">
      {{ expanded ? '✕' : '📤' }}
    </button>
    <div v-if="expanded" class="social-menu">
      <button class="social-btn share-btn" @click="handleShare">
        {{ shared ? '✅ 已复制!' : '🔗 分享' }}
      </button>
      <button class="social-btn fav-btn" @click="handleFavorite">
        {{ favorited ? '❤️ 已收藏' : '🤍 收藏' }}
      </button>
      <div class="social-platform">
        {{ platform === 'poki' ? '🟢 Poki' : platform === 'crazygames' ? '🟣 CG' : '⚪ Local' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.social-panel {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.social-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.social-toggle:hover { background: rgba(0, 0, 0, 0.6); }
.social-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 8px;
  min-width: 120px;
}
.social-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}
.share-btn { background: rgba(255, 255, 255, 0.15); color: #fff; }
.share-btn:hover { background: rgba(255, 255, 255, 0.25); }
.fav-btn { background: rgba(255, 255, 255, 0.15); color: #fff; }
.fav-btn:hover { background: rgba(255, 255, 255, 0.25); }
.social-platform {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
