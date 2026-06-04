# Gemini生图提示词模板库

> 基于bubble-tea-lab成功经验总结，用于cc-games所有游戏素材生成
> 使用方式：`python3 ~/.hermes/scripts/gen-art.py --desc "提示词" --ratio 1:1 --output 路径 --remove-bg`

## ⚠️ 核心规则
1. **必须用英文** — Gemini英文生图质量远高于中文
2. **必须指定画风** — kawaii/chibi/pixel art/realistic等
3. **必须指定比例** — 1:1(图标) / 16:9(背景) / 9:16(竖屏)
4. **图标必须抠图** — 加 `--remove-bg`
5. **背景不抠图** — 保留完整背景

---

## 一、游戏背景模板

### 1.1 Kawaii可爱风背景（16:9）
```
kawaii cute [场景] background, pastel colors, soft gradient sky, cartoon style, game background asset, high quality, detailed, 4k
```

**示例：**
```
kawaii cute bubble tea shop interior background, pastel pink and mint colors, soft gradient, cartoon style, game background asset, high quality, detailed, 4k
```

### 1.2 像素风背景（16:9）
```
pixel art [场景] background, retro game style, 16-bit colors, detailed sprites, game background asset, high quality
```

### 1.3 科幻风背景（16:9）
```
futuristic [场景] background, neon lights, cyberpunk style, dark atmosphere with glowing elements, game background asset, high quality, 4k
```

### 1.4 自然风背景（16:9）
```
beautiful [场景] landscape, soft lighting, watercolor style, peaceful atmosphere, game background asset, high quality, 4k
```

---

## 二、角色/人物模板

### 2.1 Kawaii角色（1:1）
```
kawaii chibi [角色描述], cute cartoon style, big eyes, pastel colors, game character asset, white background, high quality, detailed
```

**示例：**
```
kawaii chibi bubble tea shop owner, cute cartoon style, big eyes, pink apron, holding bubble tea, white background, game character asset, high quality
```

### 2.2 像素角色（1:1）
```
pixel art [角色描述], retro game character, 16-bit style, cute design, game character asset, transparent background, high quality
```

### 2.3 写实角色（1:1）
```
realistic [角色描述], detailed portrait, professional lighting, game character asset, high quality, 4k
```

---

## 三、道具/图标模板

### 3.1 食物/饮品图标（1:1）
```
kawaii [食物名称] icon, cute cartoon style, flat design, bright colors, game item asset, white background, high quality, detailed
```

**示例：**
```
kawaii bubble tea cup icon, cute cartoon style, transparent plastic cup with boba pearls, flat design, bright colors, game item asset, white background, high quality
```

### 3.2 工具/设备图标（1:1）
```
[设备名称] icon, [风格] style, clean design, game UI asset, white background, high quality, detailed
```

**示例：**
```
factory machine icon, kawaii cartoon style, colorful buttons and lights, clean design, game UI asset, white background, high quality
```

### 3.3 货币/资源图标（1:1）
```
[货币名称] icon, [风格] style, shiny, glowing, game currency asset, white background, high quality, detailed
```

**示例：**
```
gold coin icon, kawaii cartoon style, shiny, sparkling, game currency asset, white background, high quality
```

---

## 四、UI元素模板

### 4.1 按钮（1:1）
```
[颜色] [形状] button, [风格] style, glossy, shadow, game UI asset, white background, high quality
```

**示例：**
```
pink rounded rectangle button, kawaii cartoon style, glossy, soft shadow, "Start" text, game UI asset, white background, high quality
```

### 4.2 面板/对话框（16:9）
```
[风格] game UI panel, [颜色] theme, rounded corners, clean design, game interface asset, transparent background, high quality
```

### 4.3 进度条（16:9）
```
[颜色] progress bar, [风格] style, glossy, animated feel, game UI asset, white background, high quality
```

---

## 五、特效素材模板

### 5.1 粒子特效（1:1）
```
[颜色] [类型] particles, glowing, sparkling, game effect asset, black background, high quality
```

**示例：**
```
golden sparkle particles, glowing, twinkling, game effect asset, black background, high quality
```

### 5.2 光效（1:1）
```
[颜色] [类型] light effect, glowing, radiant, game effect asset, black background, high quality
```

### 5.3 爆炸/冲击（1:1）
```
[颜色] cartoon explosion, kawaii style, dynamic, game effect asset, black background, high quality
```

---

## 六、装饰品模板

### 6.1 室内装饰（1:1）
```
kawaii [装饰品名称], cute cartoon style, pastel colors, game decoration asset, white background, high quality, detailed
```

**示例：**
```
kawaii wooden shelf with cups and plants, cute cartoon style, pastel colors, game decoration asset, white background, high quality
```

### 6.2 室外装饰（1:1）
```
[装饰品名称], [风格] style, detailed, game decoration asset, white background, high quality
```

### 6.3 节日装饰（1:1）
```
[节日] [装饰品名称], festive, colorful, kawaii style, game decoration asset, white background, high quality
```

---

## 七、space-factory-idle专用模板

### 7.1 星球图标（1:1）
```
kawaii [星球名称] planet icon, cute cartoon style, [颜色] colors, glowing atmosphere, game planet asset, space background, high quality, detailed
```

**示例：**
```
kawaii Earth planet icon, cute cartoon style, blue and green colors, glowing atmosphere, clouds, game planet asset, starfield background, high quality, detailed
```

### 7.2 工厂/设备（1:1）
```
kawaii [设备名称] factory machine, cute cartoon style, metallic, glowing buttons, game factory asset, white background, high quality, detailed
```

### 7.3 升级图标（1:1）
```
[升级名称] upgrade icon, kawaii cartoon style, [颜色] theme, glowing, game upgrade asset, white background, high quality
```

**示例：**
```
speed boost upgrade icon, kawaii cartoon style, lightning bolt, yellow and blue theme, glowing, game upgrade asset, white background, high quality
```

### 7.4 成就图标（1:1）
```
[成就名称] achievement badge, kawaii cartoon style, golden, sparkling, game achievement asset, white background, high quality, detailed
```

---

## 八、orbit-odyssey专用模板

### 8.1 太空场景（16:9）
```
kawaii outer space background, cute cartoon style, colorful planets, starfield, nebula, game space background asset, high quality, 4k
```

### 8.2 飞船（1:1）
```
kawaii [飞船类型] spaceship, cute cartoon style, [颜色] colors, game spaceship asset, white background, high quality, detailed
```

### 8.3 行星（1:1）
```
kawaii [行星名称] planet, cute cartoon style, [特征描述], game planet asset, space background, high quality, detailed
```

---

## 九、质量检查清单

生成图片后必须检查：
- [ ] 文件大小 > 5KB（低于=占位符，不允许）
- [ ] 尺寸 >= 512x512（图标）或 1920x1080（背景）
- [ ] 格式为.webp（用cwebp -q 80压缩）
- [ ] 风格与游戏整体一致
- [ ] 颜色搭配和谐
- [ ] 抠图干净（如果加了--remove-bg）

---

## 十、常用画风关键词

| 画风 | 关键词 |
|------|--------|
| 可爱卡通 | kawaii, cute cartoon, pastel colors, big eyes |
| 像素风 | pixel art, retro, 16-bit, 8-bit |
| 赛博朋克 | cyberpunk, neon, futuristic, dark |
| 写实 | realistic, detailed, professional |
| 手绘 | hand drawn, sketch, watercolor |
| 扁平化 | flat design, minimal, clean |
| 3D渲染 | 3D render, glossy, shiny, metallic |

---

*最后更新: 2026-06-03*
*基于bubble-tea-lab 50张素材的生成经验总结*
