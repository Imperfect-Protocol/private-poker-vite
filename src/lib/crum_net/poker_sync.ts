import { P2pMessage, PokerActionEnvelopeWire, PokerClientState } from "./messages.ts";
import type {
  HandId,
  P2pMessage as P2pMessageShape,
  PeerId,
  PlayerIndex,
  PokerAction,
  PokerActionEnvelopeShape,
  PokerTableLike,
  TableId,
} from "../crum_pkr/types.ts";
import type { MemoryTransport } from "./transport.ts";

export class PokerSyncClient {
  peers: PeerId[];
  client: PokerClientState;
  transport: MemoryTransport<P2pMessageShape>;

  constructor(
    player_index: PlayerIndex,
    table_id: TableId,
    hand_id: HandId,
    peers: PeerId[],
    table: PokerTableLike,
    transport: MemoryTransport<P2pMessageShape>,
  ) {
    this.peers = peers;
    this.client = PokerClientState.new(player_index, table_id, hand_id, table);
    this.transport = transport;
  }

  static new(
    player_index: PlayerIndex,
    table_id: TableId,
    hand_id: HandId,
    peers: PeerId[],
    table: PokerTableLike,
    transport: MemoryTransport<P2pMessageShape>,
  ): PokerSyncClient {
    return new PokerSyncClient(player_index, table_id, hand_id, peers, table, transport);
  }

  submit_local_action(action: PokerAction): void {
    const envelope = this.client.submit_local_action(action);
    this.broadcast(envelope);
  }

  poll_and_apply(): number {
    let applied = 0;
    while (true) {
      const polled = this.transport.poll();
      if (polled == null) {
        break;
      }
      const [, message] = polled;
      if (this.apply_message(message)) {
        applied += 1;
      }
    }
    return applied;
  }

  apply_message(message: P2pMessageShape): boolean {
    if (message.type !== "PokerAction") {
      return false;
    }
    const envelope = message.envelope;
    if ("nop" in envelope || "submit" in envelope) {
      const wire = envelope instanceof PokerActionEnvelopeWire
        ? envelope
        : new PokerActionEnvelopeWire(envelope);
      if (wire.nop) {
        return this.client.apply_nop_wire(wire);
      }
      return this.client.apply_envelope(wire.to_envelope());
    }
    return this.client.apply_envelope(envelope as PokerActionEnvelopeShape);
  }

  current_hand() {
    return this.client.current_hand();
  }

  broadcast(envelope: PokerActionEnvelopeShape): void {
    for (const peer of [...this.peers]) {
      this.transport.send(peer, P2pMessage.PokerAction(envelope));
    }
  }
}
