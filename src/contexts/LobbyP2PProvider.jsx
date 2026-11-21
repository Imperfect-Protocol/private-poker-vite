import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { hexToBytes } from 'viem';
import {
  LobbyP2PSession,
  VirtualNetworkActivityBus,
  VirtualNetworkConsoleLogger,
  VirtualNetworkLogFormatter,
} from 'privatepoker-p2p';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import { LobbyP2PContext } from '@/contexts/LobbyP2PContext.js';
import { PeerDirectory } from '@/lib/peers/PeerDirectory.js';
import { TableTabDirectory } from '@/lib/peers/TableTabDirectory.js';
import { WaitingPromptPolicy } from '@/lib/lobby/WaitingPromptPolicy';
import { MESH_ENDPOINTS, MESH_ICE_SERVERS } from '@/lib/mesh';

const BACKGROUND_TABLE_ID = '0';
const BROADCAST_PREFIX = 'private-poker';
const LOBBY_ROUTE = /^\/lobby\/([^/]+)\/?$/;

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
 * Owns the tab's background lobby P2P connection and answers table tabs that
 * ask for a route over BroadcastChannel. Living above the router means moving
 * between pages in the tab does not tear the network down; entering another
 * lobby swaps the connection.
 */
export function LobbyP2PProvider({ children }) {
  const location = useLocation();
  const accountSessionContext = useAccountSession();
  const accountSession = accountSessionContext?.accountSession;
  const ownerAddress = accountSession?.walletAddress;
  const [waitingRequest, setWaitingRequest] = useState(null);
  const [lobbyId, setLobbyId] = useState(null);
  const [policy] = useState(() => new WaitingPromptPolicy());
  const [peerDirectory] = useState(() => new PeerDirectory());
  const [tableTabDirectory] = useState(() => new TableTabDirectory());
  const [directory, setDirectory] = useState({ peers: [], tableTabs: [] });

  const routeLobbyId = LOBBY_ROUTE.exec(location.pathname)?.[1] ?? null;

  // Entering a lobby updates the remembered id. Leaving for another page keeps
  // it, so the same session instance stays alive across tab navigation.
  if (routeLobbyId && routeLobbyId !== lobbyId) {
    setLobbyId(routeLobbyId);
  }

  const refreshDirectory = useCallback(() => {
    setDirectory({
      peers: peerDirectory.list().filter((peer) => peer.state === 'connected'),
      tableTabs: tableTabDirectory.list(),
    });
  }, [peerDirectory, tableTabDirectory]);

  const handleLobbyEvent = useCallback((event) => {
    LobbyActivity.log(ownerAddress, event);
    if (peerDirectory.apply(event)) refreshDirectory();
    const decision = policy.apply(event);
    if (decision.kind === 'request') setWaitingRequest(decision.request);
    if (decision.kind === 'clear') setWaitingRequest(null);
  }, [ownerAddress, peerDirectory, policy, refreshDirectory]);

  useEffect(() => {
    const bus = new VirtualNetworkActivityBus({ channelName: 'private-poker:debug' });
    bus.listen((activity) => {
      if (tableTabDirectory.observe(activity)) refreshDirectory();
    });
    return () => bus.close();
  }, [refreshDirectory, tableTabDirectory]);

  const session = useMemo(() => {
    if (!ownerAddress || !lobbyId) return null;
    return new LobbyP2PSession({
      handler: handleLobbyEvent,
      address: ownerAddress,
      privateKey: lobbyPrivateKey(accountSession),
      lobbyId: String(lobbyId),
      backgroundTableId: BACKGROUND_TABLE_ID,
      meshUrls: meshUrls(),
      iceServers: MESH_ICE_SERVERS,
      broadcastPrefix: BROADCAST_PREFIX,
    });
  }, [accountSession, handleLobbyEvent, lobbyId, ownerAddress]);

  useEffect(() => {
    if (!session) return undefined;
    session.start();
    return () => {
      session.close();
      policy.reset();
      peerDirectory.clear();
      tableTabDirectory.clear();
      setDirectory({ peers: [], tableTabs: [] });
      setWaitingRequest(null);
    };
  }, [peerDirectory, policy, session, tableTabDirectory]);

  const acceptWaitingRequest = useCallback((request) => {
    const activeRequest = request ?? waitingRequest;
    if (!activeRequest || !session) return;
    session.acceptWaitingRequest(activeRequest);
    policy.clear();
    setWaitingRequest(null);
  }, [policy, session, waitingRequest]);

  const rejectWaitingRequest = useCallback((request) => {
    const activeRequest = request ?? waitingRequest;
    if (!activeRequest || !session) return;
    session.rejectWaitingRequest(activeRequest);
    policy.clear();
    setWaitingRequest(null);
  }, [policy, session, waitingRequest]);

  const value = useMemo(() => ({
    lobbyId,
    session,
    peerId: session?.peerId ?? null,
    peers: directory.peers,
    tableTabs: directory.tableTabs,
    waitingRequest,
    acceptWaitingRequest,
    rejectWaitingRequest,
  }), [
    acceptWaitingRequest,
    directory,
    lobbyId,
    rejectWaitingRequest,
    session,
    waitingRequest,
  ]);

  return (
    <LobbyP2PContext.Provider value={value}>
      {children}
    </LobbyP2PContext.Provider>
  );
}
