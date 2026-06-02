# Claude Code Game Studios -- cc-games 项目

## ⚠️ 美术资源获取（最重要！）

**你不准自己画图！所有美术资源由Gemini AI生成。**

### 接口1: gen-art.py — 直接生成（推荐）
直接调用Gemini生成图片，**立即可用**，不用等美工。

```bash
# 单张生成
python3 ~/.hermes/scripts/gen-art.py \
  --desc "low-poly outer space, neon planets, starfield" \
  --ratio 16:9 \
  --output ~/Desktop/cc-games/src/games/orbit-odyssey/public/assets/bg-game.webp

# 生成+自动抠图（图标/按钮/角色用）
python3 ~/.hermes/scripts/gen-art.py \
  --desc "cute rocket ship, flat design, bright colors" \
  --ratio 1:1 \
  --output ~/Desktop/cc-games/src/games/orbit-odyssey/public/assets/icon.webp \
  --remove-bg

# 批量生成（用 ;; 分隔，每个是 比例|描述）
python3 ~/.hermes/scripts/gen-art.py \
  --project orbit-odyssey \
  --batch "16:9|low-poly outer space, neon planets ;; 1:1|cute rocket ship, flat design ;; 1:1|blue gradient play button" \
  --dir ~/Desktop/cc-games/src/games/orbit-odyssey/public/assets

# 批量+自动抠图
python3 ~/.hermes/scripts/gen-art.py \
  --project orbit-odyssey \
  --batch "1:1|cute rocket ship ;; 1:1|blue play button" \
  --dir ~/Desktop/cc-games/src/games/orbit-odyssey/public/assets \
  --remove-bg
```

### 参数说明
- **--desc**: 图片描述（**用英文，Gemini英文生图质量更高**）
- **--ratio**: 1:1 / 16:9 / 9:16 / 4:3（默认1:1）
- **--output**: 输出文件路径（必须.webp格式）
- **--image**: 参考图片路径（可选，做image-to-image）
- **--remove-bg**: 自动rembg抠图（图标/按钮/角色必须加）
- **--timeout**: 超时秒数（默认90）
- **--project**: 项目名（批量模式）
- **--batch**: 批量请求，格式 "比例|描述 ;; 比例|描述"
- **--dir**: 批量模式输出目录

### 接口2: request-art.py — 队列模式（备选）
写入请求队列，美工每3分钟批量处理。适合大量图片。

```bash
python3 ~/.hermes/scripts/request-art.py \
  --project orbit-odyssey \
  --batch "背景|16:9|low-poly太空 ;; 图标|1:1|火箭飞船" \
  --dir ~/Desktop/cc-games/src/games/orbit-odyssey/public/assets
```

### 使用建议
- **1-3张图** → 用 gen-art.py（立即出图）
- **5张以上** → 用 gen-art.py --batch（批量生成，每张间隔15秒）
- **图标/按钮/角色** → 必须加 --remove-bg（自动抠图）
- **背景/封面** → 不加 --remove-bg（保留背景）

### 抠图规则
- 图标/按钮/角色/道具 → 必须 --remove-bg
- 背景/封面 → 不抠图
- rembg用miniconda python（自动处理，不用操心）

### 禁止事项
- ❌ 不准用 Phaser Graphics API 画圈圈矩形当美术资源
- ❌ 不准用 Canvas/SVG 程序化生成图形当图片
- ❌ 不准用纯色背景+文字当界面
- ❌ 不准用占位符图片提交

### 图片引用方式
```typescript
// 数据文件中
{ id: 'rocket', img: `${import.meta.env.BASE_URL}assets/icon.webp` }

// Vue模板中
<img src="/assets/bg-game.webp" />
```

---

## 技术栈

- **引擎**: Phaser 3
- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite（多入口多出口打包）
- **测试框架**: Vitest + @testing-library/vue + Playwright
- **包管理**: pnpm

## 项目目标

**赚钱。** 做优质休闲游戏，发布到 CrazyGames（Poki待注册），通过广告分成盈利。

## 核心原则

1. **测试必须100%覆盖核心逻辑** — 测试不过不能提交
2. **多入口多出口打包** — 每个游戏独立入口，按需加载Phaser引擎
3. **复用组件抽离到shared/** — 减少重复代码
4. **移动端适配** — 触屏操作，响应式布局
5. **美观很重要** — 用户留存靠画风，必须好看！

## 美术风格指南

### 整体风格
- **主风格**: Kawaii / Cute / 卡通
- **色彩**: 明亮饱和，渐变色，避免暗淡
- **字体**: 圆润可爱，推荐: Fredoka One, Bubblegum Sans, Nunito
- **动效**: 流畅的弹性动画，粒子特效

### 必须有高质量素材的元素
- ✅ 游戏主界面背景
- ✅ 角色/主要游戏元素
- ✅ 按钮和UI组件
- ✅ 图标（游戏图标、道具图标）
- ✅ 成就/奖励弹窗素材

### 禁止
- ❌ 纯色背景 + 文字（太简陋）
- ❌ 默认Phaser样式（没有设计感）
- ❌ 模糊或低分辨率图片
- ❌ 风格不统一的素材混搭

## ⚠️ 图片素材铁律（违反=直接打回）

**所有游戏素材必须用 Gemini 生成，严禁用纯色/低分辨率占位符！**

### 质量标准
- **最低尺寸：** 512×512 像素（图标/角色），1920×1080（背景）
- **最低文件大小：** 5KB（低于此=占位符，不允许提交）
- **格式：** webp（cwebp -q 80 压缩）
- **画风：** kawaii style, cute cartoon（必须在prompt中指定）

### 提交前检查（必须执行）
```bash
# 检查是否有占位符图片
find public/assets/ -name "*.webp" -size -5k -exec echo "⚠️ PLACEHOLDER: {}" \;
# 检查图片尺寸
for f in public/assets/*.webp; do
  size=$(stat -f%z "$f")
  if [ "$size" -lt 5000 ]; then
    echo "❌ REJECT: $(basename $f) is $size bytes (need >5KB)"
  fi
done
```
发现占位符 → 用Gemini重新生成 → 验证通过后再提交

### CC需要图片时
输出 `[资源请求]` 格式，Hermes用Gemini生成后返回文件路径。

### 资源请求格式（CC输出）
```
[资源请求]
- 类型：背景/角色/道具/按钮/图标
- 画风：kawaii/chibi/cute/pixel art
- 比例：1:1/16:9/9:16
- 描述：详细描述需要什么图片
- 数量：需要几张
```

### Hermes生成后返回格式
```
[资源已生成]
- 文件路径：/path/to/image.png
- 尺寸：1920x1080
- 用途：游戏背景
```
### 提示词格式
```
[Gemini生图请求]
- 用途：xxx（如：游戏图标/角色/背景/道具）
- 画风：kawaii/chibi/cute/pixel art/anime（必须指定）
- 比例：1:1/16:9/9:16/4:3（必须指定）
- 描述：详细描述需要的图片内容
- 数量：需要几张
```

### 常用素材类型及提示词模板

**游戏背景 (16:9)**
```
[Gemini生图请求]
- 用途：游戏背景
- 画风：kawaii cute cartoon
- 比例：16:9
- 描述：[游戏主题]场景，明亮色彩，可爱风格，适合休闲游戏
- 数量：1张
```

**角色/道具 (1:1)**
```
[Gemini生图请求]
- 用途：游戏角色/道具
- 画风：kawaii chibi cute
- 比例：1:1
- 描述：[具体角色/道具]，可爱风格，透明背景或白色背景
- 数量：[需要几个]
```

**按钮/UI元素 (1:1)**
```
[Gemini生图请求]
- 用途：游戏按钮
- 画风：kawaii cartoon
- 比例：1:1
- 描述：圆形/方形按钮，[颜色]渐变，有阴影和高光
- 数量：3-5个不同颜色
```

**图标 (1:1)**
```
[Gemini生图请求]
- 用途：游戏图标/道具图标
- 画风：kawaii cute icon
- 比例：1:1
- 描述：[具体物品]图标，简洁可爱，适合做游戏内图标
- 数量：[需要几个]
```

## UI/UX 设计规范

### 颜色方案
```typescript
// 主色调（根据游戏主题调整）
const COLORS = {
  primary: '#FF6B9D',      // 粉色
  secondary: '#4ECDC4',    // 青色
  accent: '#FFE66D',       // 黄色
  background: '#F7F7F7',   // 浅灰
  text: '#2C3E50',         // 深灰
  success: '#2ECC71',      // 绿色
  warning: '#F39C12',      // 橙色
  error: '#E74C3C',        // 红色
}
```

### 按钮设计
- 圆角: 12-20px
- 阴影: 有，增加立体感
- 悬停效果: 放大1.05倍 + 颜色变亮
- 点击效果: 缩小0.95倍
- 尺寸: 最小 44x44px（触摸友好）

### 动画规范
```typescript
// 弹性动画（推荐）
this.tweens.add({
  targets: element,
  scaleX: 1.2,
  scaleY: 1.2,
  duration: 200,
  ease: 'Back.easeOut',
  yoyo: true
});

// 淡入动画
this.tweens.add({
  targets: element,
  alpha: 1,
  y: element.y,
  duration: 500,
  ease: 'Power2'
});
```

### 字体使用
```css
/* 主标题 */
font-family: 'Fredoka One', cursive;
font-size: 48px;
color: #FF6B9D;
text-shadow: 2px 2px 4px rgba(0,0,0,0.3);

/* 副标题 */
font-family: 'Nunito', sans-serif;
font-size: 24px;
color: #2C3E50;

/* 按钮文字 */
font-family: 'Bubblegum Sans', cursive;
font-size: 20px;
color: white;
```

## 游戏开发流程

### 1. 初始化游戏
```
src/games/<game-name>/
├── index.ts           # 入口
├── GameScene.ts       # 主游戏场景
├── MenuScene.ts       # 菜单场景
├── assets/            # 游戏素材
│   ├── background.png
│   ├── characters/
│   ├── items/
│   └── ui/
└── config.ts          # 游戏配置
```

### 2. 必须实现的场景
- **MenuScene**: 主菜单（开始游戏、设置、成就）
- **GameScene**: 游戏主场景
- **GameOverScene**: 游戏结束（得分、重试、分享）
- **TutorialScene**: 新手引导（可选但推荐）

### 3. 必须有的功能
- ✅ 音效和背景音乐
- ✅ 粒子特效（得分、升级等）
- ✅ 动画过渡（场景切换）
- ✅ 本地存储（进度、最高分）
- ✅ 响应式布局（手机/平板/电脑）

## ⚠️ 图片路径铁律（违反=游戏白图）

**数据文件（ingredients.ts/customers.ts等）中引用 `public/assets/` 图片时，必须用 `import.meta.env.BASE_URL`，不能用绝对路径！**

CG从子目录加载游戏，`/assets/xxx.webp` 找不到文件→白图。

```typescript
// ❌ 错误 — CG上图片不显示
{ id: 'boba', img: '/assets/icon_boba.webp' }

// ✅ 正确 — Vite自动解析为 ./assets/
{ id: 'boba', img: `${import.meta.env.BASE_URL}assets/icon_boba.webp` }
```

Vue模板中的 `src="/assets/xxx.webp"` 会被Vite自动转换，不需要改。**只有数据文件中的运行时字符串需要手动修复。**

验证：
```bash
grep -rn "'/assets/" src/games/*/data/*.ts  # 输出应为0行
```

## 协作规则

- 需要图片素材时 → 输出 `[资源请求]` 告诉Hermes需要什么图片，由Hermes用Gemini生成
- 需要做决策时 → 向 Hermes 提问
- 写代码时 → 自主完成，不需要询问
- 测试时 → 确保100%通过
- **UI必须好看** → 不满意就重新生成素材

## 项目结构

```
cc-games/
├── src/
│   ├── games/           # 每个游戏一个文件夹
│   │   ├── boba-drop/
│   │   ├── bubble-tea-lab/
│   │   ├── color-chaos/
│   │   └── ...
│   └── shared/          # 复用组件
│       ├── ui/          # 通用UI组件
│       ├── effects/     # 特效
│       └── utils/       # 工具函数
├── public/
│   └── assets/          # 公共素材
├── tests/               # 测试文件
├── vite.config.ts       # 多入口配置
└── CLAUDE.md            # 本文件
```

## 当前任务

开发优质休闲游戏，发布到 CrazyGames（Poki待注册）。

**重点：**
- 游戏要好玩，画风要好看
- 用 Gemini 生成高质量素材
- 测试100%覆盖
- 移动端优先

### 生成流程
1. CC 向 Hermes 输出 `[资源请求]` 格式的需求
2. Hermes 用 Gemini 生成图片，返回文件路径
3. CC 将图片放入 `src/assets/` 或 `public/assets/`
4. CC 在代码中引用

### 资源请求格式（CC输出）
```
[资源请求]
- 类型：背景/角色/道具/按钮/图标
- 画风：kawaii/chibi/cute/pixel art
- 比例：1:1/16:9/9:16
- 描述：详细描述需要什么图片
- 数量：需要几张
```

### Hermes生成后返回格式
```
[资源已生成]
- 文件路径：/path/to/image.png
- 尺寸：1920x1080
- 用途：游戏背景
```

## 双平台打包策略

CrazyGames和Poki的SDK互相冲突，必须分别打包。

### 打包命令

```bash
# CrazyGames版本
pnpm build:cg --game=<game-name>

# Poki版本  
pnpm build:poki --game=<game-name>
```

### vite.config.ts 配置

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// CG SDK排序插件
function cgSdkOrderPlugin() {
  return {
    name: 'cg-sdk-order',
    enforce: 'post',
    transformIndexHtml(html) {
      const sdkScript = '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>'
      html = html.replace(sdkScript, '')
      html = html.replace('<head>', `<head>\n  ${sdkScript}`)
      return html
    },
  }
}

// 根据环境变量选择SDK
const platform = process.env.PLATFORM || 'cg'

export default defineConfig({
  plugins: [
    vue(),
    platform === 'cg' ? cgSdkOrderPlugin() : null,
  ].filter(Boolean),
  base: './',
  build: {
    outDir: `dist/${platform}`,
    rollupOptions: {
      input: {
        // 多入口配置
      }
    }
  }
})
```

### package.json scripts

```json
{
  "scripts": {
    "build:cg": "PLATFORM=cg vite build",
    "build:poki": "PLATFORM=poki vite build",
    "build:all": "pnpm build:cg && pnpm build:poki"
  }
}
```

### SDK集成代码

```typescript
// src/services/PlatformSDK.ts

export type Platform = 'cg' | 'poki' | 'local'

class PlatformSDK {
  private platform: Platform
  
  constructor() {
    // 自动检测平台
    if (window.CrazyGames) {
      this.platform = 'cg'
    } else if (window.PokiSDK) {
      this.platform = 'poki'
    } else {
      this.platform = 'local'
    }
  }
  
  async gameplayStart() {
    switch (this.platform) {
      case 'cg':
        window.CrazyGames.sdk.game.gameplayStart()
        break
      case 'poki':
        window.PokiSDK.gameplayStart()
        break
    }
  }
  
  async gameplayStop() {
    switch (this.platform) {
      case 'cg':
        window.CrazyGames.sdk.game.gameplayStop()
        break
      case 'poki':
        window.PokiSDK.gameplayStop()
        break
    }
  }
  
  async showAd(type: 'midgame' | 'rewarded') {
    // 广告实现...
  }
}

export const sdk = new PlatformSDK()
```

### 提交流程

1. **CG提交**：`pnpm build:cg --game=<name>` → 上传到 `cg-submit/<name>/`
2. **Poki提交**：`pnpm build:poki --game=<name>` → 上传到 `poki-submit/<name>/`
3. 两个平台独立提交，互不影响

## ⚠️ 多语言支持（必须！）

**所有游戏面向海外，默认英文，支持CrazyGames和Poki用户最多的国家语言。**

### 必须支持的语言
1. **English** (en) - 默认
2. **Portuguese** (pt) - 巴西（CG/Poki最大市场）
3. **Spanish** (es) - 拉美+西班牙
4. **Indonesian** (id) - 东南亚
5. **Turkish** (tr) - 土耳其
6. **Russian** (ru) - 俄罗斯

### i18n实现方式
```typescript
// src/games/<game>/i18n.ts
export const translations = {
  en: {
    play: 'Play',
    gameOver: 'Game Over',
    score: 'Score',
    // ...
  },
  pt: {
    play: 'Jogar',
    gameOver: 'Fim de Jogo',
    score: 'Pontuação',
    // ...
  },
  // ...
}

// 使用
const lang = navigator.language.slice(0, 2) || 'en'
const t = translations[lang] || translations['en']
```

### 禁止
- ❌ 只写中文
- ❌ 只写英文不支持其他语言
- ❌ 用硬编码字符串

## ⚠️ CrazyGames/Poki品质要求（必须达到！）

**CrazyGames和Poki对游戏品质要求极高，不达标的会被拒绝。**

### CG审核标准（必须全部通过）
1. **视觉引导** - 新手3秒内知道怎么玩
2. **美术一致** - 所有素材风格统一
3. **音效平衡** - 背景音乐+音效，不能太吵
4. **操作直观** - 触屏友好，响应式
5. **名称唯一** - 不能和其他游戏重名
6. **无bug** - 崩溃=直接拒绝

### Poki审核标准
1. **留存率** - 50%以上用户玩超过3分钟
2. **加载速度** - 首屏3秒内加载完成
3. **移动端** - 必须触屏友好
4. **广告集成** - 必须有 rewarded video

### 测试要求（100%覆盖）
```bash
# 必须通过的测试
pnpm test:unit        # 单元测试100%通过
pnpm test:integration # 集成测试100%通过
pnpm test:e2e         # E2E测试100%通过

# Playwright测试（必须在CDP 9223上跑）
npx playwright test --headed
```

### 提交前检查清单
- [ ] 所有测试100%通过
- [ ] 无console.error/warn
- [ ] 移动端触屏测试通过
- [ ] 6种语言翻译完整
- [ ] 音效正常播放
- [ ] 本地存储正常
- [ ] 无白屏/崩溃

## ⚠️ 测试全覆盖（硬性要求！）

**测试覆盖率必须达到100%，否则不允许提交。**

### 测试命令
```bash
# 运行所有测试
pnpm test

# 查看覆盖率
pnpm test:coverage

# E2E测试（必须在CDP 9223上跑）
npx playwright test --headed
```

### 覆盖率要求
- **核心逻辑**：100%
- **API端点**：100%
- **UI组件**：95%+
- **边界条件**：必须测试

### 测试类型
1. **单元测试** - 每个函数/方法
2. **集成测试** - 模块间交互
3. **E2E测试** - 完整用户流程
4. **性能测试** - 加载速度/内存使用

### 提交前必须通过
```bash
# 检查覆盖率
pnpm test:coverage --check

# 必须100%通过
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

### 覆盖率报告
每次提交前生成覆盖率报告，保存到 `coverage/` 目录。
