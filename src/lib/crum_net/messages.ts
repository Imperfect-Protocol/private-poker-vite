import { make_public_key_from_compressed_slice, PUBLIC_KEY_COMPRESSED_LEN } from "../crum_bls/util.js";
import { PokerHandProxy, PokerTable } from "../crum_pkr/index.ts";
import type {
  ChipAmount,
  CompressedG1,
  CompressedG2,
  EndpointDescriptorShape,
  G2Point,
  HandId,
  HandshakeSignalShape,
  P2pMessage as P2pMessageShape,
  PeerAnnouncementShape,
  PeerId,
  PlayerIndex,
  PokerAction as PokerActionShape,
  PokerActionEnvelopeShape,
  PokerActionEnvelopeWireShape,
  PokerActionWire,
  PokerClientApplyResult,
  PokerNopWire,
  PokerSubmit,
  PokerSubmitResult,
  PokerTableLike,
  Sequence,
  ShuffleTrace,
  StateTuple,
  TableId,
  TopologyPolicyValue,
} from "../crum_pkr/types.ts";
import {
  deserialize_masked_cards,
  deserialize_unmasked_card_sets,
  deserialize_unmasked_cards,
  serialize_masked_cards,
  serialize_unmasked_card_sets,
  serialize_unmasked_cards,
} from "./poker_deck_serialization.ts";

type SubmitData = Record<string, unknown> & { args?: unknown[] };

export class PeerAnnouncement implements PeerAnnouncementShape {
  peer_id: PeerId;
  player_index: PlayerIndex;
  table_id: TableId;
  annonce_public_key: Uint8Array;

  constructor({ peer_id, player_index, table_id, annonce_public_key }: PeerAnnouncementShape) {
    this.peer_id = peer_id;
    this.player_index = player_index;
    this.table_id = table_id;
    this.annonce_public_key = annonce_public_key;
  }
}

export class EndpointDescriptor implements EndpointDescriptorShape {
  public_ip: string;
  public_port: number;
  transport_hint: string;

  constructor({ public_ip, public_port, transport_hint }: EndpointDescriptorShape) {
    this.public_ip = public_ip;
    this.public_port = public_port;
    this.transport_hint = transport_hint;
  }
}

export class HandshakeSignal implements HandshakeSignalShape {
  table_id: TableId;
  hand_id: HandId;
  from: PeerId;
  to: PeerId;
  topology: TopologyPolicyValue;
  encrypted_endpoint: Uint8Array;
  nonce: number;

  constructor({ table_id, hand_id, from, to, topology, encrypted_endpoint, nonce }: HandshakeSignalShape) {
    this.table_id = table_id;
    this.hand_id = hand_id;
    this.from = from;
    this.to = to;
    this.topology = topology;
    this.encrypted_endpoint = encrypted_endpoint;
    this.nonce = nonce;
  }
}

export class PokerActionEnvelope implements PokerActionEnvelopeShape {
  table_id: TableId;
  hand_id: HandId;
  from: PlayerIndex;
  sequence: Sequence;
  sequence_number: Sequence | null;
  expected_state: StateTuple;
  action: PokerActionShape;
  result: PokerSubmitResult | null;

  constructor({
    table_id,
    hand_id,
    from,
    sequence,
    sequence_number = null,
    expected_state,
    action,
    result = null,
  }: PokerActionEnvelopeShape) {
    this.table_id = table_id;
    this.hand_id = hand_id;
    this.from = from;
    this.sequence = sequence;
    this.sequence_number = sequence_number;
    this.expected_state = expected_state;
    this.action = action;
    this.result = result;
  }

  to_wire(log_lines: string[]): PokerActionEnvelopeWire {
    const action = poker_action_to_wire(this.action);
    return new PokerActionEnvelopeWire({
      table_id: this.table_id,
      hand_id: this.hand_id,
      from: this.from,
      sequence: this.sequence,
      sequence_number: this.sequence_number,
      expected_state: this.expected_state,
      submit: poker_action_wire_to_submit(action),
      log_lines,
    });
  }
}

export class PokerActionEnvelopeWire implements PokerActionEnvelopeWireShape {
  table_id: TableId;
  hand_id: HandId;
  from: PlayerIndex;
  sequence: Sequence;
  sequence_number: Sequence | null;
  expected_state: StateTuple;
  nop: PokerNopWire | null;
  action: PokerActionWire | null;
  submit: PokerSubmit | null;
  log_lines: string[];

  constructor({
    table_id,
    hand_id,
    from,
    sequence,
    sequence_number = null,
    expected_state,
    action,
    submit = null,
    nop = null,
    log_lines,
  }: PokerActionEnvelopeWireShape) {
    this.table_id = table_id;
    this.hand_id = hand_id;
    this.from = from;
    this.sequence = sequence;
    this.sequence_number = sequence_number;
    this.expected_state = expected_state;
    this.nop = nop;
    if (nop) {
      this.action = null;
      this.submit = null;
    } else if (action != null) {
      this.action = action;
      this.submit = submit ?? poker_action_wire_to_submit(action);
    } else if (submit != null) {
      this.action = poker_submit_to_action_wire(submit);
      this.submit = submit;
    } else {
      throw new Error("PokerActionEnvelopeWire requires action, submit, or nop");
    }
    this.log_lines = log_lines;
  }

  to_envelope(): PokerActionEnvelope {
    if (this.nop) {
      throw new Error("NOP wire messages do not have PokerHand submit envelopes");
    }
    if (this.action == null) {
      throw new Error("PokerActionEnvelopeWire has no action");
    }
    return new PokerActionEnvelope({
      table_id: this.table_id,
      hand_id: this.hand_id,
      from: this.from,
      sequence: this.sequence,
      sequence_number: this.sequence_number,
      expected_state: this.expected_state,
      action: poker_action_wire_to_action(this.action),
    });
  }
}

export const P2pMessage = Object.freeze({
  Handshake: (signal: HandshakeSignalShape): P2pMessageShape => ({ type: "Handshake", signal }),
  PokerAction: (
    envelope: PokerActionEnvelope | PokerActionEnvelopeWire | PokerActionEnvelopeShape | PokerActionEnvelopeWireShape,
  ): P2pMessageShape => ({ type: "PokerAction", envelope }),
  Ack: ({ from, sequence }: { from: PeerId; sequence: Sequence }): P2pMessageShape => ({ type: "Ack", from, sequence }),
  StateDigest: ({ from, hand_id, digest }: { from: PeerId; hand_id: HandId; digest: Uint8Array }): P2pMessageShape => ({
    type: "StateDigest",
    from,
    hand_id,
    digest,
  }),
});

export const PokerAction = Object.freeze({
  SubmitShuffledDeck: ({ player, deck }: Omit<Extract<PokerActionShape, { type: "SubmitShuffledDeck" }>, "type">): PokerActionShape => ({
    type: "SubmitShuffledDeck",
    player,
    deck,
  }),
  SubmitSmallBlind: ({ player }: { player: PlayerIndex }): PokerActionShape => ({ type: "SubmitSmallBlind", player }),
  SubmitBigBlind: ({ player }: { player: PlayerIndex }): PokerActionShape => ({ type: "SubmitBigBlind", player }),
  SubmitPlayerCards: ({ player, cards }: Omit<Extract<PokerActionShape, { type: "SubmitPlayerCards" }>, "type">): PokerActionShape => ({
    type: "SubmitPlayerCards",
    player,
    cards,
  }),
  SubmitCommunityCards: ({ player, round, cards }: Omit<Extract<PokerActionShape, { type: "SubmitCommunityCards" }>, "type">): PokerActionShape => ({
    type: "SubmitCommunityCards",
    player,
    round,
    cards,
  }),
  SubmitShowdownCards: ({ player, cards }: Omit<Extract<PokerActionShape, { type: "SubmitShowdownCards" }>, "type">): PokerActionShape => ({
    type: "SubmitShowdownCards",
    player,
    cards,
  }),
  SubmitBet: ({ player, amount }: { player: PlayerIndex; amount: ChipAmount }): PokerActionShape => ({ type: "SubmitBet", player, amount }),
  SubmitPublicKey: ({ player, public_key, traces }: Omit<Extract<PokerActionShape, { type: "SubmitPublicKey" }>, "type">): PokerActionShape => ({
    type: "SubmitPublicKey",
    player,
    public_key,
    traces,
  }),
});

export function poker_action_to_wire(action: PokerActionShape): PokerActionWire {
  switch (action.type) {
    case "SubmitShuffledDeck":
      return {
        type: "SubmitShuffledDeck",
        player: action.player,
        deck_g1_compressed: serialize_masked_cards(action.deck),
      };
    case "SubmitSmallBlind":
      return { type: "SubmitSmallBlind", player: action.player };
    case "SubmitBigBlind":
      return { type: "SubmitBigBlind", player: action.player };
    case "SubmitPlayerCards":
      return {
        type: "SubmitPlayerCards",
        player: action.player,
        player_cards_g1_compressed: serialize_unmasked_card_sets(action.cards),
      };
    case "SubmitCommunityCards":
      return {
        type: "SubmitCommunityCards",
        player: action.player,
        round: action.round,
        cards_g1_compressed: serialize_unmasked_cards(action.cards),
      };
    case "SubmitShowdownCards":
      return {
        type: "SubmitShowdownCards",
        player: action.player,
        player_cards_g1_compressed: serialize_unmasked_card_sets(action.cards),
      };
    case "SubmitBet":
      return { type: "SubmitBet", player: action.player, amount: action.amount };
    case "SubmitPublicKey":
      return {
        type: "SubmitPublicKey",
        player: action.player,
        public_key_g2_compressed: action.public_key.toRawBytes(true),
        traces: action.traces.map((trace) => [trace.after_index, trace.claimed_before_index]),
      };
    default:
      return assertNever(action);
  }
}

export function poker_action_wire_to_submit(action: PokerActionWire): PokerSubmit {
  switch (action.type) {
    case "SubmitShuffledDeck":
      return {
        method: "submit_shuffled_deck",
        args: [action.player, action.deck_g1_compressed],
      };
    case "SubmitSmallBlind":
      return { method: "submit_small_blind", args: [action.player] };
    case "SubmitBigBlind":
      return { method: "submit_big_blind", args: [action.player] };
    case "SubmitPlayerCards":
      return {
        method: "submit_player_cards",
        args: [action.player, action.player_cards_g1_compressed],
      };
    case "SubmitCommunityCards":
      return {
        method: "submit_community_cards",
        args: [action.player, action.round, action.cards_g1_compressed],
      };
    case "SubmitShowdownCards":
      return {
        method: "submit_player_cards_showdown",
        args: [action.player, action.player_cards_g1_compressed],
      };
    case "SubmitPublicKey":
      return {
        method: "submit_public_key",
        args: [action.player, action.public_key_g2_compressed, action.traces],
      };
    case "SubmitBet":
      return {
        method: "submit_bet",
        args: [action.player, action.amount],
      };
    default:
      return assertNever(action);
  }
}

export function poker_submit_to_action_wire(submit: PokerSubmit): PokerActionWire {
  if (!submit?.method) {
    throw new Error("submit method is required");
  }
  const data: SubmitData = submit.data ?? {};
  const args = submit.args ?? data.args ?? [];
  switch (submit.method) {
    case "submit_shuffled_deck":
      return {
        type: "SubmitShuffledDeck",
        player: asPlayerIndex(args[0] ?? data.player),
        deck_g1_compressed: asCompressedG1Array(args[1] ?? data.deck_g1_compressed),
      };
    case "submit_small_blind":
      return { type: "SubmitSmallBlind", player: asPlayerIndex(args[0] ?? data.player) };
    case "submit_big_blind":
      return { type: "SubmitBigBlind", player: asPlayerIndex(args[0] ?? data.player) };
    case "submit_player_cards":
      return {
        type: "SubmitPlayerCards",
        player: asPlayerIndex(args[0] ?? data.player),
        player_cards_g1_compressed: asCompressedG1Matrix(args[1] ?? data.player_cards_g1_compressed),
      };
    case "submit_community_cards":
      return {
        type: "SubmitCommunityCards",
        player: asPlayerIndex(args[0] ?? data.player),
        round: asNumber(args[1] ?? data.round),
        cards_g1_compressed: asCompressedG1Array(args[2] ?? data.cards_g1_compressed),
      };
    case "submit_player_cards_showdown":
      return {
        type: "SubmitShowdownCards",
        player: asPlayerIndex(args[0] ?? data.player),
        player_cards_g1_compressed: asCompressedG1Matrix(args[1] ?? data.player_cards_g1_compressed),
      };
    case "submit_public_key":
      return {
        type: "SubmitPublicKey",
        player: asPlayerIndex(args[0] ?? data.player),
        public_key_g2_compressed: asCompressedG2(args[1] ?? data.public_key_g2_compressed),
        traces: asTraceTuples(args[2] ?? data.traces),
      };
    case "submit_bet":
      return {
        type: "SubmitBet",
        player: asPlayerIndex(args[0] ?? data.player),
        amount: asNumber(args[1] ?? data.amount),
      };
    default:
      throw new Error(`unknown PokerHand submit method: ${submit.method}`);
  }
}

export function poker_action_wire_to_action(action: PokerActionWire): PokerActionShape {
  switch (action.type) {
    case "SubmitShuffledDeck":
      return PokerAction.SubmitShuffledDeck({
        player: action.player,
        deck: deserialize_masked_cards(action.deck_g1_compressed),
      });
    case "SubmitSmallBlind":
      return PokerAction.SubmitSmallBlind({ player: action.player });
    case "SubmitBigBlind":
      return PokerAction.SubmitBigBlind({ player: action.player });
    case "SubmitPlayerCards":
      return PokerAction.SubmitPlayerCards({
        player: action.player,
        cards: deserialize_unmasked_card_sets(action.player_cards_g1_compressed),
      });
    case "SubmitCommunityCards":
      return PokerAction.SubmitCommunityCards({
        player: action.player,
        round: action.round,
        cards: deserialize_unmasked_cards(action.cards_g1_compressed),
      });
    case "SubmitShowdownCards":
      return PokerAction.SubmitShowdownCards({
        player: action.player,
        cards: deserialize_unmasked_card_sets(action.player_cards_g1_compressed),
      });
    case "SubmitBet":
      return PokerAction.SubmitBet({ player: action.player, amount: action.amount });
    case "SubmitPublicKey": {
      if (action.public_key_g2_compressed.length !== PUBLIC_KEY_COMPRESSED_LEN) {
        throw new Error(
          `invalid compressed G2 public-key length: expected ${PUBLIC_KEY_COMPRESSED_LEN}, received ${action.public_key_g2_compressed.length}`
        );
      }
      return PokerAction.SubmitPublicKey({
        player: action.player,
        public_key: make_public_key_from_compressed_slice(action.public_key_g2_compressed) as G2Point,
        traces: action.traces.map(([after_index, claimed_before_index]) => ({
          after_index,
          claimed_before_index,
        })),
      });
    }
    default:
      return assertNever(action);
  }
}

export class PokerClientState {
  player_index: PlayerIndex;
  table_id: TableId;
  hand_id: HandId;
  sequence: Sequence;
  seen: Set<string>;
  table: PokerTableLike;

  constructor(player_index: PlayerIndex, table_id: TableId, hand_id: HandId, table: PokerTableLike) {
    this.player_index = player_index;
    this.table_id = table_id;
    this.hand_id = hand_id;
    this.sequence = 0;
    this.seen = new Set();
    this.table = table;
  }

  static new(player_index: PlayerIndex, table_id: TableId, hand_id: HandId, table: PokerTableLike): PokerClientState {
    return new PokerClientState(player_index, table_id, hand_id, table);
  }

  submit_local_action(action: PokerActionShape): PokerActionEnvelope {
    const expected_state = this.current_state_tuple();
    const result = this.apply_action(clone_action(action));

    this.sequence += 1;
    this.seen.add(seenKey(this.player_index, this.sequence));
    this.table.sequence_number += 1;
    return new PokerActionEnvelope({
      table_id: this.table_id,
      hand_id: this.hand_id,
      from: this.player_index,
      sequence: this.sequence,
      sequence_number: this.table.sequence_number,
      expected_state,
      action,
      result,
    });
  }

  submit_nop(
    { current_player, reason = "your turn not mine" }: { current_player?: PlayerIndex | null; reason?: string } = {},
  ): PokerActionEnvelopeWire {
    const expected_state = this.current_state_tuple();

    return new PokerActionEnvelopeWire({
      table_id: this.table_id,
      hand_id: this.hand_id,
      from: this.player_index,
      sequence: this.sequence,
      sequence_number: this.table.sequence_number,
      expected_state,
      nop: {
        player: this.player_index,
        current_player,
        reason,
      },
      log_lines: [],
    });
  }

  apply_envelope(envelope: PokerActionEnvelope | PokerActionEnvelopeShape): boolean {
    return this.apply_envelope_result(envelope).applied;
  }

  apply_envelope_result(envelope: PokerActionEnvelope | PokerActionEnvelopeShape): PokerClientApplyResult {
    if (envelope.table_id !== this.table_id || envelope.hand_id !== this.hand_id) {
      return { applied: false, result: null };
    }

    const key = seenKey(envelope.from, envelope.sequence);
    if (this.seen.has(key)) {
      return { applied: false, result: null };
    }

    const current_state = this.current_state_tuple();
    if (!tupleEquals(current_state, envelope.expected_state)) {
      return {
        applied: false,
        result: null,
        mismatch: {
          local: current_state,
          remote_expected: envelope.expected_state,
        },
      };
    }

    this.seen.add(key);
    if (envelope.from === this.player_index) {
      this.sequence = Math.max(
        Number(this.sequence ?? 0),
        Number(envelope.sequence ?? 0),
      );
    }
    const result = this.apply_action(envelope.action);
    this.table.sequence_number = Math.max(
      Number(this.table.sequence_number ?? 0),
      Number(envelope.sequence_number ?? 0),
    );
    this.table.clear_events?.();
    return { applied: true, result };
  }

  apply_nop_wire(wire: PokerActionEnvelopeWire | PokerActionEnvelopeWireShape): boolean {
    if (wire.table_id !== this.table_id || wire.hand_id !== this.hand_id) {
      return false;
    }
    return true;
  }

  current_hand() {
    return this.table.get_current_hand();
  }

  current_hand_mut() {
    const hand = this.table.get_current_hand_mut();
    if (hand == null) {
      throw new Error("hand not started");
    }
    return hand;
  }

  current_state_tuple(): StateTuple {
    const hand = this.table.get_current_hand();
    if (hand == null) {
      throw new Error("hand not started");
    }
    return hand.get_current_state().to_tuple();
  }

  apply_action(action: PokerActionShape): PokerSubmitResult {
    const hand = this.current_hand_mut();
    const proxy = new PokerHandProxy(hand);
    switch (action.type) {
      case "SubmitShuffledDeck":
        return proxy.submit_shuffled_deck(action.player, action.deck, { publish: false });
      case "SubmitSmallBlind":
        return proxy.submit_small_blind(action.player, { publish: false });
      case "SubmitBigBlind":
        return proxy.submit_big_blind(action.player, { publish: false });
      case "SubmitPlayerCards":
        return proxy.submit_player_cards(action.player, action.cards, { publish: false });
      case "SubmitCommunityCards":
        return proxy.submit_community_cards(action.player, action.round, action.cards, { publish: false });
      case "SubmitShowdownCards":
        return proxy.submit_player_cards_showdown(action.player, action.cards, { publish: false });
      case "SubmitBet":
        return proxy.submit_bet(action.player, action.amount, { publish: false });
      case "SubmitPublicKey":
        return proxy.submit_public_key(action.player, action.public_key, action.traces, { publish: false });
      default:
        return assertNever(action);
    }
  }
}

export const PokerGameClientState = PokerClientState;

function clone_action(action: PokerActionShape): PokerActionShape {
  switch (action.type) {
    case "SubmitShuffledDeck":
      return { ...action, deck: action.deck.clone() };
    case "SubmitPlayerCards":
    case "SubmitShowdownCards":
      return { ...action, cards: action.cards.map((cards) => cards.clone()) };
    case "SubmitCommunityCards":
      return { ...action, cards: action.cards.clone() };
    case "SubmitPublicKey":
      return { ...action, traces: action.traces.map((trace) => ({ ...trace })) };
    case "SubmitSmallBlind":
    case "SubmitBigBlind":
    case "SubmitBet":
      return { ...action };
    default:
      return assertNever(action);
  }
}

function seenKey(player: PlayerIndex, sequence: Sequence): string {
  return `${player}:${sequence}`;
}

function tupleEquals(left: StateTuple, right: StateTuple): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function asNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("expected finite number");
  }
  return value;
}

function asPlayerIndex(value: unknown): PlayerIndex {
  return asNumber(value);
}

function asCompressedG1(value: unknown): CompressedG1 {
  if (!(value instanceof Uint8Array)) {
    throw new Error("expected compressed G1 bytes");
  }
  return value;
}

function asCompressedG2(value: unknown): CompressedG2 {
  if (!(value instanceof Uint8Array)) {
    throw new Error("expected compressed G2 bytes");
  }
  return value;
}

function asCompressedG1Array(value: unknown): CompressedG1[] {
  if (!Array.isArray(value)) {
    throw new Error("expected compressed G1 byte array");
  }
  return value.map(asCompressedG1);
}

function asCompressedG1Matrix(value: unknown): CompressedG1[][] {
  if (!Array.isArray(value)) {
    throw new Error("expected compressed G1 byte matrix");
  }
  return value.map(asCompressedG1Array);
}

function asTraceTuples(value: unknown): Array<[number, number]> {
  if (!Array.isArray(value)) {
    throw new Error("expected shuffle trace tuples");
  }
  return value.map((trace) => {
    if (!Array.isArray(trace) || trace.length !== 2) {
      throw new Error("expected shuffle trace tuple");
    }
    return [asNumber(trace[0]), asNumber(trace[1])];
  });
}

function assertNever(value: never): never {
  throw new Error(`unexpected variant: ${String(value)}`);
}

export { PokerTable };
