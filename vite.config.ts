import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_KEY || 'http://localhost:8080',
          changeOrigin: true,
          cookieDomainRewrite: '',
          configure: (proxy) => {
            proxy.on('proxyReq', (request) => {
              // The browser calls the local origin; upstream CSRF still uses cookie + header.
              request.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})
