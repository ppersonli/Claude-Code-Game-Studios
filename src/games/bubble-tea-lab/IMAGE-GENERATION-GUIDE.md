# Bubble Tea Lab - 图片生成快速指南

> 本文档帮助你快速生成游戏所需的图片资源

---

## 🎯 第一步：立即生成的图片（核心功能需要）

### 1️⃣ 顾客头像（6张）

使用以下提示词批量生成：

```
1. 上班族:
chibi office worker character, kawaii style, wearing business suit, holding briefcase, cute expression, pastel colors, mobile game asset, 120x120, transparent background

2. 学生:
chibi student character, kawaii style, wearing school uniform, backpack, cheerful expression, pastel colors, mobile game asset, 120x120, transparent background

3. 博主:
chibi social media influencer character, kawaii style, holding smartphone, taking selfie, fashionable clothes, trendy, mobile game asset, 120x120, transparent background

4. 恶魔顾客:
chibi mischievous demon character, kawaii style, small horns, playful expression, purple and red colors, cute not scary, mobile game asset, 120x120, transparent background

5. 神秘顾客:
chibi mysterious hooded character, kawaii style, question mark symbol, glowing aura, magical sparkles, purple and gold colors, mobile game asset, 120x120, transparent background

6. VIP顾客（可选，已有）:
chibi VIP customer character, kawaii style, wearing crown, gold accessories, luxury clothes, elegant pose, golden border frame, mobile game asset, 120x120, transparent background
```

**保存路径**: `public/assets/bubble-tea-lab/customers/`

---

### 2️⃣ 顾客表情（4张）

```
1. 开心:
happy emoji face, big smile, heart eyes, kawaii style, bright colors, 80x80, transparent background

2. 普通:
neutral emoji face, calm expression, waiting patiently, simple design, 80x80, transparent background

3. 焦虑:
worried emoji face, slightly frowning, checking watch, anxious expression, 80x80, transparent background

4. 生气:
angry emoji face, furrowed brows, steam from ears, frustrated expression, red tones, 80x80, transparent background
```

**保存路径**: `public/assets/bubble-tea-lab/moods/`

---

### 3️⃣ 连击特效（5张）

```
1. 火花粒子:
spark particle effect, bright yellow and orange sparks, glowing, mobile game VFX, 64x64 sprite sheet, transparent background

2. 彩虹光环:
rainbow glowing ring effect, semi-transparent gradient, mobile game VFX, circular, 256x256, transparent background

3. 星星粒子:
star particle effects, golden and white stars, various sizes, mobile game VFX, 128x128 sprite sheet, transparent background

4. 金色爆炸:
golden explosion burst effect, radiating light rays, mobile game VFX, dramatic, 512x256, transparent background

5. 全屏彩虹:
full screen rainbow gradient overlay, vibrant colors, dreamy, mobile game VFX, 1920x1080, semi-transparent
```

**保存路径**: `public/assets/bubble-tea-lab/effects/`

---

## 📦 批量生成技巧

### Midjourney / DALL-E / Stable Diffusion

1. **使用相同seed** 保持画风一致
2. **添加风格前缀**: `kawaii mobile game asset style, `
3. **统一尺寸**: 所有图标都加 `120x120, transparent background`
4. **批量处理**: 一次生成同一类别的所有图片

### 示例批处理（Midjourney）

```
/imagine prompt: chibi office worker character, kawaii style, wearing business suit, cute expression, pastel colors, mobile game asset, 120x120, transparent background --v 5.2 --ar 1:1

/imagine prompt: chibi student character, kawaii style, wearing school uniform, cheerful expression, pastel colors, mobile game asset, 120x120, transparent background --v 5.2 --ar 1:1

/imagine prompt: chibi social media influencer, kawaii style, holding smartphone, fashionable, mobile game asset, 120x120, transparent background --v 5.2 --ar 1:1
```

---

## 🗂️ 文件命名规范

```
customer_{类型}.webp
mood_{表情}.webp
effect_{特效名}.webp
ingredient_{配料名}.webp
bg_{场景名}.webp
```

**示例**:
- `customer_office_worker.webp`
- `mood_happy.webp`
- `effect_spark_particles.webp`
- `ingredient_sakura_jelly.webp`
- `bg_morning_shop.webp`

---

## 🎨 画风统一指南

### 核心风格关键词

在所有提示词中加入这些关键词：

```
kawaii style, mobile game asset, cute, pastel colors, clean design
```

### 避免的风格

- ❌ 写实风格 (realistic)
- ❌ 像素艺术 (pixel art)
- ❌ 3D渲染 (3D render)
- ❌ 复杂细节 (highly detailed)

### 推荐风格

- ✅ Q版卡通 (chibi)
- ✅ 扁平设计 (flat design)
- ✅ 柔和色彩 (pastel colors)
- ✅ 简洁明快 (clean and simple)

---

## 📐 尺寸规范

| 类型 | 尺寸 | 比例 |
|------|------|------|
| 顾客头像 | 120x120 | 1:1 |
| 顾客表情 | 80x80 | 1:1 |
| 配料图标 | 100x100 | 1:1 |
| 成就徽章 | 100x100 | 1:1 |
| 粒子特效 | 64x64 ~ 256x256 | 1:1 |
| 背景图片 | 1920x1080 | 16:9 |
| 分享卡片 | 1080x1920 | 9:16 |

---

## 🔄 格式转换

生成的图片需要转换为 **WebP** 格式：

### 使用 cwebp 命令行

```bash
# 安装 (macOS)
brew install webp

# 转换
cwebp input.png -o output.webp -q 80

# 批量转换
for f in *.png; do cwebp "$f" -o "${f%.png}.webp" -q 80; done
```

### 使用在线工具

- https://convertio.co/png-webp/
- https://cloudconvert.com/png-to-webp

---

## ✅ 生成后检查清单

生成每张图片后检查：

- [ ] 尺寸正确（120x120, 100x100等）
- [ ] 背景透明（Alpha通道）
- [ ] 画风一致（kawaii风格）
- [ ] 色彩鲜明（适合移动端）
- [ ] 文件命名正确
- [ ] 保存在正确路径

---

## 📁 完整文件结构

```
public/assets/bubble-tea-lab/
├── customers/
│   ├── customer_office_worker.webp     ← 生成
│   ├── customer_student.webp           ← 生成
│   ├── customer_blogger.webp           ← 生成
│   ├── customer_demon.webp             ← 生成
│   ├── customer_mystery.webp           ← 生成
│   └── seasonal/                       ← 后期生成
│       ├── customer_kimono_girl.webp
│       └── ...
├── moods/
│   ├── mood_happy.webp                 ← 生成
│   ├── mood_neutral.webp               ← 生成
│   ├── mood_worried.webp               ← 生成
│   └── mood_angry.webp                 ← 生成
├── effects/
│   ├── spark_particles.webp            ← 生成
│   ├── rainbow_ring.webp               ← 生成
│   ├── star_particles.webp             ← 生成
│   ├── gold_explosion.webp             ← 生成
│   └── full_rainbow.webp               ← 生成
├── ingredients/                        ← 后期生成
├── backgrounds/                        ← 后期生成
└── decorations/                        ← 后期生成
```

---

## 🚀 快速开始（15分钟完成）

### 第1步：生成顾客头像（5分钟）
使用6个提示词生成顾客头像

### 第2步：生成表情（3分钟）
使用4个提示词生成表情

### 第3步：生成特效（5分钟）
使用5个提示词生成特效

### 第4步：转换和保存（2分钟）
- 转换为WebP格式
- 按规范命名
- 放到对应文件夹

---

## 💡 提示词优化建议

### 如果生成结果不满意：

1. **太写实** → 添加 `cartoon style, anime style`
2. **太复杂** → 添加 `simple design, minimal detail`
3. **颜色不对** → 添加 `pastel colors, soft colors`
4. **风格不统一** → 使用相同的seed值
5. **尺寸不对** → 添加 `120x120 pixels`

### 增强画质的关键词：

```
high quality, professional game asset, polished, clean edges
```

---

## 📞 需要帮助？

完整的需求文档见：`images-needed.md`
- 70张图片的完整清单
- 详细的引用位置
- 所有提示词和规格

---

**开始生成吧！** 🎨✨
