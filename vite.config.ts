import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { Plugin } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Custom plugin to ensure CrazyGames SDK script tag appears BEFORE
 * Vite's module scripts in the built HTML. Without this, Vite reorders
 * scripts and window.CrazyGames is undefined when the game initializes.
 */
function cgSdkOrderPlugin(): Plugin {
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

export default defineConfig({
  plugins: [vue(), cgSdkOrderPlugin()],
  base: './',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@types': resolve(__dirname, 'src/types/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        'home': resolve(__dirname, 'src/games/index.html'),
        'bubble-tea': resolve(__dirname, 'src/games/bubble-tea/index.html'),
        'meme-match': resolve(__dirname, 'src/games/meme-match/index.html'),
        'boba-drop': resolve(__dirname, 'src/games/boba-drop/index.html'),
        'bubble-tea-lab': resolve(__dirname, 'src/games/bubble-tea-lab/index.html'),
        'boba-sort': resolve(__dirname, 'src/games/boba-sort/index.html'),
        'color-chaos': resolve(__dirname, 'src/games/color-chaos/index.html'),
        'idle-coffee-shop': resolve(__dirname, 'src/games/idle-coffee-shop/index.html'),
        'jelly-pop': resolve(__dirname, 'src/games/jelly-pop/index.html'),
        'sweet-sort': resolve(__dirname, 'src/games/sweet-sort/index.html'),
        'bubble-tea-merge': resolve(__dirname, 'src/games/bubble-tea-merge/index.html'),
      },
    },
  },
  server: {
    open: '/src/games/bubble-tea/index.html',
  },
})
