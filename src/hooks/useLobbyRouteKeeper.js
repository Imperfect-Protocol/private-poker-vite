import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hexToBytes } from 'viem';
import {
  LobbyRouteKeeper,
  VirtualNetworkActivityBus,
  VirtualNetworkConsoleLogger,
  VirtualNetworkLogFormatter,
} from 'privatepoker-p2p';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import { MESH_ENDPOINTS, MESH_ICE_SERVERS } from '@/lib/mesh';

const BACKGROUND_TABLE_ID = '0';
const CONNECTION_TIMEOUT_MS = 10_000;
const LIVE_ROUTE_TTL_MS = 120_000;

function normalizeAddress(value) {
  return String(value ?? '').toLowerCase();
}

function ensureHexPrefix(value) {
  const text = String(value ?? '');
  return text.startsWith('0x') ? text : `0x${text}`;
}

function randomPrivateKey() {
  const privateKey = new Uint8Array(32);
  globalThis.crypto?.getRandomValues?.(privateKey);
  return privateKey;
}

function routeKeeperPrivateKey(accountSession) {
  if (!accountSession?.operatorPrivateKey) return randomPrivateKey();
  return hexToBytes(ensureHexPrefix(accountSession.operatorPrivateKey));
}

function meshUrls() {
  return MESH_ENDPOINTS.map((endpoint) => endpoint?.url).filter(Boolean);
}

class LobbyRouteActivity {
  static bus = new VirtualNetworkActivityBus({ channelName: 'private-poker:debug' });

  static log(ownerAddress, event) {
    const text = VirtualNetworkLogFormatter.text(ownerAddress, event);
    VirtualNetworkConsoleLogger.log('lobby-route', {
      text,
      details: event,
    });
    LobbyRouteActivity.bus.publish({
      source: 'lobby',
      sender: 'RTC',
      text,
      details: event,
      ownerAddress,
      lobbyId: event.lobbyId,
      tableId: event.tableId,
      display: true,
    });
  }
}

class LobbyPeerWaitRequest {
  constructor(event) {
    this.requestId = event.requestId;
    this.from = event.from;
    this.to = event.to;
    this.requesterRole = event.requesterRole;
    this.requesterInstanceId = event.requesterInstanceId;
    this.subscriptionLabel = event.subscriptionLabel;
    this.channelLabel = event.channelLabel;
    this.lobbyId = event.lobbyId;
    this.tableId = event.tableId;
    this.peerAddress = event.peerAddress;
    this.waitingReason = event.waitingReason;
  }

  key() {
    return [
      this.requestId ?? '',
      normalizeAddress(this.from),
      normalizeAddress(this.to),
      this.lobbyId ?? '',
      this.tableId ?? '',
    ].join(':');
  }
}

export function useLobbyRouteKeeper(lobbyId) {
  const accountSessionContext = useAccountSession();
  const accountSession = accountSessionContext?.accountSession;
  const ownerAddress = accountSession?.walletAddress;
  const keeperRef = useRef(null);
  const [waitingRequest, setWaitingRequest] = useState(null);
  const keeperKey = useMemo(() => [
    normalizeAddress(ownerAddress),
    lobbyId ?? '',
  ].join(':'), [lobbyId, ownerAddress]);

  useEffect(() => {
    if (!ownerAddress || !lobbyId) return undefined;

    const keeper = new LobbyRouteKeeper(
      (event) => {
        LobbyRouteActivity.log(ownerAddress, event);
        if (event.type === 'PeerWaitRequest') {
          setWaitingRequest(new LobbyPeerWaitRequest(event));
        }
      },
      ownerAddress,
      routeKeeperPrivateKey(accountSession),
      {
        lobbyId: String(lobbyId),
        backgroundTableId: BACKGROUND_TABLE_ID,
        timeoutMs: CONNECTION_TIMEOUT_MS,
        meshUrls: meshUrls(),
        iceServers: MESH_ICE_SERVERS,
        broadcastPrefix: 'private-poker',
        role: 'lobby',
        liveRouteTtlMs: LIVE_ROUTE_TTL_MS,
      },
    );
    keeperRef.current = keeper;
    keeper.start();

    return () => {
      keeper.stop();
      if (keeperRef.current === keeper) keeperRef.current = null;
    };
  }, [accountSession, keeperKey, lobbyId, ownerAddress]);

  const acceptWaitingRequest = useCallback((request) => {
    const activeRequest = request ?? waitingRequest;
    keeperRef.current?.acceptWaitingRequest(activeRequest);
    setWaitingRequest(null);
  }, [waitingRequest]);

  const rejectWaitingRequest = useCallback((request) => {
    const activeRequest = request ?? waitingRequest;
    keeperRef.current?.rejectWaitingRequest(activeRequest);
    setWaitingRequest(null);
  }, [waitingRequest]);

  return {
    waitingRequest,
    acceptWaitingRequest,
    rejectWaitingRequest,
  };
}
