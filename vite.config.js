import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const n8nTarget = env.VITE_N8N_BASE_URL || 'https://aadarsh075.app.n8n.cloud'

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/n8n-proxy': {
          target: n8nTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/n8n-proxy/, ''),
        },
      },
    },
  }
})

