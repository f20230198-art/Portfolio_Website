import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2022',
    rollupOptions: {
      input: { main: 'index.html', project: 'project.html' },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false,
  },
})
