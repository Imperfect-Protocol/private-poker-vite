import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hexToBytes } from 'viem';
import {
  LobbyP2PSession,
  VirtualNetworkActivityBus,
  VirtualNetworkConsoleLogger,
  VirtualNetworkLogFormatter,
} from 'privatepoker-p2p';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import { WaitingPromptPolicy } from '@/lib/lobby/WaitingPromptPolicy';
import { MESH_ENDPOINTS, MESH_ICE_SERVERS } from '@/lib/mesh';

const BACKGROUND_TABLE_ID = '0';
const BROADCAST_PREFIX = 'private-poker';

function ensureHexPrefix(value) {
  const text = String(value ?? '');
  return text.startsWith('0x') ? text : `0x${text}`;
}

function randomPrivateKey() {
  const privateKey = new Uint8Array(32);
  globalThis.crypto?.getRandomValues?.(privateKey);
  return privateKey;
}

function lobbyPrivateKey(accountSession) {
  if (!accountSession?.operatorPrivateKey) return randomPrivateKey();
  return hexToBytes(ensureHexPrefix(accountSession.operatorPrivateKey));
}

function meshUrls() {
  return MESH_ENDPOINTS.map((endpoint) => endpoint?.url).filter(Boolean);
}

class LobbyActivity {
  static bus = new VirtualNetworkActivityBus({ channelName: 'private-poker:debug' });

  static log(ownerAddress, event) {
    const text = VirtualNetworkLogFormatter.text(ownerAddress, event);
    VirtualNetworkConsoleLogger.log('lobby-p2p', {
      text,
      details: event,
    });
    LobbyActivity.bus.publish({
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

/**
 * Owns the Lobby tab's background P2P connections and answers table tabs that
 * ask for a route over BroadcastChannel. All state lives in the tab.
 */
export function useLobbyP2PSession(lobbyId) {
  const accountSessionContext = useAccountSession();
  const accountSession = accountSessionContext?.accountSession;
  const ownerAddress = accountSession?.walletAddress;
  const operatorPrivateKey = accountSession?.operatorPrivateKey;
  const [waitingRequest, setWaitingRequest] = useState(null);
  const policyRef = useRef(null);
  if (policyRef.current === null) policyRef.current = new WaitingPromptPolicy();

  const session = useMemo(() => {
    if (!ownerAddress || !lobbyId) return null;
    return new LobbyP2PSession({
      handler: (event) => {
        LobbyActivity.log(ownerAddress, event);
        const decision = policyRef.current.apply(event);
        if (decision.kind === 'request') setWaitingRequest(decision.request);
        if (decision.kind === 'clear') setWaitingRequest(null);
      },
      address: ownerAddress,
      privateKey: lobbyPrivateKey(accountSession),
      lobbyId: String(lobbyId),
      backgroundTableId: BACKGROUND_TABLE_ID,
      meshUrls: meshUrls(),
      iceServers: MESH_ICE_SERVERS,
      broadcastPrefix: BROADCAST_PREFIX,
    });
  }, [accountSession, lobbyId, operatorPrivateKey, ownerAddress]);

  useEffect(() => {
    if (!session) return undefined;
    session.start();
    return () => {
      session.close();
      policyRef.current.reset();
      setWaitingRequest(null);
    };
  }, [session]);

  const acceptWaitingRequest = useCallback((request) => {
    const activeRequest = request ?? waitingRequest;
    if (!activeRequest || !session) return;
    session.acceptWaitingRequest(activeRequest);
    policyRef.current.clear();
    setWaitingRequest(null);
  }, [session, waitingRequest]);

  const rejectWaitingRequest = useCallback((request) => {
    const activeRequest = request ?? waitingRequest;
    if (!activeRequest || !session) return;
    session.rejectWaitingRequest(activeRequest);
    policyRef.current.clear();
    setWaitingRequest(null);
  }, [session, waitingRequest]);

  return {
    session,
    peerId: session?.peerId ?? null,
    waitingRequest,
    acceptWaitingRequest,
    rejectWaitingRequest,
  };
}
