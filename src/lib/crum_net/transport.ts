import type { PeerId } from "../crum_pkr/types.ts";

export class MemoryTransport<TMessage = unknown> {
  outbound: Map<PeerId, TMessage[]>;
  inbound: Array<[PeerId, TMessage]>;

  constructor() {
    this.outbound = new Map();
    this.inbound = [];
  }

  static default<TMessage = unknown>(): MemoryTransport<TMessage> {
    return new MemoryTransport<TMessage>();
  }

  push_inbound(from: PeerId, message: TMessage): void {
    this.inbound.push([from, message]);
  }

  drain_outbound_for(peer_id: PeerId): TMessage[] {
    const messages = this.outbound.get(peer_id) ?? [];
    this.outbound.delete(peer_id);
    return messages;
  }

  send(peer_id: PeerId, message: TMessage): void {
    const messages = this.outbound.get(peer_id) ?? [];
    messages.push(message);
    this.outbound.set(peer_id, messages);
  }

  poll(): [PeerId, TMessage] | null {
    return this.inbound.shift() ?? null;
  }
}
