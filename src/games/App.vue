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
  { slug: 'bubble-tea-lab', name: '奶茶实验室', desc: '调配饮品，解锁食材，每日挑战', emoji: '🧪', color: '#f093fb', tag: '模拟' },
  { slug: 'boba-drop', name: '波波消消乐', desc: '配料碰撞合成，Matter.js物理', emoji: '🫧', color: '#764ba2', tag: '物理' },
  { slug: 'color-chaos', name: '色彩混乱', desc: '试管颜色排序，100关卡', emoji: '🎨', color: '#4488ff', tag: '益智' },
  { slug: 'meme-match', name: '梗图记忆翻牌', desc: '梗图配对，考验记忆力', emoji: '🃏', color: '#db2777', tag: '记忆' },
  { slug: 'jelly-pop', name: '果冻消消', desc: '三消玩法，连锁反应', emoji: '🍬', color: '#f97316', tag: '三消' },
  { slug: 'idle-coffee-shop', name: '放置咖啡店', desc: '经营咖啡帝国，升级解锁', emoji: '☕', color: '#8B4513', tag: '放置' },
  { slug: 'waffle-wobble', name: '华夫饼摇摇乐', desc: '平衡堆叠华夫饼，物理挑战', emoji: '🧇', color: '#d97706', tag: '物理' },
  { slug: 'bubble-shooter', name: '波波射击', desc: '经典泡泡射击，消除得分', emoji: '🎯', color: '#06b6d4', tag: '射击' },
  { slug: 'boba-tycoon', name: '波波帝国', desc: '放置经营奶茶帝国，prestige循环', emoji: '👑', color: '#f59e0b', tag: '放置' },
  { slug: 'boba-runner', name: '波波快跑', desc: '无尽跑酷，躲避障碍收集道具', emoji: '🏃', color: '#10b981', tag: '跑酷' },
  { slug: 'boba-clicker', name: '波波点击', desc: '疯狂点击，升级prestige', emoji: '👆', color: '#8b5cf6', tag: '点击' },
  { slug: 'boba-tower-defense', name: '波波塔防', desc: '合成升级，防御入侵者', emoji: '🏰', color: '#ef4444', tag: '塔防' },
]

function play(slug: string) {
  window.location.href = `./${slug}/index.html`
}
</script>
