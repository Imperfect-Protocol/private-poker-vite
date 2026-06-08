import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { standalone } from 'vite-plugin-standalone'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envValue = (...names) => {
  const value = names
    .map((name) => process.env[name])
    .find((candidate) => candidate != null)
  return value == null ? 'undefined' : JSON.stringify(value)
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    standalone({
      entry: {
        index: './server/standalone-entry.js',
      },
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/link': path.resolve(__dirname, './src/shims/next-link.jsx'),
      'next/navigation': path.resolve(__dirname, './src/shims/next-navigation.js'),
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_PRIVATE_POKER_CHAIN': envValue(
      'NEXT_PUBLIC_PRIVATE_POKER_CHAIN',
      'PUBLIC_PRIVATE_POKER_CHAIN',
      'VITE_PRIVATE_POKER_CHAIN',
    ),
    'process.env.NEXT_PUBLIC_PRIVATE_MESH_URL': envValue(
      'NEXT_PUBLIC_PRIVATE_MESH_URL',
      'PUBLIC_PRIVATE_MESH_URL',
      'VITE_PRIVATE_MESH_URL',
    ),
    'process.env.NEXT_PUBLIC_PRIVATE_MESH_SIGNAL_URL': envValue(
      'NEXT_PUBLIC_PRIVATE_MESH_SIGNAL_URL',
      'PUBLIC_PRIVATE_MESH_SIGNAL_URL',
      'VITE_PRIVATE_MESH_SIGNAL_URL',
    ),
  },
})
