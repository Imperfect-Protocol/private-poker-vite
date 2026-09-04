/* global process */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { standalone } from 'vite-plugin-standalone'
import path from 'path'
import { fileURLToPath } from 'url'
import { devProxyForSelectedConfig } from 'privatepoker-hooks/config/proxy/devServer/dev.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envValue = (...names) => {
  const value = names
    .map((name) => process.env[name])
    .find((candidate) => candidate != null)
  return value == null ? 'undefined' : JSON.stringify(value)
}

const devProxy = devProxyForSelectedConfig()

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
    fs: {
      allow: [
        __dirname,
        path.resolve(__dirname, '../privatepoker-hooks'),
      ],
    },
    ...(Object.keys(devProxy).length > 0 ? { proxy: devProxy } : {}),
  },
  resolve: {
    dedupe: [
      '@reown/appkit',
      '@reown/appkit/react',
      '@tanstack/query-core',
      '@tanstack/react-query',
      '@wagmi/core',
      'react',
      'react-dom',
      'viem',
      'wagmi',
    ],
    alias: [
      { find: /^@reown\/appkit$/, replacement: path.resolve(__dirname, './node_modules/@reown/appkit') },
      { find: /^@reown\/appkit\/react$/, replacement: path.resolve(__dirname, './node_modules/@reown/appkit/dist/esm/exports/react.js') },
      { find: /^@tanstack\/query-core$/, replacement: path.resolve(__dirname, './node_modules/@tanstack/query-core') },
      { find: /^@tanstack\/react-query$/, replacement: path.resolve(__dirname, './node_modules/@tanstack/react-query') },
      { find: /^@wagmi\/core$/, replacement: path.resolve(__dirname, './node_modules/@wagmi/core') },
      { find: /^react$/, replacement: path.resolve(__dirname, './node_modules/react') },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(__dirname, './node_modules/react/jsx-runtime.js') },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(__dirname, './node_modules/react/jsx-dev-runtime.js') },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, './node_modules/react-dom') },
      { find: /^react-dom\/client$/, replacement: path.resolve(__dirname, './node_modules/react-dom/client.js') },
      { find: /^viem$/, replacement: path.resolve(__dirname, './node_modules/viem') },
      { find: /^wagmi$/, replacement: path.resolve(__dirname, './node_modules/wagmi') },
      { find: 'privatepoker-hooks', replacement: path.resolve(__dirname, '../privatepoker-hooks/src') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'next/link', replacement: path.resolve(__dirname, './src/shims/next-link.jsx') },
      { find: 'next/navigation', replacement: path.resolve(__dirname, './src/shims/next-navigation.js') },
    ],
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
