import { hexToBytes, toHex } from 'viem';
import {
  RouteBus,
  RouteStore,
  VirtualNetwork,
  VirtualNetworkActivityBus,
  VirtualNetworkConsoleLogger,
  VirtualNetworkLogFormatter,
} from 'privatepoker-p2p';
import {
  make_public_key_from_compressed_slice,
  make_signature_from_compressed_slice,
  sign as blsSign,
  verify as blsVerify,
} from '@/lib/crum_bls';
import { MESH_ENDPOINTS, MESH_ICE_SERVERS } from '@/lib/mesh';

const SUBSCRIPTION_STATE = {
  CREATED: 'Created',
  OFFER_TIMEOUT: 'OfferTimeout',
  PEER_WAITING: 'PeerWaiting',
  PEER_REJECTED: 'PeerRejected',
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
};

const CONNECTION_TIMEOUT_MS = 10_000;
const TRANSPORT_SIGNATURE_SCHEME = 'BLS12-381-G2-PK-G1-SIG';
const MAX_PUBLISHED_MESSAGE_CACHE = 200;
const VISIBLE_SIGNAL_STEPS = new Set([
  'AttemptStarted',
  'AnnounceSent',
  'AnnounceReceived',
  'OfferRequested',
  'OfferCreating',
  'OfferCreated',
  'OfferSuppressed',
  'ReplacingConnection',
  'OfferSent',
  'OfferReceived',
  'AnswerCreating',
  'AnswerSent',
  'AnswerReceived',
  'SignalRelayed',
  'RouteAvailable',
]);

const normalizeAddress = (value) => value?.toLowerCase() ?? '';
const formatSeat = (value) => (value ? value.slice(2, 4).toUpperCase() : '??');
const formatKey = (value) => {
  if (!value) return 'missing';
  const normalized = value.startsWith('0x') ? value : `0x${value}`;
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
};
const ensureHexPrefix = (value) => {
  const normalized = String(value ?? '');
  return normalized.startsWith('0x') ? normalized : `0x${normalized}`;
};
const meshUrls = () => MESH_ENDPOINTS.map((endpoint) => endpoint?.url).filter(Boolean);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function stripTransportFields(message) {
  if (!message || typeof message !== 'object') return message;
  const unsignedMessage = { ...message };
  delete unsignedMessage.rtcSignature;
  delete unsignedMessage.rtcDisagreement;
  return unsignedMessage;
}

function transportSignaturePayload(message, signerAddress) {
  return new TextEncoder().encode(canonicalJson({
    signerAddress: normalizeAddress(signerAddress),
    message: stripTransportFields(message),
  }));
}

function transportMessageKey(message) {
  const unsignedMessage = stripTransportFields(message);
  const wire = unsignedMessage?.wire;
  if (wire) {
    return [
      'wire',
      unsignedMessage.type ?? '',
      wire.table_id ?? '',
      wire.hand_id ?? '',
      wire.from ?? '',
      wire.sequence ?? '',
    ].join(':');
  }
  return canonicalJson(unsignedMessage);
}

function disagreementMessageKey(message) {
  return [
    transportMessageKey(message),
    normalizeAddress(message?.rtcDisagreement?.signer ?? message?.rtcSignature?.signer),
    normalizeAddress(message?.rtcDisagreement?.rejectedBy),
    message?.rtcDisagreement?.reason ?? '',
  ].join(':');
}

function badSignaturePayload(payload) {
  const badPayload = new Uint8Array(payload.length + 1);
  badPayload.set(payload);
  badPayload[payload.length] = 1;
  return badPayload;
}

class PokerPeerSubscription {
  constructor(peerPlayerAddress, peerAnnouncePubKey, callback) {
    this.playerAddress = peerPlayerAddress;
    this.publicAnnounceKey = peerAnnouncePubKey;
    this.callback = callback;
    this.state = SUBSCRIPTION_STATE.CREATED;
  }
}

class VirtualNetworkActivityVisibility {
  static shouldDisplay(event) {
    return (
      VirtualNetworkActivityVisibility.isVisibleConnectionStep(event)
      || event?.type === 'PeerWaiting'
      || event?.type === 'PeerWaitAccepted'
      || event?.type === 'PeerWaitRejected'
      || VirtualNetworkActivityVisibility.isSessionDescriptionMessage(event)
    );
  }

  static isVisibleConnectionStep(event) {
    return event?.type === 'ConnectionStep' && VISIBLE_SIGNAL_STEPS.has(event.step);
  }

  static isSessionDescriptionMessage(event) {
    return (
      (event?.type === 'MessageDelivered' || event?.type === 'MessageReceived')
      && (event.messageData?.type === 'sdp-offer' || event.messageData?.type === 'sdp-answer')
    );
  }
}

export class PokerRtcSession {
  constructor({ onActivity, onStateChange } = {}) {
    this.onActivity = onActivity;
    this.onStateChange = onStateChange;
    this.enqueueControlAction = async (type, task) => task();
    this.blsActionKey = null;
    this.network = null;
    this.networkKey = '';
    this.routeBus = new RouteBus({ channelName: 'private-poker:routes' });
    this.routeStore = new RouteStore({ storageKey: 'private-poker:routes' });
    this.activityBus = new VirtualNetworkActivityBus({ channelName: 'private-poker:debug' });
    this.subscription = null;
    this.connectedPeers = new Set();
    this.publishedMessages = new Map();
    this.seenDisagreements = new Set();
    this.joinLog = new Set();
    this.publishQueue = Promise.resolve();
    this.badSignatureOnce = false;
    this.dropNextMessage = false;
    this.duplicateNextMessage = false;
    this.ready = false;
    this.hasConnectionError = false;
    this.snapshotKey = '';
    this.localMediaStream = null;
    this.mediaSnapshotVersion = 0;
    this.configKey = '';
    this.config = {
      playerAddress: undefined,
      operator: undefined,
      tableId: undefined,
      lobbyId: undefined,
      publicKey: undefined,
      privateKey: undefined,
      operatorPrivateKey: undefined,
      players: [],
      isTableFull: false,
      tableCapacity: 0,
    };
  }

  setCallbacks(callbacks = {}) {
    if (callbacks.enqueueControlAction !== undefined) this.enqueueControlAction = callbacks.enqueueControlAction;
    if (callbacks.blsActionKey !== undefined) this.blsActionKey = callbacks.blsActionKey;
    this.onActivity = callbacks.onActivity;
    this.onStateChange = callbacks.onStateChange;
  }

  update(config) {
    const nextConfigKey = this.makeConfigKey(config);
    if (nextConfigKey === this.configKey) return;
    const previousTableId = this.config.tableId;
    const previousLobbyId = this.config.lobbyId;
    this.configKey = nextConfigKey;
    this.config = {
      ...this.config,
      ...config,
      players: config.players ?? [],
    };
    if (
      previousTableId !== undefined
      && (previousTableId !== this.config.tableId || previousLobbyId !== this.config.lobbyId)
    ) {
      this.resetForTable();
    }
    this.ensureNetwork();
    this.logJoins();
    this.emitState();
  }

  makeConfigKey(config) {
    const players = config.players ?? [];
    const playersKey = players
      .map((player) => [
        normalizeAddress(player?.playerAddress),
        player?.annoncePublicKey ?? player?.announcePublicKey ?? '',
        player?.chips ?? '',
      ].join('/'))
      .join('|');

    return [
      normalizeAddress(config.playerAddress),
      config.tableId ?? '',
      config.lobbyId ?? '',
      config.currentHand ?? '',
      config.publicKey ?? '',
      config.privateKey ? 'private-key-ready' : '',
      config.isTableFull ? 'full' : 'waiting',
      config.tableCapacity ?? 0,
      playersKey,
    ].join('::');
  }

  ensureNetwork() {
    const networkKey = [
      normalizeAddress(this.config.playerAddress),
      this.config.lobbyId ?? '',
      this.config.tableId ?? '',
      this.config.privateKey ? 'private-key-ready' : '',
    ].join(':');
    if (this.network && this.networkKey === networkKey) return this.network;
    if (this.network) this.network.unsubscribe('inbound');
    this.networkKey = networkKey;
    this.network = null;
    if (!this.config.playerAddress || !this.config.privateKey || !this.config.lobbyId || !this.config.tableId) {
      return null;
    }
    this.network = new VirtualNetwork(
      (event) => this.handleVirtualNetworkEvent(event),
      this.config.playerAddress,
      hexToBytes(ensureHexPrefix(this.config.privateKey)),
      {
        lobbyId: String(this.config.lobbyId),
        tableId: String(this.config.tableId),
        meshUrls: meshUrls(),
        iceServers: MESH_ICE_SERVERS,
        broadcastPrefix: 'private-poker',
        role: 'table',
        routeOracle: (route) => this.routeStore.hasLivePeerRoute({
          ownerAddress: this.config.playerAddress,
          peerAddress: route.peerAddress,
          lobbyId: route.lobbyId,
          backgroundTableId: '0',
        }),
      },
    );
    return this.network;
  }

  getSnapshot() {
    const peerStates = {};
    this.config.players.forEach((player) => {
      if (!player?.playerAddress) return;
      const peerKey = normalizeAddress(player.playerAddress);
      const isMe = peerKey === normalizeAddress(this.config.playerAddress);
      if (isMe) {
        peerStates[peerKey] = this.getStatus() === 'connected' ? 'connected' : 'sitting-out';
        return;
      }
      peerStates[peerKey] = this.connectedPeers.has(peerKey)
        ? 'connected'
        : this.subscription?.playerAddress && normalizeAddress(this.subscription.playerAddress) === peerKey
          ? 'connecting'
          : 'sitting-out';
    });

    const state = this.subscription?.state ?? 'None';
    return {
      connectedPeerAddresses: Array.from(this.connectedPeers),
      connectedPeerCount: this.connectedPeers.size,
      expectedPeerCount: this.subscription ? 1 : 0,
      inboundState: this.connectedPeers.size > 0 ? SUBSCRIPTION_STATE.CONNECTED : state,
      outboundState: this.connectedPeers.size > 0 ? SUBSCRIPTION_STATE.CONNECTED : state,
      inboundPeerAddress: this.subscription?.playerAddress ?? null,
      outboundPeerAddress: this.subscription?.playerAddress ?? null,
      peerStates,
      remoteMediaStreams: {},
      mediaSnapshotVersion: this.mediaSnapshotVersion,
      status: this.getStatus(),
    };
  }

  getStatus() {
    if (this.hasConnectionError) return 'error';
    if (!this.config.playerAddress || !this.config.operatorPrivateKey || !this.config.privateKey || !this.config.publicKey) return 'waiting';
    if (!this.config.isTableFull) return 'waiting';
    if (!this.subscription) return 'waiting';
    return this.connectedPeers.size > 0 ? 'connected' : 'connecting';
  }

  emitState() {
    const snapshot = this.getSnapshot();
    const snapshotKey = [
      snapshot.status,
      snapshot.connectedPeerCount,
      snapshot.expectedPeerCount,
      snapshot.inboundState,
      snapshot.outboundState,
      snapshot.connectedPeerAddresses.join('|'),
      JSON.stringify(snapshot.peerStates),
      snapshot.mediaSnapshotVersion,
    ].join('::');
    if (snapshotKey === this.snapshotKey) return;
    this.snapshotKey = snapshotKey;
    this.onStateChange?.(snapshot);
  }

  emitActivity(text, details = undefined) {
    if (details === undefined) console.log(text);
    if (details !== undefined) console.log(text, details);
    this.activityBus.publish({
      source: 'table',
      sender: 'RTC',
      text,
      details,
      ownerAddress: this.config.playerAddress,
      lobbyId: details?.lobbyId ?? this.config.lobbyId,
      tableId: details?.tableId ?? this.config.tableId,
      display: true,
    });
    this.onActivity?.({ text, details, at: new Date(), display: true });
  }

  logActivity(text, details = undefined) {
    VirtualNetworkConsoleLogger.log('poker-session', { text, details });
  }

  getPlayerPublicKey(peerPlayerAddress) {
    const peerKey = normalizeAddress(peerPlayerAddress);
    const player = this.config.players.find((candidate) => normalizeAddress(candidate.playerAddress) === peerKey);
    return player?.annoncePublicKey ?? player?.announcePublicKey ?? undefined;
  }

  getPlayerSeatNo(peerPlayerAddress) {
    const peerKey = normalizeAddress(peerPlayerAddress);
    return this.config.players.find((player) => normalizeAddress(player.playerAddress) === peerKey)?.seatNo ?? null;
  }

  logJoins() {
    this.config.players.forEach((player) => {
      const publicKey = player?.annoncePublicKey ?? player?.announcePublicKey;
      if (!player?.playerAddress || !publicKey) return;
      const isMe = normalizeAddress(player.playerAddress) === normalizeAddress(this.config.playerAddress);
      const activity = Number(this.config.currentHand ?? 0) > 0 ? 'Re-Joined' : 'Join';
      const key = `join:${activity}:${this.config.tableId}:${normalizeAddress(player.playerAddress)}:${publicKey}`;
      if (this.joinLog.has(key)) return;
      this.joinLog.add(key);
      this.emitActivity(isMe
        ? activity === 'Re-Joined' ? '[Me] :: Re-Joined' : `[Me] :: Join ${formatKey(publicKey)}`
        : activity === 'Re-Joined' ? `${formatSeat(player.playerAddress)} :: Re-Joined` : `${formatSeat(player.playerAddress)} :: Join ${formatKey(publicKey)}`);
    });
  }

  subscribeTo(peerPlayerAddress, peerAnnouncePubKey, callback) {
    const peerKey = normalizeAddress(peerPlayerAddress);
    const network = this.ensureNetwork();
    if (!peerKey || !network) return;
    this.subscription = new PokerPeerSubscription(peerPlayerAddress, peerAnnouncePubKey, callback);
    this.connectedPeers.delete(peerKey);
    callback?.(this.getPlayerSeatNo(peerPlayerAddress), {
      kind: 'network',
      state: SUBSCRIPTION_STATE.CREATED,
      playerAddress: peerPlayerAddress,
    });
    this.emitState();
    network.subscribe(
      'inbound',
      'outbound',
      peerPlayerAddress,
      CONNECTION_TIMEOUT_MS,
      String(this.config.lobbyId),
      String(this.config.tableId),
    );
  }

  pokeInboundConnection(peerPlayerAddress, peerAnnouncePubKey, callback) {
    this.subscribeTo(peerPlayerAddress, peerAnnouncePubKey, callback);
  }

  handleVirtualNetworkEvent(event) {
    const activityText = VirtualNetworkLogFormatter.text(this.config.playerAddress, event);
    this.logActivity(activityText, event);
    if (VirtualNetworkActivityVisibility.shouldDisplay(event)) {
      this.emitActivity(activityText, event);
    }
    if (event.type === 'PeerConnected') {
      this.handlePeerConnected(event);
      return;
    }
    if (event.type === 'PeerWaiting') {
      this.handlePeerWaiting(event);
      return;
    }
    if (event.type === 'PeerWaitRejected') {
      this.handlePeerRejected(event);
      return;
    }
    if (event.type === 'PeerDisconnected') {
      this.handlePeerDisconnected(event);
      return;
    }
    if (event.type === 'ConnectionTimeout') {
      this.handleConnectionTimeout(event);
      return;
    }
    if (event.type === 'ConnectionFailed') {
      this.hasConnectionError = true;
      this.emitState();
      return;
    }
    if (event.type === 'MessageReceived') {
      void this.handleIncomingVirtualMessage(event);
    }
  }

  handlePeerConnected(event) {
    const peerKey = normalizeAddress(event.peerAddress);
    if (!peerKey) return;
    this.connectedPeers.add(peerKey);
    if (this.subscription && normalizeAddress(this.subscription.playerAddress) === peerKey) {
      this.subscription.state = SUBSCRIPTION_STATE.CONNECTED;
      this.subscription.callback?.(this.getPlayerSeatNo(this.subscription.playerAddress), {
        kind: 'network',
        state: SUBSCRIPTION_STATE.CONNECTED,
        playerAddress: this.subscription.playerAddress,
      });
    }
    this.hasConnectionError = false;
    this.emitActivity(`${formatSeat(event.peerAddress)} => Connected ${formatKey(this.getPlayerPublicKey(event.peerAddress))}`);
    this.routeBus.publishKeepRoute({
      ownerAddress: this.config.playerAddress,
      peerAddress: event.peerAddress,
      lobbyId: this.config.lobbyId,
      tableId: this.config.tableId,
    });
    if (!this.ready && this.getStatus() === 'connected') this.emitActivity('[Me]: Ready');
    this.ready = this.getStatus() === 'connected';
    this.emitState();
  }

  handlePeerWaiting(event) {
    const peerKey = normalizeAddress(event.peerAddress);
    if (!peerKey) return;
    if (this.subscription && normalizeAddress(this.subscription.playerAddress) === peerKey) {
      this.subscription.state = SUBSCRIPTION_STATE.PEER_WAITING;
      this.subscription.callback?.(this.getPlayerSeatNo(this.subscription.playerAddress), {
        kind: 'network',
        state: SUBSCRIPTION_STATE.PEER_WAITING,
        playerAddress: this.subscription.playerAddress,
      });
    }
    this.emitState();
  }

  handlePeerRejected(event) {
    const peerKey = normalizeAddress(event.peerAddress);
    if (!peerKey) return;
    if (this.subscription && normalizeAddress(this.subscription.playerAddress) === peerKey) {
      this.subscription.state = SUBSCRIPTION_STATE.PEER_REJECTED;
      this.subscription.callback?.(this.getPlayerSeatNo(this.subscription.playerAddress), {
        kind: 'network',
        state: SUBSCRIPTION_STATE.PEER_REJECTED,
        playerAddress: this.subscription.playerAddress,
      });
    }
    this.emitState();
  }

  handlePeerDisconnected(event) {
    const peerKey = normalizeAddress(event.peerAddress);
    this.connectedPeers.delete(peerKey);
    if (this.subscription && normalizeAddress(this.subscription.playerAddress) === peerKey) {
      this.subscription.state = SUBSCRIPTION_STATE.DISCONNECTED;
      this.subscription.callback?.(this.getPlayerSeatNo(this.subscription.playerAddress), {
        kind: 'network',
        state: SUBSCRIPTION_STATE.DISCONNECTED,
        playerAddress: this.subscription.playerAddress,
      });
    }
    if (this.ready) this.emitActivity('Me :: Paused');
    this.ready = false;
    this.emitState();
  }

  handleConnectionTimeout(event) {
    const peerKey = normalizeAddress(event.peerAddress);
    if (this.subscription && normalizeAddress(this.subscription.playerAddress) === peerKey) {
      this.subscription.state = SUBSCRIPTION_STATE.OFFER_TIMEOUT;
      this.subscription.callback?.(this.getPlayerSeatNo(this.subscription.playerAddress), {
        kind: 'network',
        state: SUBSCRIPTION_STATE.OFFER_TIMEOUT,
        playerAddress: this.subscription.playerAddress,
      });
    }
    this.emitState();
  }

  async handleIncomingVirtualMessage(event) {
    const message = event.messageData;
    if (message?.type === 'sdp-offer' || message?.type === 'sdp-answer') return;
    if (message?.rtcDisagreement) {
      await this.handleDisagreementMessage(message);
      return;
    }

    const verification = await this.verifyTransportMessage(message, event.peerAddress);
    if (!verification.ok) {
      await this.rejectTransportMessage(message, event.peerAddress, verification.reason);
      return;
    }

    if (!this.subscription) return;
    this.subscription.callback?.(this.getPlayerSeatNo(this.subscription.playerAddress), {
      kind: 'message',
      message,
      playerAddress: this.subscription.playerAddress,
    });
  }

  async handleDisagreementMessage(message) {
    const signer = message.rtcDisagreement.signer ?? message?.rtcSignature?.signer;
    const disagreementKey = disagreementMessageKey(message);
    if (this.seenDisagreements.has(disagreementKey)) return;
    this.seenDisagreements.add(disagreementKey);
    if (normalizeAddress(message.rtcDisagreement.rejectedBy) === normalizeAddress(this.config.playerAddress)) return;
    this.emitActivity(`[${formatSeat(this.config.playerAddress)}] Seen Invalid Signature from [${formatSeat(signer)}]`);
    if (normalizeAddress(signer) === normalizeAddress(this.config.playerAddress)) {
      await this.republishDisagreedMessage(message);
      return;
    }
    this.forwardDisagreement(message);
  }

  async signTransportMessage(message, options = {}) {
    if (!this.config.playerAddress || !this.config.privateKey || !this.config.publicKey) {
      throw new Error('Cannot sign RTC message without table BLS keys.');
    }
    const unsignedMessage = stripTransportFields(message);
    const payload = transportSignaturePayload(unsignedMessage, this.config.playerAddress);
    const signaturePayload = options.injectBadSignature ? badSignaturePayload(payload) : payload;
    const signature = blsSign(signaturePayload, hexToBytes(ensureHexPrefix(this.config.privateKey)));
    return {
      ...unsignedMessage,
      rtcSignature: {
        scheme: TRANSPORT_SIGNATURE_SCHEME,
        signer: this.config.playerAddress,
        publicKey: ensureHexPrefix(this.config.publicKey),
        signature: toHex(signature.toRawBytes(true)),
      },
    };
  }

  async verifyTransportMessage(message, fallbackSenderAddress) {
    const signature = message?.rtcSignature;
    const signer = signature?.signer ?? fallbackSenderAddress;
    const signerPublicKey = this.getPlayerPublicKey(signer);
    if (!signature?.signature || !signer || !signerPublicKey) {
      return { ok: false, signer, reason: 'missing signature or announce public key' };
    }
    if (signature.scheme !== TRANSPORT_SIGNATURE_SCHEME) {
      return { ok: false, signer, reason: 'unsupported signature scheme' };
    }
    try {
      const payload = transportSignaturePayload(message, signer);
      const signed = make_signature_from_compressed_slice(hexToBytes(ensureHexPrefix(signature.signature)));
      const publicKey = make_public_key_from_compressed_slice(hexToBytes(ensureHexPrefix(signerPublicKey)));
      const ok = blsVerify(payload, publicKey, signed);
      return { ok, signer, reason: ok ? undefined : 'signature mismatch' };
    } catch (error) {
      return { ok: false, signer, reason: error.message };
    }
  }

  cachePublishedMessage(message) {
    this.publishedMessages.set(transportMessageKey(message), stripTransportFields(message));
    if (this.publishedMessages.size <= MAX_PUBLISHED_MESSAGE_CACHE) return;
    const oldestKey = this.publishedMessages.keys().next().value;
    this.publishedMessages.delete(oldestKey);
  }

  armBadSignatureOnce() {
    this.badSignatureOnce = true;
  }

  armDropNextMessage() {
    this.dropNextMessage = true;
  }

  armDuplicateNextMessage() {
    this.duplicateNextMessage = true;
  }

  consumeBadSignatureOnce() {
    if (!this.badSignatureOnce) return false;
    this.badSignatureOnce = false;
    return true;
  }

  sendTransportMessage(message) {
    if (this.dropNextMessage) {
      this.dropNextMessage = false;
      this.logActivity('dropped message', { type: message?.type ?? 'unknown' });
      return 0;
    }
    const network = this.ensureNetwork();
    if (!network) return 0;
    const sendCount = this.duplicateNextMessage ? 2 : 1;
    this.duplicateNextMessage = false;
    let sentCount = 0;
    for (let sendIndex = 0; sendIndex < sendCount; sendIndex += 1) {
      const result = network.send('outbound', message);
      if (result.ok) sentCount += 1;
    }
    this.logActivity('broadcast message', { type: message?.type ?? 'unknown', openChannels: sentCount });
    return sentCount;
  }

  async publishSignedMessage(message) {
    const outgoingMessage = await this.signTransportMessage(message, {
      injectBadSignature: this.consumeBadSignatureOnce(),
    });
    this.cachePublishedMessage(outgoingMessage);
    this.sendTransportMessage(outgoingMessage);
  }

  async republishDisagreedMessage(message) {
    const cachedMessage = this.publishedMessages.get(transportMessageKey(message));
    const unsignedMessage = cachedMessage ?? stripTransportFields(message);
    const signedMessage = await this.signTransportMessage(unsignedMessage);
    this.cachePublishedMessage(signedMessage);
    this.sendTransportMessage(signedMessage);
  }

  forwardDisagreement(message) {
    this.sendTransportMessage(message);
  }

  async rejectTransportMessage(message, fallbackSenderAddress, reason) {
    const signer = message?.rtcSignature?.signer ?? fallbackSenderAddress;
    const rejectedMessage = {
      ...message,
      rtcDisagreement: {
        type: 'Disagreement',
        reason: 'SignatureMismatch',
        detail: reason,
        signer,
        rejectedBy: this.config.playerAddress,
      },
    };
    this.emitActivity(`[${formatSeat(this.config.playerAddress)}] Invalid Signature from [${formatSeat(signer)}]`);
    this.forwardDisagreement(rejectedMessage);
  }

  publishMessage(message) {
    this.publishQueue = this.publishQueue
      .then(() => this.publishSignedMessage(message))
      .catch((error) => {
        this.emitActivity('[Me]: RTC message signing failed');
        console.error('Failed to sign RTC message:', error);
      });
  }

  setLocalMediaStream(localMediaStream) {
    if (this.localMediaStream === localMediaStream) return;
    this.localMediaStream = localMediaStream;
    this.mediaSnapshotVersion += 1;
    this.emitState();
  }

  resetForTable() {
    this.network?.unsubscribe('inbound');
    this.subscription = null;
    this.connectedPeers.clear();
    this.publishedMessages.clear();
    this.seenDisagreements.clear();
    this.ready = false;
    this.hasConnectionError = false;
    this.localMediaStream = null;
    this.snapshotKey = '';
    this.emitState();
  }

  destroy() {
    this.resetForTable();
    this.routeBus.close();
    this.activityBus.close();
  }
}
