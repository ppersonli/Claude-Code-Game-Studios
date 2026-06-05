import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

// PLATFORM env var: 'cg' or 'poki' — controls which SDK is injected
const PLATFORM = process.env.PLATFORM || 'cg'

/**
 * Injects the platform SDK script tag BEFORE Vite's module scripts.
 * Only injects the SDK for the selected platform (cg or poki).
 * Also reorders scripts so SDK loads before game code.
 */
function platformSdkPlugin(): Plugin {
  const cgScript = '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>'
  const pokiScript = '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>'

  return {
    name: 'platform-sdk-order',
    enforce: 'post',
    transformIndexHtml(html) {
      // Determine which SDK to inject based on PLATFORM
      const sdkScript = PLATFORM === 'poki' ? pokiScript : cgScript

      // Remove any existing SDK tags (source HTML shouldn't have them, but be safe)
      html = html.replace(pokiScript, '')
      html = html.replace(cgScript, '')

      // Inject the correct SDK after <meta charset>
      const charsetMeta = '<meta charset="UTF-8">'
      if (html.includes(charsetMeta)) {
        html = html.replace(charsetMeta, `${charsetMeta}\n  ${sdkScript}`)
      } else {
        html = html.replace('<head>', `<head>\n  ${sdkScript}`)
      }

      return html
    },
  }
}

export default defineConfig({
  plugins: [vue(), platformSdkPlugin()],
  base: './',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@types': resolve(__dirname, 'src/types/index.ts'),
    },
  },
  build: {
    outDir: `dist/${PLATFORM}`,
    rollupOptions: {
      input: {
        'home': resolve(__dirname, 'src/games/index.html'),
        'bubble-tea-lab': resolve(__dirname, 'src/games/bubble-tea-lab/index.html'),
        'orbit-odyssey': resolve(__dirname, 'src/games/orbit-odyssey/index.html'),
        'space-factory-idle': resolve(__dirname, 'src/games/space-factory-idle/index.html'),
        'dungeon-defense-idle': resolve(__dirname, 'src/games/dungeon-defense-idle/index.html'),
        'space-farm-idle': resolve(__dirname, 'src/games/space-farm-idle/index.html'),
        'bounce-golf': resolve(__dirname, 'src/games/bounce-golf/index.html'),
        'idle-garden': resolve(__dirname, 'src/games/idle-garden/index.html'),
      },
    },
  },
  server: {
  },
})
