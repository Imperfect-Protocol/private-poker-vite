const CONNECTED_EVENTS = new Set(['PeerConnected', 'PeerWaiting', 'PeerWaitRequest']);
const DISCONNECTED_EVENTS = new Set(['PeerDisconnected', 'ConnectionTimeout', 'ConnectionFailed']);

/**
 * In-memory list of peers the lobby tab has connected to. Fed by the lobby's
 * P2P events so the UI can show who is around without reaching into the host.
 */
export class PeerDirectory {
  constructor() {
    this.peers = new Map();
  }

  apply(event, now = Date.now()) {
    const address = event?.peerAddress ?? event?.from;
    if (!address) return false;

    const key = String(address).toLowerCase();

    if (DISCONNECTED_EVENTS.has(event.type)) {
      return this.peers.delete(key);
    }

    if (!CONNECTED_EVENTS.has(event.type)) return false;

    const peer = this.peers.get(key) ?? { address: String(address), connectedAt: now };
    peer.lobbyId = event.lobbyId ?? peer.lobbyId ?? null;
    peer.tableId = event.tableId ?? peer.tableId ?? null;
    peer.state = event.type === 'PeerConnected' ? 'connected' : 'waiting';
    peer.lastEvent = event.type;
    peer.connectedAt = event.type === 'PeerConnected' ? now : peer.connectedAt;
    this.peers.set(key, peer);
    return true;
  }

  list() {
    return [...this.peers.values()].sort((left, right) => left.connectedAt - right.connectedAt);
  }

  clear() {
    this.peers.clear();
  }
}
