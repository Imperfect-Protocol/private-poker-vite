import type { MaskedCards, PokerCard, PokerDeck, UnmaskedCards } from "./poker_deck.ts";
import type { PokerHand } from "./poker_hand.ts";
import type { PokerHandState, PokerHandStateEnum } from "./poker_state.ts";

export type PlayerIndex = number;
export type PeerId = string;
export type SeatId = number | string;
export type ChipAmount = number;
export type TableId = number | string;
export type HandId = number | string;
export type Sequence = number;
export type Scalar = bigint;
export type BytesLike = Uint8Array | number[] | ArrayBuffer | string;

export interface G1Point {
  toRawBytes(compressed?: boolean): Uint8Array;
  eq?(other: G1Point): boolean;
  equals?(other: G1Point): boolean;
  multiply(scalar: bigint): G1Point;
}

export interface G2Point {
  toRawBytes(compressed?: boolean): Uint8Array;
  eq?(other: G2Point): boolean;
  equals?(other: G2Point): boolean;
  multiply(scalar: bigint): G2Point;
  negate(): G2Point;
}

export type RandomSource =
  | (() => number)
  | { random(): number }
  | { next(): number };

export interface ShuffleTrace {
  after_index: number;
  claimed_before_index: number;
}

export type UnmaskingSequenceEntry = [PlayerIndex, number, UnmaskedCards[]];
export type StateTuple = [PlayerIndex, number, number];

export type TopologyPolicyValue =
  | "Ring"
  | "Mesh"
  | "RingOneBackup"
  | "RingTwoBackups";

export interface SeatedPeerShape {
  player_index: PlayerIndex;
  peer_id: PeerId;
}

export interface PeerAnnouncementShape {
  peer_id: PeerId;
  player_index: PlayerIndex;
  table_id: TableId;
  annonce_public_key: Uint8Array;
}

export interface EndpointDescriptorShape {
  public_ip: string;
  public_port: number;
  transport_hint: string;
}

export interface HandshakeSignalShape {
  table_id: TableId;
  hand_id: HandId;
  from: PeerId;
  to: PeerId;
  topology: TopologyPolicyValue;
  encrypted_endpoint: Uint8Array;
  nonce: number;
}

export interface PokerHandDisplayData {
  current_player: string;
  current_round: number;
  current_state: string;
  state_type: PokerHandStateEnum["type"] | "Waiting" | string;
  state_label: string;
  dealer_seat_number: number;
  small_blind: number;
  big_blind: number;
  current_pot: string;
  min_bet: number;
  max_bet: number;
  bet_step: number;
  community_cards: string[];
  own_player_cards: string[];
  player_cards_by_seat: Record<number, string[]>;
  player_chips: number[];
  current_round_bets: Array<number | null>;
  active_players: boolean[];
  allin_players: boolean[];
}

export interface PokerTableDisplayData {
  max_players: number;
  max_rounds: number;
  current_players: SeatId[];
  dealer_button: number;
  hand_number: number;
  sequence_number: number;
  current_hand: PokerHandDisplayData;
}

export type PokerEvent = Record<string, unknown> & { type: string };
export type PokerEventListener = (event: PokerEvent) => void;
export type PokerEventUnsubscribe = () => void;

export type PokerSubmitMethod =
  | "submit_shuffled_deck"
  | "submit_small_blind"
  | "submit_big_blind"
  | "submit_player_cards"
  | "submit_player_cards_showdown"
  | "submit_community_cards"
  | "submit_public_key"
  | "submit_bet";

export interface PokerSubmit {
  method: PokerSubmitMethod;
  args: unknown[];
  data?: { args?: unknown[] } & Record<string, unknown>;
}

export interface PokerSubmitOptions {
  publish?: boolean;
}

export interface PokerSubmitResult {
  status: unknown;
  events: PokerEvent[];
}

export type PokerAction =
  | { type: "SubmitShuffledDeck"; player: PlayerIndex; deck: MaskedCards }
  | { type: "SubmitSmallBlind"; player: PlayerIndex }
  | { type: "SubmitBigBlind"; player: PlayerIndex }
  | { type: "SubmitPlayerCards"; player: PlayerIndex; cards: UnmaskedCards[] }
  | { type: "SubmitCommunityCards"; player: PlayerIndex; round: number; cards: UnmaskedCards }
  | { type: "SubmitShowdownCards"; player: PlayerIndex; cards: UnmaskedCards[] }
  | { type: "SubmitBet"; player: PlayerIndex; amount: ChipAmount }
  | { type: "SubmitPublicKey"; player: PlayerIndex; public_key: G2Point; traces: ShuffleTrace[] };

export interface PokerActionEnvelopeShape {
  table_id: TableId;
  hand_id: HandId;
  from: PlayerIndex;
  sequence: Sequence;
  sequence_number?: Sequence | null;
  expected_state: StateTuple;
  action: PokerAction;
  result?: PokerSubmitResult | null;
}

export interface PokerActionEnvelopeWireShape extends Omit<PokerActionEnvelopeShape, "action" | "result"> {
  action?: PokerActionWire | null;
  submit?: PokerSubmit | null;
  nop?: PokerNopWire | null;
  log_lines: string[];
}

export interface PokerNopWire {
  player: PlayerIndex;
  current_player?: PlayerIndex | null;
  reason: string;
}

export type CompressedG1 = Uint8Array;
export type CompressedG2 = Uint8Array;
export type ContractCardBytes = CompressedG1;
export type ContractCardsBytes = ContractCardBytes[];
export type ContractCardSetsBytes = ContractCardsBytes[];
export type ContractUnmaskingSequenceBytes = ContractCardSetsBytes[];

export type PokerActionWire =
  | { type: "SubmitShuffledDeck"; player: PlayerIndex; deck_g1_compressed: CompressedG1[] }
  | { type: "SubmitSmallBlind"; player: PlayerIndex }
  | { type: "SubmitBigBlind"; player: PlayerIndex }
  | { type: "SubmitPlayerCards"; player: PlayerIndex; player_cards_g1_compressed: CompressedG1[][] }
  | { type: "SubmitCommunityCards"; player: PlayerIndex; round: number; cards_g1_compressed: CompressedG1[] }
  | { type: "SubmitShowdownCards"; player: PlayerIndex; player_cards_g1_compressed: CompressedG1[][] }
  | { type: "SubmitBet"; player: PlayerIndex; amount: ChipAmount }
  | { type: "SubmitPublicKey"; player: PlayerIndex; public_key_g2_compressed: CompressedG2; traces: Array<[number, number]> };

export type P2pMessage =
  | { type: "Handshake"; signal: HandshakeSignalShape }
  | { type: "PokerAction"; envelope: PokerActionEnvelopeWireShape | PokerActionEnvelopeShape }
  | { type: "Ack"; from: PeerId; sequence: Sequence }
  | { type: "StateDigest"; from: PeerId; hand_id: HandId; digest: Uint8Array };

export interface PokerClientApplyResult {
  applied: boolean;
  result: PokerSubmitResult | null;
  mismatch?: {
    local: StateTuple;
    remote_expected: StateTuple;
  };
}

export interface PokerTableLike {
  sequence_number: number;
  get_current_hand(): PokerHand | null;
  get_current_hand_mut(): PokerHand | null;
  clear_events?(): void;
}

export type PokerCardText = PokerCard | string | null | undefined;
export type CardStringMatrix = Array<Array<string | null>>;
export type PlayerCardStrings = Record<number, string[]>;

export type { MaskedCards, PokerCard, PokerDeck, PokerHand, PokerHandState, UnmaskedCards };
