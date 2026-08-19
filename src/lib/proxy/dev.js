import { CHAIN_RPC_URL } from '../chain/index.js';
import { MESH_ENDPOINTS } from '../mesh/index.js';

export const DEV_PROXY = {
  '/local-rpc': {
    target: 'http://localhost:8547',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/local-rpc$/, '/'),
  },
  '/local-mesh': {
    target: 'http://localhost:3001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/local-mesh/, ''),
  },
};

function usesProxyPath(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function devProxyForUrls(urls) {
  const proxy = {};
  for (const [prefix, config] of Object.entries(DEV_PROXY)) {
    if (urls.some((url) => usesProxyPath(url, prefix))) {
      proxy[prefix] = config;
    }
  }
  return proxy;
}

export function devProxyForSelectedConfig() {
  return devProxyForUrls([
    CHAIN_RPC_URL,
    ...MESH_ENDPOINTS.map((endpoint) => endpoint.url),
  ]);
}

export function rewriteDevProxyUrl(path) {
  const entry = Object.entries(DEV_PROXY).find(([prefix]) => (
    usesProxyPath(path, prefix)
  ));
  if (!entry) return path;

  const [, proxy] = entry;
  return new URL(proxy.rewrite(path), proxy.target).toString();
}
