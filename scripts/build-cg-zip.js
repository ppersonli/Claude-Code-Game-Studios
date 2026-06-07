#!/usr/bin/env node
/**
 * build-cg-zip.js
 * 
 * 构建后处理脚本：为每个游戏生成独立的CG提交包
 * 1. 读取dist/cg/src/games/<game>/index.html
 * 2. 重写资源路径为 ./assets/xxx
 * 3. 复制所有需要的JS/CSS/图片到平坦目录
 * 4. 生成zip，可直接上传CG
 * 
 * 用法: node scripts/build-cg-zip.js
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST_CG = resolve(ROOT, 'dist/cg')

const games = [
  'bubble-tea-lab',
  'orbit-odyssey', 
  'space-factory-idle',
  'dungeon-defense-idle',
  'space-farm-idle',
  'bounce-golf',
  'idle-garden',
]

console.log('📦 生成CG提交包...\n')

for (const game of games) {
  const srcHtml = resolve(DIST_CG, `src/games/${game}/index.html`)
  if (!existsSync(srcHtml)) {
    console.log(`⚠️  跳过 ${game} (未构建)`)
    continue
  }

  console.log(`🔨 ${game}...`)

  // 创建输出目录
  const outDir = resolve(ROOT, `dist/cg-${game}`)
  mkdirSync(resolve(outDir, 'assets'), { recursive: true })

  // === 步骤0: 复制游戏公共资源 ===
  const gamePublicAssets = resolve(ROOT, `src/games/${game}/public/assets/${game}`)
  if (existsSync(gamePublicAssets)) {
    const destGameAssets = resolve(outDir, 'assets', game)
    mkdirSync(destGameAssets, { recursive: true })
    cpSync(gamePublicAssets, destGameAssets, { recursive: true })
    console.log(`  📁 复制公共资源: assets/${game}/`)
  }

  // 读取HTML
  let html = readFileSync(srcHtml, 'utf-8')

  // === 步骤1: 重写HTML中的资源路径 ===
  // Vite构建的HTML路径: ../../../assets/xxx.js (相对 src/games/<game>/)
  // 我们需要: ./assets/xxx.js (相对于zip根目录)
  html = html.replace(/\.\.\/\.\.\/\.\.\/assets\//g, './assets/')

  // === 步骤2: 收集需要复制的资源 ===
  const assetsToCopy = new Map() // relativePath -> absoluteSourcePath

  // 从HTML中提取资源路径
  const srcRegex = /(?:src|href)="\.\/assets\/([^"]+)"/g
  let match
  while ((match = srcRegex.exec(html)) !== null) {
    assetsToCopy.set(match[1], resolve(DIST_CG, 'assets', match[1]))
  }

  // === 步骤3: 扫描JS文件中的图片/音频引用 ===
  const allAssetsDir = resolve(DIST_CG, 'assets')
  if (existsSync(allAssetsDir)) {
    // 只扫描这个游戏用到的JS文件
    const gameJsFiles = [...assetsToCopy.keys()].filter(f => f.endsWith('.js'))
    
    for (const jsFile of gameJsFiles) {
      const jsPath = resolve(allAssetsDir, jsFile)
      if (!existsSync(jsPath)) continue
      const jsContent = readFileSync(jsPath, 'utf-8')
      
      // 找所有资源引用（五种格式）:
      // 1. "./assets/xxx.webp" — 数据文件中的引用（引号包裹）
      // 2. "./assets/subdir/xxx.webp" — 带子目录的引用
      // 3. `assets/xxx.webp` — Vue编译后的模板字符串（反引号包裹，如 :src="`${BASE_URL}assets/cover.webp`"）
      // 4. "xxx.webp" — new URL("xxx.webp", import.meta.url) 构建后保留
      // 5. import("./xxx.js") — 动态import (国际化等)
      // 简化策略：直接匹配所有 assets/xxx.ext 和 new URL 的裸文件名
      const assetRegex = /(?:\.\/)?assets\/([^"'\x60\s]+\.(?:webp|png|jpg|jpeg|gif|svg|mp3|ogg|wav|json|js|css))/g
      let assetMatch
      while ((assetMatch = assetRegex.exec(jsContent)) !== null) {
        const assetRel = assetMatch[1]
        if (!assetsToCopy.has(assetRel)) {
          assetsToCopy.set(assetRel, resolve(allAssetsDir, assetRel))
        }
      }
      // 也匹配 new URL("xxx.ext", import.meta.url) 格式（无assets/前缀）
      const bareAssetRegex = /new\s+URL\(["']([^"']+\.(?:webp|png|jpg|jpeg|gif|svg|mp3|ogg|wav))["']/g
      let bareMatch
      while ((bareMatch = bareAssetRegex.exec(jsContent)) !== null) {
        const assetRel = bareMatch[1]
        if (!assetsToCopy.has(assetRel)) {
          assetsToCopy.set(assetRel, resolve(allAssetsDir, assetRel))
        }
      }
      // 也匹配 import("./xxx.js") 动态导入（国际化等，无assets/前缀）
      const importRegex = /import\(["']\.\/([^"']+\.(?:js|css|json))["']\)/g
      let importMatch
      while ((importMatch = importRegex.exec(jsContent)) !== null) {
        const assetRel = importMatch[1]
        if (!assetsToCopy.has(assetRel)) {
          assetsToCopy.set(assetRel, resolve(allAssetsDir, assetRel))
        }
      }
    }
  }

  // === 步骤4: 复制HTML ===
  writeFileSync(resolve(outDir, 'index.html'), html)

  // === 步骤5: 复制资源 ===
  let copied = 0
  let missing = 0
  for (const [relPath, srcPath] of assetsToCopy) {
    const destPath = resolve(outDir, 'assets', relPath)
    if (existsSync(srcPath)) {
      mkdirSync(dirname(destPath), { recursive: true })
      cpSync(srcPath, destPath)
      copied++
    } else {
      console.log(`  ⚠️  缺失: assets/${relPath}`)
      missing++
    }
  }

  // === 步骤6: 生成zip ===
  const zipPath = resolve(ROOT, `dist/cg-${game}.zip`)
  try {
    execSync(`cd "${outDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`, { stdio: 'pipe' })
    const zipSize = existsSync(zipPath) ? (statSync(zipPath).size / 1024).toFixed(0) : 0
    const status = missing > 0 ? `⚠️ ${missing}缺失` : '✅'
    console.log(`  ${status} ${copied}个文件 → cg-${game}.zip (${zipSize}KB)`)
  } catch (e) {
    console.log(`  ❌ zip失败: ${e.message}`)
  }
}

console.log('\n✅ 完成! 上传 dist/cg-<game-name>.zip 到CG即可')
