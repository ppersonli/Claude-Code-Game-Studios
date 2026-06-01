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
      const pokiScript = '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>'
      const cgScript = '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>'

      // Only move scripts that are actually present in the source
      const hasPoki = html.includes(pokiScript)
      const hasCG = html.includes(cgScript)

      // Remove originals from their current position
      if (hasPoki) html = html.replace(pokiScript, '')
      if (hasCG) html = html.replace(cgScript, '')

      // Insert after <meta charset> so encoding is set before SDK loads
      const scriptsToInsert = [hasPoki ? pokiScript : '', hasCG ? cgScript : ''].filter(Boolean).join('\n  ')
      if (scriptsToInsert) {
        const charsetMeta = '<meta charset="UTF-8">'
        if (html.includes(charsetMeta)) {
          html = html.replace(charsetMeta, `${charsetMeta}\n  ${scriptsToInsert}`)
        } else {
          // Fallback: insert after <head>
          html = html.replace('<head>', `<head>\n  ${scriptsToInsert}`)
        }
      }

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
        'meme-match': resolve(__dirname, 'src/games/meme-match/index.html'),
        'boba-drop': resolve(__dirname, 'src/games/boba-drop/index.html'),
        'bubble-tea-lab': resolve(__dirname, 'src/games/bubble-tea-lab/index.html'),
        'color-chaos': resolve(__dirname, 'src/games/color-chaos/index.html'),
        'idle-coffee-shop': resolve(__dirname, 'src/games/idle-coffee-shop/index.html'),
        'jelly-pop': resolve(__dirname, 'src/games/jelly-pop/index.html'),
        'waffle-wobble': resolve(__dirname, 'src/games/waffle-wobble/index.html'),
        'bubble-shooter': resolve(__dirname, 'src/games/bubble-shooter/index.html'),
        'boba-tycoon': resolve(__dirname, 'src/games/boba-tycoon/index.html'),
        'boba-runner': resolve(__dirname, 'src/games/boba-runner/index.html'),
        'boba-clicker': resolve(__dirname, 'src/games/boba-clicker/index.html'),
        'boba-tower-defense': resolve(__dirname, 'src/games/boba-tower-defense/index.html'),
        'mochi-merge': resolve(__dirname, 'src/games/mochi-merge/index.html'),
        'number-merge-2048': resolve(__dirname, 'src/games/number-merge-2048/index.html'),
        'block-blast-kawaii': resolve(__dirname, 'src/games/block-blast-kawaii/index.html'),
      },
    },
  },
  server: {
    
  },
})
