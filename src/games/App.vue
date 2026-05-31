<script setup lang="ts">
interface Game {
  slug: string
  name: string
  desc: string
  emoji: string
  color: string
  tag: string
}

const games: Game[] = [
  { slug: 'bubble-tea', name: '奶茶大师', desc: '调制完美奶茶，满足每位顾客', emoji: '🧋', color: '#667eea', tag: '模拟' },
  { slug: 'bubble-tea-lab', name: '奶茶实验室', desc: '调配饮品，解锁食材，每日挑战', emoji: '🧪', color: '#f093fb', tag: '模拟' },
  { slug: 'bubble-tea-merge', name: '奶茶合成大作战', desc: '西米合成水晶波波，Suika风格', emoji: '🔮', color: '#a18cd1', tag: '合成' },
  { slug: 'boba-drop', name: '波波消消乐', desc: '配料碰撞合成，Matter.js物理', emoji: '🫧', color: '#764ba2', tag: '物理' },
  { slug: 'boba-sort', name: '珍珠奶茶排序', desc: '颜色分类，倒管解谜', emoji: '🧩', color: '#c44dff', tag: '益智' },
  { slug: 'color-chaos', name: '色彩混乱', desc: '试管颜色排序，100关卡', emoji: '🎨', color: '#4488ff', tag: '益智' },
  { slug: 'meme-match', name: '梗图记忆翻牌', desc: '梗图配对，考验记忆力', emoji: '🃏', color: '#db2777', tag: '记忆' },
  { slug: 'jelly-pop', name: '果冻消消', desc: '三消玩法，连锁反应', emoji: '🍬', color: '#f97316', tag: '三消' },
  { slug: 'sweet-sort', name: '甜蜜排序', desc: '糖果颜色分类，星级评分', emoji: '🍭', color: '#ec4899', tag: '益智' },
  { slug: 'idle-coffee-shop', name: '放置咖啡店', desc: '经营咖啡帝国，升级解锁', emoji: '☕', color: '#8B4513', tag: '放置' },
]

function play(slug: string) {
  window.location.href = `./${slug}/index.html`
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="title">🎮 CC Games</h1>
      <p class="subtitle">精选休闲游戏合集</p>
      <p class="count">{{ games.length }} 款游戏</p>
    </header>

    <div class="grid">
      <div
        v-for="game in games"
        :key="game.slug"
        class="card"
        @click="play(game.slug)"
      >
        <div class="card-icon" :style="{ background: game.color }">
          {{ game.emoji }}
        </div>
        <div class="card-body">
          <div class="card-tag">{{ game.tag }}</div>
          <h2 class="card-name">{{ game.name }}</h2>
          <p class="card-desc">{{ game.desc }}</p>
        </div>
        <button class="card-btn" :style="{ background: game.color }">
          开始游戏
        </button>
      </div>
    </div>

    <footer class="footer">
      <p>CC Games © 2026 · 优质休闲游戏</p>
    </footer>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; min-height: 100vh; }
body {
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 25%, #ff9a9e 50%, #a18cd1 75%, #fbc2eb 100%);
  background-attachment: fixed;
}
</style>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 16px 40px;
}

.hero {
  text-align: center;
  padding: 48px 20px 32px;
}

.title {
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.count {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 16px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-width: 960px;
  margin: 0 auto;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
}

.card:active {
  transform: translateY(-2px) scale(0.98);
}

.card-icon {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
  overflow: hidden;
}

.card-icon::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { transform: translateX(-30%) translateY(-30%); }
  50% { transform: translateX(30%) translateY(30%); }
}

.card-body {
  padding: 16px 18px 12px;
  flex: 1;
}

.card-tag {
  display: inline-block;
  padding: 2px 10px;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border-radius: 10px;
  font-size: 11px;
  color: #7c3aed;
  font-weight: 600;
  margin-bottom: 8px;
}

.card-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.card-btn {
  margin: 12px 18px 18px;
  padding: 10px 0;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-btn:hover {
  opacity: 0.9;
  transform: scale(1.03);
}

.card-btn:active {
  transform: scale(0.97);
}

.footer {
  text-align: center;
  padding: 40px 20px 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .title {
    font-size: 32px;
  }
}
</style>
