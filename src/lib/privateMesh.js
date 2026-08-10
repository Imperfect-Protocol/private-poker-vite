import { MESH_ENDPOINTS } from '@/lib/mesh';

const cleanUrl = (value) => String(value ?? '').trim().replace(/\/+$/, '');
const stripHexPrefix = (value) => String(value ?? '').replace(/^0x/i, '');

const normalizeAddress = (value) => {
  const hex = stripHexPrefix(value).toLowerCase();
  return /^[0-9a-f]{40}$/.test(hex) ? `0x${hex}` : '';
};

function meshEndpoints() {
  const seen = new Set();
  return MESH_ENDPOINTS
    .map((endpoint) => ({ url: cleanUrl(endpoint?.url) }))
    .filter(({ url }) => {
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function getRandomMeshEndpoint() {
  const endpoints = meshEndpoints();
  if (endpoints.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * endpoints.length);
  return endpoints[randomIndex].url;
}

async function sendAndPoll(url, lobbyId, tableId, peer, messages, callback) {
  const queue = [...messages];
  let keepAlive = true;

  const enqueueFn = (m) => {
    if (m) queue.push(m);
  };

  try {
    while (keepAlive || queue.length > 0) {
      keepAlive = false;
      const rawOutbound = queue.splice(0);
      const outbound = [];

      for (const item of rawOutbound) {
        const resolved = typeof item === 'function' ? await item() : await item;
        if (resolved) {
          if (Array.isArray(resolved)) {
            outbound.push(...resolved);
          } else {
            outbound.push(resolved);
          }
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lobbyId: String(lobbyId),
          tableId: String(tableId),
          peer: normalizeAddress(peer),
          messages: outbound,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = await response.json().catch(() => null);
      const inboundMessages = Array.isArray(body?.messages) ? body.messages : [];

      for (const msg of inboundMessages) {
        let inboundMessage = msg;

        if (msg.type === 'keep-alive') {
          keepAlive = true;
          continue;
        }

        if (msg.type === 'trigger-offer') {
          inboundMessage = {
            type: 'trigger-offer',
            target: normalizeAddress(msg.target),
            lobbyId: msg.lobbyId,
            tableId: msg.tableId,
            recipient: normalizeAddress(peer),
          };
        } else if (msg.type === 'p2p-route-available') {
          inboundMessage = {
            type: 'p2p-route-available',
            target: normalizeAddress(msg.target),
            status: msg.status,
            lobbyId: msg.lobbyId,
            tableId: msg.tableId,
            recipient: normalizeAddress(peer),
          };
        } else if (msg.signal) {
          inboundMessage = msg.signal;
        }

        if (typeof callback === 'function') {
          await callback(inboundMessage, enqueueFn);
        }
      }
    }
    console.debug(`[privateMesh] poll thread existed for: ${lobbyId}:${tableId}`);
  } catch (error) {
    console.warn('[privateMesh] poll thread error:', error.message);
  }
}

export async function announcePrivateMesh({ originAddress, lobbyId, tableId, lookingFor = [], callback }) {
  const peer = normalizeAddress(originAddress);
  if (!peer || !lobbyId || !tableId || typeof callback !== 'function') return;

  const url = getRandomMeshEndpoint();
  if (!url) return;

  const targets = lookingFor.map(normalizeAddress).filter(Boolean);

  void sendAndPoll(
    url,
    lobbyId,
    tableId,
    peer,
    [{
      type: 'bootstrap-announce',
      peer,
      lookingFor: targets,
    }],
    callback,
  );
}

export function publishPrivateMesh(signals, enqueue) {
  const messages = signals.map((signal) => ({
    type: signal.kind === 'accept' || signal.kind === 'answer' ? 'bootstrap-answer' : 'bootstrap-interest',
    signal,
  }));

  if (typeof enqueue === 'function') {
    messages.forEach((msg) => enqueue(msg));
  }
  return { accepted: true, messages };
}

export function publishPrivateMeshBye({ originAddress, enqueue } = {}) {
  const message = { type: 'bootstrap-bye' };
  if (typeof enqueue === 'function') {
    enqueue(message);
  }
  return message;
}

export function getPrivateMeshUrls() {
  return meshEndpoints();
}