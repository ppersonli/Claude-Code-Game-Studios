# Bubble Tea Lab - 完整图片资源清单

> 本文档列出所有需要的图片资源，包含完整路径、引用位置和AI生成提示词

---

## 📁 目录结构

所有图片统一存放在: `public/assets/bubble-tea-lab/`

```
public/assets/bubble-tea-lab/
├── customers/           # 顾客头像
├── moods/              # 顾客表情
├── ingredients/        # 季节限定配料
├── effects/            # 连击特效
├── backgrounds/        # 游戏背景
├── decorations/        # 装修装饰
├── achievements/       # 成就徽章
└── cups/               # 杯子皮肤
```

---

## 1️⃣ 顾客头像 (7张)

**存放路径**: `public/assets/bubble-tea-lab/customers/`

### 1.1 customer_office_worker.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第5行
- **用途**: 小明（上班族）头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi office worker character, kawaii style, wearing business suit, holding briefcase, cute expression, pastel colors, mobile game asset, 120x120, transparent background
```

### 1.2 customer_student.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第4、7行
- **用途**: 小美、酷哥（学生）头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi student character, kawaii style, wearing school uniform, backpack, cheerful expression, pastel colors, mobile game asset, 120x120, transparent background
```

### 1.3 customer_blogger.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第8行
- **用途**: 猫猫酱（博主）头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi social media influencer character, kawaii style, holding smartphone, taking selfie, fashionable clothes, trendy, mobile game asset, 120x120, transparent background
```

### 1.4 customer_demon.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第9行
- **用途**: 机器人（恶魔顾客）头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi mischievous demon character, kawaii style, small horns, playful expression, purple and red colors, cute not scary, mobile game asset, 120x120, transparent background
```

### 1.5 customer_vip.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第10行
- **用途**: VIP大人头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi VIP customer character, kawaii style, wearing crown, gold accessories, luxury clothes, elegant pose, golden border frame, mobile game asset, 120x120, transparent background
```

### 1.6 customer_mystery.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customer-ai.ts` (待添加到customers.ts)
- **用途**: 神秘顾客头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi mysterious hooded character, kawaii style, question mark symbol, glowing aura, magical sparkles, purple and gold colors, mobile game asset, 120x120, transparent background
```

### 1.7 customer_grandpa.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第6行 (已有customer_grandma.webp)
- **用途**: 王奶奶（老人家）头像
- **尺寸**: 120x120px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
chibi old grandma character, kawaii style, wearing traditional clothes, kind smile, warm colors, mobile game asset, 120x120, transparent background
```

---

## 2️⃣ 顾客表情 (4张)

**存放路径**: `public/assets/bubble-tea-lab/moods/`

### 2.1 mood_happy.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customer-ai.ts` 第115行
- **用途**: 顾客开心表情（耐心>70%）
- **尺寸**: 80x80px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
happy emoji face, big smile, heart eyes, kawaii style, bright colors, 80x80, transparent background
```

### 2.2 mood_neutral.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customer-ai.ts` 第116行
- **用途**: 顾客普通表情（耐心50-70%）
- **尺寸**: 80x80px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
neutral emoji face, calm expression, waiting patiently, simple design, 80x80, transparent background
```

### 2.3 mood_worried.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customer-ai.ts` 第117行
- **用途**: 顾客焦虑表情（耐心30-50%）
- **尺寸**: 80x80px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
worried emoji face, slightly frowning, checking watch, anxious expression, 80x80, transparent background
```

### 2.4 mood_angry.webp
- **引用文件**: `src/games/bubble-tea-lab/data/customer-ai.ts` 第118行
- **用途**: 顾客生气表情（耐心<30%）
- **尺寸**: 80x80px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
angry emoji face, furrowed brows, steam from ears, frustrated expression, red tones, 80x80, transparent background
```

---

## 3️⃣ 季节限定配料 (7张)

**存放路径**: `public/assets/bubble-tea-lab/ingredients/`

### 3.1 sakura_jelly.webp - 春季限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第21行
- **用途**: 樱花果冻配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
pink sakura jelly cube, translucent, cherry blossom petals inside, glossy surface, cute food illustration, 100x100, transparent background
```

### 3.2 sakura_syrup.webp - 春季限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第22行
- **用途**: 樱花糖浆配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
pink sakura syrup bottle, cherry blossom flavor, liquid inside, cute label with sakura design, kawaii style, 100x100, transparent background
```

### 3.3 eyeball_jelly.webp - 万圣节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第24行
- **用途**: 眼球果冻配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
cartoon eyeball jelly, cute not scary, red iris, white jelly base, halloween themed, kawaii horror style, 100x100, transparent background
```

### 3.4 spider_web_coconut.webp - 万圣节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第25行
- **用途**: 蜘蛛网椰果配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
white coconut jelly cube with spider web pattern, halloween themed, cute spooky style, black web details, 100x100, transparent background
```

### 3.5 gingerbread.webp - 圣诞节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第27行
- **用途**: 姜饼配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
gingerbread man cookie, christmas themed, icing decoration, warm brown colors, festive, cute kawaii style, 100x100, transparent background
```

### 3.6 marshmallow.webp - 圣诞节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第28行
- **用途**: 棉花糖配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
fluffy marshmallow, soft and squishy, pink and white colors, christmas theme, cute kawaii style, 100x100, transparent background
```

### 3.7 mint.webp - 圣诞节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` 第29行
- **用途**: 薄荷配料图标
- **尺寸**: 100x100px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
fresh mint leaves, green and white striped candy cane, christmas mint flavor, refreshing, 100x100, transparent background
```

---

## 4️⃣ 连击特效 (8张)

**存放路径**: `public/assets/bubble-tea-lab/effects/`

### 4.1 spark_particles.webp
- **引用文件**: `src/games/bubble-tea-lab/components/ParticleEffects.vue` (粒子系统)
- **用途**: x2-x3连击火花粒子
- **尺寸**: 64x64px（精灵图）
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
spark particle effect, bright yellow and orange sparks, glowing, mobile game VFX, 64x64 sprite sheet, transparent background
```

### 4.2 rainbow_ring.webp
- **引用文件**: `src/games/bubble-tea-lab/components/ParticleEffects.vue`
- **用途**: x4-x5连击彩虹光环
- **尺寸**: 256x256px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
rainbow glowing ring effect, semi-transparent gradient, mobile game VFX, circular, 256x256, transparent background
```

### 4.3 star_particles.webp
- **引用文件**: `src/games/bubble-tea-lab/components/ParticleEffects.vue`
- **用途**: x6-x8连击星星粒子
- **尺寸**: 128x128px（精灵图）
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
star particle effects, golden and white stars, various sizes, mobile game VFX, 128x128 sprite sheet, transparent background
```

### 4.4 gold_explosion.webp
- **引用文件**: `src/games/bubble-tea-lab/components/ParticleEffects.vue`
- **用途**: x9-x12连击金色爆炸
- **尺寸**: 512x256px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
golden explosion burst effect, radiating light rays, mobile game VFX, dramatic, 512x256, transparent background
```

### 4.5 full_rainbow.webp
- **引用文件**: `src/games/bubble-tea-lab/components/ParticleEffects.vue`
- **用途**: x13+连击全屏彩虹
- **尺寸**: 1920x1080px
- **格式**: WebP（半透明）
- **AI提示词**: 
```
full screen rainbow gradient overlay, vibrant colors, dreamy, mobile game VFX, 1920x1080, semi-transparent
```

### 4.6 cup_jump.webp
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisualEnhanced.vue`
- **用途**: 完美出杯杯子跳起光效
- **尺寸**: 256x256px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
golden light burst effect, radiating glow, mobile game VFX, celebration, 256x256, transparent background
```

### 4.7 content_splash.webp
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisualEnhanced.vue`
- **用途**: 清空杯子内容物飞散
- **尺寸**: 256x256px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
liquid splash effect, colorful droplets, dynamic motion, mobile game VFX, 256x256, transparent background
```

### 4.8 overflow.webp
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisualEnhanced.vue`
- **用途**: 杯子满杯溢出效果
- **尺寸**: 128x128px
- **格式**: WebP（透明背景）
- **AI提示词**: 
```
bubbles and foam overflow, fizzy effect, mobile game VFX, 128x128, transparent background
```

---

## 5️⃣ 游戏背景 (7张) - 后期开发

**存放路径**: `public/assets/bubble-tea-lab/backgrounds/`

### 5.1 bg_morning.webp
- **用途**: 早上店铺背景（Lv.1-5）
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
cozy bubble tea shop interior, morning sunlight streaming through window, dust particles in light beams, warm pastel colors, kawaii style, anime background, 1920x1080, soft lighting
```

### 5.2 bg_noon.webp
- **用途**: 中午店铺背景（Lv.6-10）
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
busy bubble tea shop at noon, steam effects from kitchen, busy atmosphere, warm lighting, anime style, detailed interior, 1920x1080
```

### 5.3 bg_evening.webp
- **用途**: 傍晚店铺背景（Lv.11-15）
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
bubble tea shop at sunset, warm orange lighting, cozy relaxing atmosphere, golden hour, anime style, 1920x1080
```

### 5.4 bg_midnight.webp
- **用途**: 深夜店铺背景（Lv.16+）
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
bubble tea shop at midnight, neon lights, cyberpunk style, purple and blue neon glow, futuristic, anime background, 1920x1080
```

### 5.5 bg_sakura.webp - 春季活动
- **用途**: 樱花季活动背景
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
bubble tea shop with cherry blossom theme, falling sakura petals, pink and white colors, spring atmosphere, anime style, 1920x1080
```

### 5.6 bg_halloween.webp - 万圣节活动
- **用途**: 万圣节活动背景
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
halloween themed bubble tea shop, pumpkin lanterns, bats, purple and orange colors, cute spooky style not scary, 1920x1080
```

### 5.7 bg_christmas.webp - 圣诞节活动
- **用途**: 圣诞节活动背景
- **尺寸**: 1920x1080px
- **AI提示词**: 
```
christmas themed bubble tea shop, snow outside window, christmas tree with lights, warm cozy interior, red and green colors, 1920x1080
```

---

## 📊 统计汇总

| 类别 | 数量 | 优先级 | 状态 |
|------|------|--------|------|
| 顾客头像 | 7张 | 🔴 P0 | 需要生成 |
| 顾客表情 | 4张 | 🔴 P0 | 需要生成 |
| 季节配料 | 7张 | 🟠 P1 | 需要生成 |
| 连击特效 | 8张 | 🔴 P0 | 需要生成 |
| 游戏背景 | 7张 | 🟡 P3 | 后期生成 |
| **总计** | **33张** | - | - |

---

## 🎯 生成优先级

### 第一优先级（立即需要 - 18张）
1. 顾客头像 7张
2. 顾客表情 4张
3. 连击特效 7张（除full_rainbow外）

### 第二优先级（功能完善 - 7张）
4. 季节限定配料 7张

### 第三优先级（视觉增强 - 8张）
5. 连击特效 full_rainbow 1张
6. 游戏背景 7张

---

## 💡 生成建议

1. **批量生成** - 同一类别使用相同seed保持画风一致
2. **透明背景** - 所有图标/粒子必须透明背景
3. **WebP格式** - 使用cwebp转换，质量80
4. **尺寸准确** - 严格按照标注尺寸生成
5. **命名规范** - 使用下划线命名法

---

## 🔧 快速转换命令

```bash
# 安装webp工具（macOS）
brew install webp

# 单张转换
cwebp input.png -o output.webp -q 80

# 批量转换
for f in *.png; do cwebp "$f" -o "${f%.png}.webp" -q 80; done
```

---

## ✅ 生成后检查清单

每张图片生成后检查：
- [ ] 尺寸正确
- [ ] 背景透明（除背景图外）
- [ ] 画风一致（kawaii风格）
- [ ] 文件命名正确
- [ ] 保存到正确路径
- [ ] 转换为WebP格式

---

**开始生成吧！** 🎨✨
