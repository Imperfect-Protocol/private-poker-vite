import { VirtualNetworkEventType } from 'privatepoker-p2p';

const normalizeAddress = (value) => String(value ?? '').toLowerCase();

/** One waiting prompt per peer/lobby/table scope, with retries of the same request suppressed. */
export class WaitingPromptPolicy {
  constructor() {
    this.reset();
  }

  reset() {
    this.request = null;
    this.requestIds = new Map();
  }

  static scopeOf(value) {
    return [
      normalizeAddress(value?.peerAddress ?? value?.from),
      value?.lobbyId ?? '',
      value?.tableId ?? '',
    ].join(':');
  }

  apply(event) {
    if (event.type === VirtualNetworkEventType.PEER_WAIT_REQUEST) {
      const scope = WaitingPromptPolicy.scopeOf(event);
      if (this.requestIds.get(scope) === event.requestId) return { kind: 'ignore' };
      this.requestIds.set(scope, event.requestId);
      this.request = event;
      return { kind: 'request', request: event };
    }
    if (
      event.type === VirtualNetworkEventType.PEER_WAIT_ACCEPTED
      || event.type === VirtualNetworkEventType.PEER_WAIT_REJECTED
      || event.type === VirtualNetworkEventType.PEER_CONNECTED
    ) {
      if (this.request && WaitingPromptPolicy.scopeOf(this.request) === WaitingPromptPolicy.scopeOf(event)) {
        this.request = null;
        return { kind: 'clear' };
      }
    }
    return { kind: 'ignore' };
  }

  clear() {
    this.request = null;
  }
}
