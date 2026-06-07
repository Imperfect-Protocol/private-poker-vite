const DEFAULT_PRIVATE_MESH_ENDPOINTS = [{
  url: 'http://127.0.0.1:3000/resu',
}];

const cleanUrl = (value) => String(value ?? '').trim().replace(/\/+$/, '');

const firstEnv = (...names) => names
  .map((name) => process.env[name])
  .find((candidate) => candidate != null && String(candidate).trim() !== '');

const stripHexPrefix = (value) => String(value ?? '').replace(/^0x/i, '');

const normalizeAddress = (value) => {
  const hex = stripHexPrefix(value).toLowerCase();
  return /^[0-9a-f]{40}$/.test(hex) ? `0x${hex}` : '';
};

const normalizeHex = (value) => {
  const hex = stripHexPrefix(value).toLowerCase();
  if (!/^[0-9a-f]*$/.test(hex) || hex.length % 2 !== 0) return '';
  return `0x${hex}`;
};

const signalListeners = new Set();
const bootstrapEventListeners = new Set();
const activeSessions = new Map();

function parseEndpointList(value) {
  const text = String(value ?? '').trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (typeof entry === 'string') return { url: cleanUrl(entry) };
        if (entry && typeof entry === 'object') return { url: cleanUrl(entry.url) };
        return null;
      })
      .filter((entry) => entry?.url);
  } catch {
    return [];
  }
}

function meshEndpoints() {
  const configured = parseEndpointList(firstEnv(
    'NEXT_PUBLIC_PRIVATE_MESH_ENDPOINTS',
    'PUBLIC_PRIVATE_MESH_ENDPOINTS',
    'VITE_PRIVATE_MESH_ENDPOINTS',
  ));
  const endpoints = configured.length > 0 ? configured : DEFAULT_PRIVATE_MESH_ENDPOINTS;
  const seen = new Set();

  return endpoints.filter(({ url }) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function websocketUrl(url) {
  if (url.startsWith('ws://') || url.startsWith('wss://')) return url;
  if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`;
  if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`;
  return url;
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bootstrapUrl(url, interest) {
  const separator = url.includes('?') ? '&' : '?';
  return `${websocketUrl(url)}${separator}i=${encodeURIComponent(base64UrlEncode(JSON.stringify(interest)))}`;
}

function emitSignal(message) {
  for (const listener of signalListeners) listener(message);
}

function emitBootstrapEvent(message) {
  for (const listener of bootstrapEventListeners) listener(message);
}

function sessionKey(url, signal) {
  return [
    url,
    signal.lobbyId,
    signal.tableId,
    signal.originAddress,
  ].join(':');
}

function isAnswerKind(kind) {
  return kind === 'accept' || kind === 'answer';
}

function rememberPendingSignal(session, signal) {
  if (isAnswerKind(signal.kind)) return;
  session.pendingSignals.set(signal.targetAddress, signal);
}

function markPeerHeard(session, signal) {
  const peer = normalizeAddress(signal?.sender ?? signal?.originAddress);
  if (!peer) return;
  session.pendingSignals.delete(peer);
}

export function getPrivateMeshUrls() {
  return meshEndpoints();
}

function createSignal(signal) {
  const originAddress = normalizeAddress(signal.originAddress ?? signal.sender ?? signal.from);
  const targetAddress = normalizeAddress(signal.targetAddress ?? signal.recipient ?? signal.to);
  const encryptedData = normalizeHex(signal.encryptedData ?? signal.payload);
  const lobbyId = signal.lobbyId?.toString?.() ?? String(signal.lobbyId ?? '');
  const tableId = signal.tableId?.toString?.() ?? String(signal.tableId ?? '');
  const kind = signal.kind ?? signal.signalType ?? 'offer';

  if (!originAddress) throw new Error('Bootstrap origin address must be a 20-byte hex address.');
  if (!targetAddress) throw new Error('Bootstrap target address must be a 20-byte hex address.');
  if (!encryptedData || encryptedData === '0x') throw new Error('Bootstrap payload must be non-empty hex.');
  if (!lobbyId) throw new Error('Bootstrap lobbyId is required.');
  if (!tableId) throw new Error('Bootstrap tableId is required.');

  return {
    type: 'bootstrap-signal',
    version: 1,
    originAddress,
    targetAddress,
    lobbyId,
    tableId,
    encryptedData,
    kind,
  };
}

function sendSessionMessage(session, value) {
  if (session.socket.readyState !== WebSocket.OPEN) {
    session.queue.push(value);
    return false;
  }
  session.socket.send(JSON.stringify(value));
  return true;
}

function openSession(url, firstSignal) {
  const key = sessionKey(url, firstSignal);
  const existing = activeSessions.get(key);
  if (existing && existing.socket.readyState <= WebSocket.OPEN) return existing.ready;

  let resolveReady;
  let rejectReady;
  let readySettled = false;
  const ready = new Promise((resolve, reject) => {
    resolveReady = (value) => {
      readySettled = true;
      resolve(value);
    };
    rejectReady = (error) => {
      readySettled = true;
      reject(error);
    };
  });
  const socket = new WebSocket(bootstrapUrl(url, firstSignal));
  const session = {
    key,
    url,
    socket,
    queue: [{
      type: 'bootstrap-interest',
      signal: firstSignal,
    }],
    pendingSignals: new Map(),
    ready,
  };
  rememberPendingSignal(session, firstSignal);

  activeSessions.set(key, session);

  socket.addEventListener('open', () => {
    console.log('[RTC signal] Private Mesh bootstrap open', {
      url,
      lobbyId: firstSignal.lobbyId,
      tableId: firstSignal.tableId,
      peer: firstSignal.targetAddress,
      queued: session.queue.length,
    });
    for (const queued of session.queue.splice(0)) {
      socket.send(JSON.stringify(queued));
    }
    resolveReady(session);
  }, { once: true });

  socket.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (
      (message?.type === 'bootstrap-offer' || message?.type === 'bootstrap-answer')
      && message.signal
    ) {
      markPeerHeard(session, message.signal);
      emitSignal(message.signal);
    }
  });

  socket.addEventListener('error', (event) => {
    console.log('[RTC signal] Private Mesh bootstrap error', {
      url,
      lobbyId: firstSignal.lobbyId,
      tableId: firstSignal.tableId,
      peer: firstSignal.targetAddress,
      readyState: socket.readyState,
      event,
    });
    rejectReady(new Error(`${url} bootstrap websocket failed`));
  }, { once: true });

  socket.addEventListener('close', (event) => {
    activeSessions.delete(key);
    console.log('[RTC signal] Private Mesh bootstrap close', {
      url,
      lobbyId: firstSignal.lobbyId,
      tableId: firstSignal.tableId,
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      pending: session.pendingSignals.size,
    });
    const pendingSignals = [...session.pendingSignals.values()];
    for (const signal of pendingSignals) {
      emitBootstrapEvent({
        type: 'bootstrap-close',
        url,
        originAddress: signal.originAddress,
        targetAddress: signal.targetAddress,
        lobbyId: signal.lobbyId,
        tableId: signal.tableId,
        kind: signal.kind,
      });
    }
    session.pendingSignals.clear();
    if (!readySettled) {
      rejectReady(new Error(`${url} bootstrap websocket closed before match`));
    }
  }, { once: true });

  return ready;
}

async function sendBootstrapSignal(url, signal) {
  const key = sessionKey(url, signal);
  let session = activeSessions.get(key);

  if (!session || session.socket.readyState > WebSocket.OPEN) {
    if (isAnswerKind(signal.kind)) {
      throw new Error(`${url} bootstrap session is not open for answer`);
    }
    session = await openSession(url, signal);
    return { url, signal, opened: true };
  }

  await session.ready;
  rememberPendingSignal(session, signal);
  console.log('[RTC signal] Private Mesh bootstrap send', {
    url,
    lobbyId: signal.lobbyId,
    tableId: signal.tableId,
    peer: signal.targetAddress,
    kind: signal.kind,
    opened: false,
    readyState: session.socket.readyState,
  });
  sendSessionMessage(session, {
    type: isAnswerKind(signal.kind) ? 'bootstrap-answer' : 'bootstrap-interest',
    signal,
  });
  return { url, signal, opened: false };
}

export async function publishPrivateMeshSignals(signals) {
  const prepared = signals.map(createSignal);
  const results = await Promise.allSettled(meshEndpoints().flatMap((endpoint) => (
    prepared.map((signal) => sendBootstrapSignal(endpoint.url, signal))
  )));

  const accepted = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  const failed = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message ?? String(result.reason));

  if (accepted.length === 0) {
    throw new Error(`Private Mesh bootstrap failed on every endpoint: ${failed.join('; ')}`);
  }

  if (failed.length > 0) {
    console.log('[RTC signal] Private Mesh partial bootstrap failure', failed);
  }

  return {
    accepted: true,
    endpoints: accepted,
    failures: failed,
  };
}

export async function publishPrivateMeshBye({ originAddress, lobbyId, tableId } = {}) {
  const address = normalizeAddress(originAddress);
  if (!address || !lobbyId || !tableId) return;

  for (const endpoint of meshEndpoints()) {
    const prefix = [
      endpoint.url,
      String(lobbyId),
      String(tableId),
      address,
    ].join(':');
    for (const [key, session] of activeSessions) {
      if (!key.startsWith(prefix)) continue;
      await session.ready;
      sendSessionMessage(session, { type: 'bootstrap-bye' });
      session.pendingSignals.clear();
    }
  }
}

export function subscribeToPrivateMeshSignals(recipient, onSignal) {
  const address = normalizeAddress(recipient);
  if (!address) return () => {};

  const listener = (message) => {
    if (normalizeAddress(message?.recipient) !== address) return;
    onSignal(message);
  };

  signalListeners.add(listener);
  return () => signalListeners.delete(listener);
}

export function subscribeToPrivateMeshBootstrapEvents(originAddress, onEvent) {
  const address = normalizeAddress(originAddress);
  if (!address) return () => {};

  const listener = (message) => {
    if (normalizeAddress(message?.originAddress) !== address) return;
    onEvent(message);
  };

  bootstrapEventListeners.add(listener);
  return () => bootstrapEventListeners.delete(listener);
}
