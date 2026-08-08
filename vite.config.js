/* global process */

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
    proxy: {
      '/local-rpc': {
        target: 'http://localhost:8547',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local-rpc$/, '/'),
      },
    },
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
    'process.env.NEXT_PUBLIC_PRIVATE_POKER_MESH': envValue(
      'NEXT_PUBLIC_PRIVATE_POKER_MESH',
      'PUBLIC_PRIVATE_POKER_MESH',
      'VITE_PRIVATE_POKER_MESH',
    ),
    'process.env.PUBLIC_PRIVATE_POKER_MESH': envValue(
      'PUBLIC_PRIVATE_POKER_MESH',
      'NEXT_PUBLIC_PRIVATE_POKER_MESH',
      'VITE_PRIVATE_POKER_MESH',
    ),
    'process.env.VITE_PRIVATE_POKER_MESH': envValue(
      'VITE_PRIVATE_POKER_MESH',
      'NEXT_PUBLIC_PRIVATE_POKER_MESH',
      'PUBLIC_PRIVATE_POKER_MESH',
    ),
    'process.env.NEXT_PUBLIC_PRIVATE_MESH_ENDPOINTS': envValue(
      'NEXT_PUBLIC_PRIVATE_MESH_ENDPOINTS',
      'PUBLIC_PRIVATE_MESH_ENDPOINTS',
      'VITE_PRIVATE_MESH_ENDPOINTS',
    ),
    'process.env.PUBLIC_PRIVATE_MESH_ENDPOINTS': envValue(
      'PUBLIC_PRIVATE_MESH_ENDPOINTS',
      'NEXT_PUBLIC_PRIVATE_MESH_ENDPOINTS',
      'VITE_PRIVATE_MESH_ENDPOINTS',
    ),
    'process.env.VITE_PRIVATE_MESH_ENDPOINTS': envValue(
      'VITE_PRIVATE_MESH_ENDPOINTS',
      'NEXT_PUBLIC_PRIVATE_MESH_ENDPOINTS',
      'PUBLIC_PRIVATE_MESH_ENDPOINTS',
    ),
  },
})
