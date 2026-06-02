# Bubble Tea Lab - 图片需求清单

> 本文档列出所有需要生成的图片素材，包括引用位置、用途、画风和比例提示词

---

## 📋 一、顾客头像 (Customer Avatars)

### 1. 上班族 (Office Worker)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` 第4-11行
- **用途**: 顾客头像显示在游戏界面
- **尺寸**: 120x120px (圆形裁切)
- **格式**: WebP
- **画风**: Q版卡通风格，kawaii可爱风，简洁明快
- **提示词**: `chibi office worker character, kawaii style, wearing business suit, holding briefcase, cute expression, pastel colors, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

### 2. 学生 (Student)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts`
- **用途**: 顾客头像
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版卡通风格
- **提示词**: `chibi student character, kawaii style, wearing school uniform, backpack, cheerful expression, pastel colors, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

### 3. 老人家 (Grandpa)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (已有王奶奶)
- **用途**: 顾客头像
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版卡通风格
- **提示词**: `chibi old grandpa character, kawaii style, wearing traditional clothes, kind smile, glasses, warm colors, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

### 4. 博主 (Blogger/Influencer)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (新增)
- **用途**: 顾客头像，会给超高小费
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版卡通风格
- **提示词**: `chibi social media influencer character, kawaii style, holding smartphone, taking selfie, fashionable clothes, trendy, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

### 5. 恶魔顾客 (Demon Customer)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (新增)
- **用途**: 会随机改单的有趣顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版卡通风格
- **提示词**: `chibi mischievous demon character, kawaii style, small horns, playful expression, purple and red colors, cute not scary, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

### 6. VIP顾客 (VIP Customer)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (已有customer_vip.webp)
- **用途**: 金色边框，高奖励顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版卡通风格，金色边框
- **提示词**: `chibi VIP customer character, kawaii style, wearing crown, gold accessories, luxury clothes, elegant pose, golden border frame, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

### 7. 神秘顾客 (Mystery Customer)
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (新增)
- **用途**: 隐藏需求，猜对给10倍奖励
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版卡通风格，神秘感
- **提示词**: `chibi mysterious hooded character, kawaii style, question mark symbol, glowing aura, magical sparkles, purple and gold colors, mobile game asset, 120x120, transparent background`
- **比例**: 1:1

---

## 📋 二、顾客表情状态 (Customer Mood States)

### 8-11. 表情变化序列
- **引用文件**: `src/games/bubble-tea-lab/components/CustomerDisplay.vue` 第14-19行
- **用途**: 顾客等待时表情变化动画
- **尺寸**: 80x80px (叠加在头像上)
- **格式**: WebP
- **画风**: Emoji风格，简洁明了

#### 8. 开心表情 (😊 Happy)
- **提示词**: `happy emoji face, big smile, heart eyes, kawaii style, bright colors, 80x80, transparent background`

#### 9. 普通表情 (😐 Neutral)
- **提示词**: `neutral emoji face, calm expression, waiting patiently, simple design, 80x80, transparent background`

#### 10. 焦虑表情 (😟 Worried)
- **提示词**: `worried emoji face, slightly frowning, checking watch, anxious expression, 80x80, transparent background`

#### 11. 生气表情 (😡 Angry)
- **提示词**: `angry emoji face, furrowed brows, steam from ears, frustrated expression, red tones, 80x80, transparent background`

---

## 📋 三、配料图片 (Ingredient Icons)

> 现有配料已有图片，但需要新增季节限定配料

### 12. 樱花果冻 (Sakura Jelly) - 春季限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 春季樱花季节限定配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 半透明果冻质感，粉色系
- **提示词**: `pink sakura jelly cube, translucent, cherry blossom petals inside, glossy surface, cute food illustration, 100x100, transparent background`
- **比例**: 1:1

### 13. 樱花糖浆 (Sakura Syrup) - 春季限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 春季樱花季节限定配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 液体糖浆瓶
- **提示词**: `pink sakura syrup bottle, cherry blossom flavor, liquid inside, cute label with sakura design, kawaii style, 100x100, transparent background`
- **比例**: 1:1

### 14. 眼球果冻 (Eyeball Jelly) - 万圣节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 万圣节恐怖趣味配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 卡通恐怖风，可爱不可怕
- **提示词**: `cartoon eyeball jelly, cute not scary, red iris, white jelly base, halloween themed, kawaii horror style, 100x100, transparent background`
- **比例**: 1:1

### 15. 蜘蛛网椰果 (Spider Web Coconut) - 万圣节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 万圣节限定配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 白色椰果上有蜘蛛网纹理
- **提示词**: `white coconut jelly cube with spider web pattern, halloween themed, cute spooky style, black web details, 100x100, transparent background`
- **比例**: 1:1

### 16. 姜饼 (Gingerbread) - 圣诞节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 圣诞节限定配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 圣诞风格，温暖色调
- **提示词**: `gingerbread man cookie, christmas themed, icing decoration, warm brown colors, festive, cute kawaii style, 100x100, transparent background`
- **比例**: 1:1

### 17. 棉花糖 (Marshmallow) - 圣诞节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 圣诞节限定配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 蓬松柔软，白色/粉色
- **提示词**: `fluffy marshmallow, soft and squishy, pink and white colors, christmas theme, cute kawaii style, 100x100, transparent background`
- **比例**: 1:1

### 18. 薄荷 (Mint) - 圣诞节限定
- **引用文件**: `src/games/bubble-tea-lab/data/ingredients.ts` (新增)
- **用途**: 圣诞节限定配料
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 清新绿色，薄荷叶
- **提示词**: `fresh mint leaves, green and white striped candy cane, christmas mint flavor, refreshing, 100x100, transparent background`
- **比例**: 1:1

---

## 📋 四、背景图片 (Backgrounds)

### 19. 店铺背景 - 早上 (Morning Shop)
- **引用文件**: `src/games/bubble-tea-lab/App.vue` 第356行 (当前使用bg_shop.webp)
- **用途**: 游戏主界面背景，Lv.1-5使用
- **尺寸**: 1920x1080px (横屏) / 1080x1920px (竖屏)
- **格式**: WebP
- **画风**: 温馨奶茶店，阳光从窗户照入，有灰尘粒子效果
- **提示词**: `cozy bubble tea shop interior, morning sunlight streaming through window, dust particles in light beams, warm pastel colors, kawaii style, anime background, 1920x1080, soft lighting`
- **比例**: 16:9 (横屏) 或 9:16 (竖屏)

### 20. 店铺背景 - 中午 (Noon Shop)
- **引用文件**: `src/games/bubble-tea-lab/App.vue` (新增)
- **用途**: Lv.6-10使用，忙碌的厨房，蒸汽效果
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 热闹忙碌的奶茶店
- **提示词**: `busy bubble tea shop at noon, steam effects from kitchen, busy atmosphere, warm lighting, anime style, detailed interior, 1920x1080`
- **比例**: 16:9

### 21. 店铺背景 - 傍晚 (Evening Shop)
- **引用文件**: `src/games/bubble-tea-lab/App.vue` (新增)
- **用途**: Lv.11-15使用，暖色灯光，放松氛围
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 暖色调，温馨放松
- **提示词**: `bubble tea shop at sunset, warm orange lighting, cozy relaxing atmosphere, golden hour, anime style, 1920x1080`
- **比例**: 16:9

### 22. 店铺背景 - 深夜 (Midnight Shop)
- **引用文件**: `src/games/bubble-tea-lab/App.vue` (新增)
- **用途**: Lv.16+使用，霓虹灯闪烁，赛博朋克感
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 赛博朋克，霓虹灯
- **提示词**: `bubble tea shop at midnight, neon lights, cyberpunk style, purple and blue neon glow, futuristic, anime background, 1920x1080`
- **比例**: 16:9

### 23. 樱花飘落背景 (Sakura Background) - 春季活动
- **引用文件**: `src/games/bubble-tea-lab/App.vue` (新增)
- **用途**: 春季樱花季活动背景
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 粉色樱花主题，樱花飘落
- **提示词**: `bubble tea shop with cherry blossom theme, falling sakura petals, pink and white colors, spring atmosphere, anime style, 1920x1080`
- **比例**: 16:9

### 24. 万圣节背景 (Halloween Background)
- **引用文件**: `src/games/bubble-tea-lab/App.vue` (新增)
- **用途**: 万圣节活动背景，南瓜灯、蝙蝠
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 万圣节主题，暗色调但不恐怖
- **提示词**: `halloween themed bubble tea shop, pumpkin lanterns, bats, purple and orange colors, cute spooky style not scary, 1920x1080`
- **比例**: 16:9

### 25. 圣诞节背景 (Christmas Background)
- **引用文件**: `src/games/bubble-tea-lab/App.vue` (新增)
- **用途**: 圣诞节活动背景，雪景、圣诞树
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 温馨圣诞节，暖色调
- **提示词**: `christmas themed bubble tea shop, snow outside window, christmas tree with lights, warm cozy interior, red and green colors, 1920x1080`
- **比例**: 16:9

---

## 📋 五、连击特效 (Combo Effects)

### 26. 火花粒子 (Spark Particles)
- **引用文件**: `src/games/bubble-tea-lab/components/` (新增粒子系统)
- **用途**: x2-x3连击时的小火花
- **尺寸**: 64x64px (粒子图集)
- **格式**: WebP (带透明通道)
- **画风**: 明亮火花，黄色/橙色
- **提示词**: `spark particle effect, bright yellow and orange sparks, glowing, mobile game VFX, 64x64 sprite sheet, transparent background`
- **比例**: 1:1

### 27. 彩虹光环 (Rainbow Ring)
- **引用文件**: 新增
- **用途**: x4-x5连击彩虹光环效果
- **尺寸**: 256x256px
- **格式**: WebP
- **画风**: 半透明彩虹渐变
- **提示词**: `rainbow glowing ring effect, semi-transparent gradient, mobile game VFX, circular, 256x256, transparent background`
- **比例**: 1:1

### 28. 星星粒子 (Star Particles)
- **引用文件**: 新增
- **用途**: x6-x8连击大量星星粒子
- **尺寸**: 128x128px (粒子图集)
- **格式**: WebP
- **画风**: 金色/白色星星
- **提示词**: `star particle effects, golden and white stars, various sizes, mobile game VFX, 128x128 sprite sheet, transparent background`
- **比例**: 1:1

### 29. 金色爆炸文字 (Gold Explosion Text)
- **引用文件**: 新增
- **用途**: x9-x12连击金色文字爆炸效果
- **尺寸**: 512x256px
- **格式**: WebP
- **画风**: 金色光芒，爆炸扩散
- **提示词**: `golden explosion burst effect, radiating light rays, mobile game VFX, dramatic, 512x256, transparent background`
- **比例**: 2:1

### 30. 全屏彩虹特效 (Full Rainbow Effect)
- **引用文件**: 新增
- **用途**: x13+连击全屏彩虹特效
- **尺寸**: 1920x1080px
- **格式**: WebP
- **画风**: 全屏彩虹渐变，梦幻
- **提示词**: `full screen rainbow gradient overlay, vibrant colors, dreamy, mobile game VFX, 1920x1080, semi-transparent`
- **比例**: 16:9

---

## 📋 六、杯子动画 (Cup Animations)

### 31. 杯子跳起光效 (Cup Jump Effect)
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisual.vue` (新增)
- **用途**: 完美出杯时杯子跳起+旋转+光效
- **尺寸**: 256x256px
- **格式**: WebP
- **画风**: 光芒四射，金色光效
- **提示词**: `golden light burst effect, radiating glow, mobile game VFX, celebration, 256x256, transparent background`
- **比例**: 1:1

### 32. 内容物飞散效果 (Content Splash)
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisual.vue` (新增)
- **用途**: 清空杯子时内容物飞散
- **尺寸**: 256x256px
- **格式**: WebP
- **画风**: 液体飞溅，彩色粒子
- **提示词**: `liquid splash effect, colorful droplets, dynamic motion, mobile game VFX, 256x256, transparent background`
- **比例**: 1:1

### 33. 溢出效果 (Overflow Particles)
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisual.vue` (新增)
- **用途**: 杯子满杯时溢出效果
- **尺寸**: 128x128px
- **格式**: WebP
- **画风**: 气泡溢出，泡沫
- **提示词**: `bubbles and foam overflow, fizzy effect, mobile game VFX, 128x128, transparent background`
- **比例**: 1:1

---

## 📋 七、装修装饰 (Shop Decoration)

### 34. 门面样式1-5 (Shop Fronts)
- **引用文件**: 新增装修系统
- **用途**: 店面外观装修选项
- **尺寸**: 512x256px
- **格式**: WebP
- **画风**: Q版建筑，各种风格
- **提示词**: `cute bubble tea shop front exterior, various styles (modern, traditional, fantasy, cyberpunk, vintage), kawaii architecture, 512x256`
- **比例**: 2:1

### 35. 桌椅样式1-5 (Tables & Chairs)
- **引用文件**: 新增装修系统
- **用途**: 座位区装修
- **尺寸**: 256x256px
- **格式**: WebP
- **画风**: Q版家具
- **提示词**: `cute tables and chairs set, various styles (wooden, modern, vintage, fantasy), kawaii furniture, 256x256, transparent background`
- **比例**: 1:1

### 36. 装饰画/海报1-5 (Wall Posters)
- **引用文件**: 新增装修系统
- **用途**: 墙面装饰
- **尺寸**: 256x384px
- **格式**: WebP
- **画风**: 奶茶主题海报
- **提示词**: `cute bubble tea themed wall poster, various designs (menu, motivational, seasonal), kawaii art style, 256x384`
- **比例**: 2:3

### 37. 配料架样式1-3 (Ingredient Shelves)
- **引用文件**: 新增装修系统
- **用途**: 制作区装修
- **尺寸**: 384x256px
- **格式**: WebP
- **画风**: Q版货架
- **提示词**: `cute ingredient display shelf, wooden and modern styles, with jars and bottles, kawaii style, 384x256, transparent background`
- **比例**: 3:2

### 38. 杯子样式1-5 (Cup Skins)
- **引用文件**: `src/games/bubble-tea-lab/components/CupVisual.vue` (新增皮肤系统)
- **用途**: 不同杯子皮肤
- **尺寸**: 200x300px
- **格式**: WebP
- **画风**: 各种材质和风格

#### 38a. 经典透明玻璃杯
- **提示词**: `classic transparent glass cup for bubble tea, realistic, clean design, 200x300, transparent background`

#### 38b. 粉色塑料杯
- **提示词**: `pink plastic bubble tea cup, cute kawaii style, pastel pink, 200x300, transparent background`

#### 38c. 木质纹理杯
- **提示词**: `wooden texture bubble tea cup, Japanese style, natural wood grain, 200x300, transparent background`

#### 38d. 金属杯
- **提示词**: `metallic cyberpunk bubble tea cup, futuristic, neon accents, silver and purple, 200x300, transparent background`

#### 38e. 陶瓷杯
- **提示词**: `ceramic bubble tea cup, elegant, hand-painted floral pattern, vintage style, 200x300, transparent background`

---

## 📋 八、成就徽章 (Achievement Badges)

### 39-45. 新成就徽章
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (新增成就)
- **用途**: 成就系统图标
- **尺寸**: 100x100px
- **格式**: WebP
- **画风**: 圆形徽章，金色边框，闪亮效果

#### 39. 全收集徽章 (Full Collection)
- **提示词**: `gold achievement badge, full collection icon, star design, shiny, 100x100, transparent background`

#### 40. 连续登录7天徽章 (7-Day Streak)
- **提示词**: `gold achievement badge, 7-day streak icon, calendar design, shiny, 100x100, transparent background`

#### 41. 百万金币徽章 (Million Coins)
- **提示词**: `gold achievement badge, million coins icon, treasure chest design, shiny, 100x100, transparent background`

#### 42. 夜猫子徽章 (Night Owl)
- **提示词**: `gold achievement badge, night owl icon, moon and owl design, shiny, 100x100, transparent background`

#### 43. 配方大师徽章 (Recipe Master)
- **提示词**: `gold achievement badge, recipe master icon, open book design, shiny, 100x100, transparent background`

#### 44. 装修达人徽章 (Decoration Master)
- **提示词**: `gold achievement badge, decoration master icon, paint brush and hammer, shiny, 100x100, transparent background`

#### 45. 季节收集家徽章 (Season Collector)
- **提示词**: `gold achievement badge, season collector icon, four seasons symbols, shiny, 100x100, transparent background`

---

## 📋 九、分享卡片 (Share Cards)

### 46. 分享卡片背景 (Share Card Background)
- **引用文件**: 新增分享功能
- **用途**: 完美出杯时生成分享卡片
- **尺寸**: 1080x1920px (手机屏幕比例)
- **格式**: WebP
- **画风**: 精美卡片设计，可自定义
- **提示词**: `share card template for bubble tea game, beautiful gradient background, space for drink photo and score, mobile game social share, 1080x1920`
- **比例**: 9:16

---

## 📋 十、季节活动限定顾客 (Seasonal Customers)

### 47. 和服女生 (Kimono Girl) - 春季
- **引用文件**: `src/games/bubble-tea-lab/data/customers.ts` (新增)
- **用途**: 春季樱花季限定顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版和服女生
- **提示词**: `chibi girl wearing pink kimono, kawaii style, cherry blossom accessories, spring theme, 120x120, transparent background`
- **比例**: 1:1

### 48. 吸血鬼 (Vampire) - 万圣节
- **引用文件**: 新增
- **用途**: 万圣节限定顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版吸血鬼，可爱不可怕
- **提示词**: `chibi vampire character, cute not scary, cape and fangs, kawaii halloween style, 120x120, transparent background`
- **比例**: 1:1

### 49. 女巫 (Witch) - 万圣节
- **引用文件**: 新增
- **用途**: 万圣节限定顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版女巫
- **提示词**: `chibi witch character, cute, pointy hat, broom, kawaii halloween style, purple and black colors, 120x120, transparent background`
- **比例**: 1:1

### 50. 僵尸 (Zombie) - 万圣节
- **引用文件**: 新增
- **用途**: 万圣节限定顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版僵尸，可爱风
- **提示词**: `chibi zombie character, cute not scary, green skin, kawaii halloween style, 120x120, transparent background`
- **比例**: 1:1

### 51. 圣诞老人 (Santa Claus) - 圣诞节
- **引用文件**: 新增
- **用途**: 圣诞节限定顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版圣诞老人
- **提示词**: `chibi Santa Claus, cute kawaii style, red suit, white beard, holding gift bag, christmas theme, 120x120, transparent background`
- **比例**: 1:1

### 52. 驯鹿 (Reindeer) - 圣诞节
- **引用文件**: 新增
- **用途**: 圣诞节限定顾客
- **尺寸**: 120x120px
- **格式**: WebP
- **画风**: Q版驯鹿
- **提示词**: `chibi reindeer character, cute, red nose, antlers, christmas bells, kawaii style, 120x120, transparent background`
- **比例**: 1:1

---

## 📋 汇总统计

| 类别 | 数量 | 状态 |
|------|------|------|
| 顾客头像 | 7个 | 需要生成 |
| 顾客表情 | 4个 | 需要生成 |
| 季节配料 | 7个 | 需要生成 |
| 背景图片 | 7个 | 需要生成 |
| 连击特效 | 5个 | 需要生成 |
| 杯子动画 | 3个 | 需要生成 |
| 装修装饰 | 23个 (5+5+5+3+5) | 需要生成 |
| 成就徽章 | 7个 | 需要生成 |
| 分享卡片 | 1个 | 需要生成 |
| 季节顾客 | 6个 | 需要生成 |
| **总计** | **70个** | **需要生成** |

---

## 💡 生成建议

1. **批量生成**: 同类型图片可以用相同提示词模板批量生成
2. **一致性**: 使用相同的随机种子(seed)保持画风一致
3. **透明背景**: 所有图标/粒子都需要透明背景(Alpha通道)
4. **尺寸规范**: 严格按照标注尺寸生成，避免后期缩放失真
5. **文件格式**: 统一使用WebP格式，带透明通道
6. **命名规范**: 使用下划线命名，如 `customer_office_worker.webp`

---

## 📁 建议的文件存放路径

所有图片统一存放在: `public/assets/bubble-tea-lab/`

```
public/assets/bubble-tea-lab/
├── customers/
│   ├── customer_office_worker.webp
│   ├── customer_student.webp
│   ├── customer_blogger.webp
│   ├── customer_demon.webp
│   ├── customer_mystery.webp
│   └── seasonal/
│       ├── customer_kimono_girl.webp
│       ├── customer_vampire.webp
│       ├── customer_witch.webp
│       ├── customer_zombie.webp
│       ├── customer_santa.webp
│       └── customer_reindeer.webp
├── moods/
│   ├── mood_happy.webp
│   ├── mood_neutral.webp
│   ├── mood_worried.webp
│   └── mood_angry.webp
├── ingredients/
│   ├── sakura_jelly.webp
│   ├── sakura_syrup.webp
│   ├── eyeball_jelly.webp
│   ├── spider_web_coconut.webp
│   ├── gingerbread.webp
│   ├── marshmallow.webp
│   └── mint.webp
├── backgrounds/
│   ├── bg_morning.webp
│   ├── bg_noon.webp
│   ├── bg_evening.webp
│   ├── bg_midnight.webp
│   ├── bg_sakura.webp
│   ├── bg_halloween.webp
│   └── bg_christmas.webp
├── effects/
│   ├── spark_particles.webp
│   ├── rainbow_ring.webp
│   ├── star_particles.webp
│   ├── gold_explosion.webp
│   ├── full_rainbow.webp
│   ├── cup_jump.webp
│   ├── content_splash.webp
│   └── overflow.webp
├── decorations/
│   ├── shop_front_1.webp ~ shop_front_5.webp
│   ├── table_chair_1.webp ~ table_chair_5.webp
│   ├── poster_1.webp ~ poster_5.webp
│   ├── shelf_1.webp ~ shelf_3.webp
│   └── cups/
│       ├── cup_classic.webp
│       ├── cup_pink.webp
│       ├── cup_wooden.webp
│       ├── cup_metal.webp
│       └── cup_ceramic.webp
├── achievements/
│   ├── achievement_full_collection.webp
│   ├── achievement_7day_streak.webp
│   ├── achievement_million_coins.webp
│   ├── achievement_night_owl.webp
│   ├── achievement_recipe_master.webp
│   ├── achievement_decoration_master.webp
│   └── achievement_season_collector.webp
└── share_card_bg.webp
```
