import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig((env) => mergeConfig(
  viteConfig(env),
  {
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/tests/setupTests.ts',
      passWithNoTests: true,
    },
  },
))
