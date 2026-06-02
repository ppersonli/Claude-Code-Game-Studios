---
name: game-asset-pipeline
description: 游戏素材生成和抠图流水线。当需要为游戏生成图片素材（角色头像、图标、背景、UI元素等）时使用此Skill。自动调用 Gemini AI 生图 MCP 和 AI 抠图 MCP，支持单张生成、批量生成、背景移除、格式转换、尺寸调整等完整流程。触发关键词：生成图片、生成素材、抠图、去背景、AI画图、game assets。
---

# 游戏素材生成流水线

通过两个 MCP 服务实现完整的素材生成流程：
- **gemini-image-gen**: 通过 Chrome CDP 控制 Gemini AI 生成图片
- **bg-removal**: 使用 rembg AI 移除图片背景

---

## 前置条件

### 1. Chrome CDP（生图必需）

确保 Chrome 以调试模式运行：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223 \
  --user-data-dir=$HOME/.chrome-debug
```

**关键要求**：
- 使用 `127.0.0.1`，不要用 `localhost`（避免 IPv6 问题）
- Chrome 中已登录 Google 账号（Gemini 需要登录）
- 生图前先用 `check_chrome` 工具检查连接状态

### 2. Python 依赖（抠图必需）

首次调用会自动安装，也可手动安装：

```bash
pip install rembg[cpu] Pillow onnxruntime
```

---

## 工作流程

### 流程 A：生成单张游戏素材

**典型场景**: 为游戏生成一个角色头像、图标或背景

```
1. check_chrome → 确认 Chrome 可用
2. generate_image → 生成图片
3. remove_background → 移除背景（如需要透明底）
4. crop_transparent → 裁剪多余透明区域
5. resize_image → 调整到目标尺寸
6. convert_format → 转换为 WebP（如需要）
```

**调用示例**:

```
// 第1步：检查连接
mcp__gemini-image-gen__check_chrome({})

// 第2步：生成图标
mcp__gemini-image-gen__generate_image({
  prompt: "A cute kawaii bubble tea cup icon with tapioca pearls, pastel pink and white colors, kawaii style, cartoon, clean simple design, WHITE BACKGROUND, no text",
  output_path: "/Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba.png",
  aspect_ratio: "1:1"
})

// 第3步：抠图
mcp__bg-removal__remove_background({
  input_path: "/Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba.png",
  output_path: "/Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba_nobg.png"
})

// 第4步：裁剪透明区域
mcp__bg-removal__crop_transparent({
  input_path: "/Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba_nobg.png",
  padding: 4
})

// 第5步：调整尺寸
mcp__bg-removal__resize_image({
  input_path: "/Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba_nobg_cropped.png",
  output_path: "/Users/liyuxuan/Desktop/cc-games/public/assets/icon_boba.webp",
  width: 120,
  height: 120
})
```

### 流程 B：批量生成游戏素材

**典型场景**: 一次生成一组配料图标或角色头像

```
1. check_chrome
2. batch_generate → 批量生成（自动开新会话，15秒间隔）
3. batch_remove_background → 批量抠图
```

**批量生成示例**:

```
mcp__gemini-image-gen__batch_generate({
  images: [
    {
      filename: "icon_taro.webp",
      prompt: "[GENERATE IMAGE] A cute kawaii food icon of purple taro paste for bubble tea, kawaii style, cute cartoon, vibrant purple colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution",
      aspect_ratio: "1:1"
    },
    {
      filename: "icon_mochi.webp",
      prompt: "[GENERATE IMAGE] A cute kawaii food icon of pink mochi rice cake, soft and squishy looking, kawaii style, cute cartoon, vibrant pink colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution",
      aspect_ratio: "1:1"
    }
  ]
})
```

---

## Prompt 编写规范

### 必须遵循的规则

1. **所有 prompt 必须用英文**（Gemini 英文效果远好于中文）
2. **必须以任务标签开头**: `[GENERATE IMAGE]`
3. **指定宽高比写在末尾**: `aspect ratio X:Y, NK resolution`
4. **图标类素材**: 加 `WHITE BACKGROUND, no text`
5. **角色类素材**: 加 `character portrait, full body` 或 `head portrait`

### 风格关键词参考

| 类型 | 推荐关键词 |
|------|-----------|
| 卡通图标 | `kawaii style, cute cartoon, simple clean design, vibrant colors` |
| 角色头像 | `chibi character portrait, big sparkly eyes, kawaii style, super deformed` |
| 食物图标 | `food illustration, kawaii style, cute cartoon, WHITE BACKGROUND` |
| 背景图 | `wide landscape, soft gradient, dreamy atmosphere, no characters` |
| UI元素 | `clean flat design, minimalist, soft rounded corners, pastel colors` |
| 成就徽章 | `achievement badge icon, shiny, sparkles, kawaii style, WHITE BACKGROUND` |

### 示例 Prompt 模板

**配料图标**:
```
[GENERATE IMAGE] A cute kawaii food icon of {food_name} for bubble tea, kawaii style, cute cartoon, vibrant {color} colors, simple clean design, food illustration, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution
```

**角色头像**:
```
[GENERATE IMAGE] A cute kawaii chibi {character_type} character portrait with {features}, big sparkly eyes, kawaii style, super deformed chibi, vibrant colors, cute cartoon, simple clean design, WHITE BACKGROUND, no text. aspect ratio 1:1, 1K resolution
```

**游戏背景**:
```
[GENERATE IMAGE] A cute kawaii {scene} background for a bubble tea shop game, {atmosphere}, pastel colors, soft gradient, dreamy, no characters, game background art style. aspect ratio 16:9, 2K resolution
```

---

## 抠图工具选择指南

| 场景 | 推荐模型 | 说明 |
|------|---------|------|
| 通用素材 | `u2net` | 默认模型，适合大多数场景 |
| 人物角色 | `u2net_human_seg` | 专门优化人物抠图 |
| 高质量需求 | `isnet-general-use` | 更精细但更慢 |
| 动漫风格 | `isnet-anime` | 优化动漫角色边缘 |
| 毛发等精细边缘 | 开启 `alpha_matting: true` | 更精细的边缘处理 |

---

## 常见问题与排查

### Chrome 连接失败
- 检查: `mcp__gemini-image-gen__check_chrome({})`
- 确认 Chrome 使用了 `--remote-debugging-port=9223`
- 确认使用的是 `127.0.0.1` 而非 `localhost`
- 如果 CDP 连接超时，重启 Chrome 后等 2 秒再试

### 生成的图片重复
- 每次生图前 Gemini 会导航到新会话（已内置）
- 批量生成间有 15 秒延迟（已内置）
- 如果还是重复，增加 delay 到 20 秒

### 抠图效果不好
- 尝试 `isnet-general-use` 模型
- 开启 `alpha_matting: true`
- 确保输入图片背景与主体有明显对比

### 依赖安装失败
```bash
pip install "rembg[cpu]" Pillow onnxruntime
# 或指定 Python 版本
python3 -m pip install "rembg[cpu]" Pillow onnxruntime
```

---

## MCP 工具完整列表

### gemini-image-gen
| 工具 | 用途 |
|------|------|
| `generate_image` | 生成单张图片 |
| `batch_generate` | 批量生成多张图片 |
| `check_chrome` | 检查 Chrome CDP 连接状态 |
| `list_generated` | 列出已生成的图片 |

### bg-removal
| 工具 | 用途 |
|------|------|
| `remove_background` | AI 移除图片背景 |
| `batch_remove_background` | 批量移除背景 |
| `crop_transparent` | 裁剪透明区域 |
| `convert_format` | 图片格式转换 |
| `resize_image` | 调整图片尺寸 |
