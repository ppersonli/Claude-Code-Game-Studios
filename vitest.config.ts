/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@types': resolve(__dirname, 'src/types/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.e2e.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/main.ts', 'src/**/*.d.ts'],
    },
  },
})
