# Claude Code Game Studios -- cc-games 项目

## 技术栈

- **引擎**: Phaser 3
- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite（多入口多出口打包）
- **测试框架**: Vitest + @testing-library/vue + Playwright
- **包管理**: pnpm

## 项目目标

**赚钱。** 做优质休闲游戏，发布到 CrazyGames 和 Poki，通过广告分成盈利。

## 核心原则

1. **测试必须100%覆盖核心逻辑** — 测试不过不能提交
2. **多入口多出口打包** — 每个游戏独立入口，按需加载Phaser引擎
3. **复用组件抽离到shared/** — 减少重复代码
4. **移动端适配** — 触屏操作，响应式布局
5. **美观很重要** — 用户留存靠画风

## 图片素材规则

**需要图片素材时，必须向 Hermes 输出提示词请求生成。**

提示词格式：
```
[Gemini生图请求]
- 用途：xxx（如：游戏图标/角色/背景/道具）
- 画风：kawaii/chibi/cute/pixel art（必须指定）
- 比例：1:1/16:9/9:16/4:3（必须指定）
- 描述：详细描述需要的图片内容
- 数量：需要几张
```

Hermes 会用 Gemini 生成图片，返回文件路径。

## 协作规则

- 需要图片素材时 → 向 Hermes 输出提示词
- 需要做决策时 → 向 Hermes 提问
- 写代码时 → 自主完成，不需要询问
- 测试时 → 确保100%通过

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
├── tests/               # 测试文件
├── vite.config.ts       # 多入口配置
└── CLAUDE.md            # 本文件
```

## 当前任务

重构 ~/Desktop/cc-game/games/ 下的游戏到本项目，使用 Phaser 3 + Vue 3 + TypeScript 技术栈。
