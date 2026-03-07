import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on current working directory
  const env = loadEnv(mode, process.cwd(), '')

  // Default values if env is missing
  const port = parseInt(env.VITE_PORT) || 8181
  const target = env.VITE_API_TARGET || 'http://localhost:3333'

  const proxyConfig = {
    '/api': {
      target: target,
      changeOrigin: true,
    },
    '/uploads': {
      target: target,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: port,
      proxy: proxyConfig,
    },
    preview: {
      host: true,
      port: port,
      proxy: proxyConfig,
    },
  }
})
