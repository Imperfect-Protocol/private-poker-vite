import type {
  HandId,
  HandshakeSignalShape,
  P2pMessage,
  PeerAnnouncementShape,
  PeerId,
  PlayerIndex,
  PokerAction,
  PokerActionEnvelopeWireShape,
  SeatedPeerShape,
  TableId,
  TopologyPolicyValue,
} from "../crum_pkr/types.ts";
import type { PokerClientState } from "./messages.ts";
import type { SyncFrame } from "./sync_stream.ts";

export type LobbyId = number;

export const NetworkRole = Object.freeze({
  ClientServer: "ClientServer",
  PeerToPeer: "PeerToPeer",
});

export type NetworkRoleValue = (typeof NetworkRole)[keyof typeof NetworkRole];

export class TableSpec {
  lobby_id: LobbyId;
  topology: TopologyPolicyValue;
  min_players: number;
  max_players: number;
  buy_in_chips: number;
  metadata: string | null;

  constructor(lobby_id: LobbyId, topology: TopologyPolicyValue) {
    this.lobby_id = lobby_id;
    this.topology = topology;
    this.min_players = 2;
    this.max_players = 9;
    this.buy_in_chips = 0;
    this.metadata = null;
  }

  static new(lobby_id: LobbyId, topology: TopologyPolicyValue): TableSpec {
    return new TableSpec(lobby_id, topology);
  }

  with_player_limits(min_players: number, max_players: number): TableSpec {
    this.min_players = min_players;
    this.max_players = max_players;
    return this;
  }

  with_buy_in_chips(buy_in_chips: number): TableSpec {
    this.buy_in_chips = buy_in_chips;
    return this;
  }

  with_metadata(metadata: string): TableSpec {
    this.metadata = metadata;
    return this;
  }
}

export class TableHandle {
  lobby_id: LobbyId;
  table_id: TableId;
  topology: TopologyPolicyValue;
  seated: SeatedPeerShape[];
  hand_id: HandId | null;

  constructor(lobby_id: LobbyId, table_id: TableId, topology: TopologyPolicyValue) {
    this.lobby_id = lobby_id;
    this.table_id = table_id;
    this.topology = topology;
    this.seated = [];
    this.hand_id = null;
  }

  static new(lobby_id: LobbyId, table_id: TableId, topology: TopologyPolicyValue): TableHandle {
    return new TableHandle(lobby_id, table_id, topology);
  }

  with_seated(seated: SeatedPeerShape[]): TableHandle {
    this.seated = seated;
    return this;
  }

  with_hand_id(hand_id: HandId): TableHandle {
    this.hand_id = hand_id;
    return this;
  }

  seat(player_index: PlayerIndex): SeatedPeerShape | null {
    return this.seated.find((peer) => peer.player_index === player_index) ?? null;
  }
}

export class SignalBundle {
  table_id: TableId;
  hand_id: HandId | null;
  from: PeerId;
  recipients: PeerId[];
  encrypted_data: Uint8Array[];

  constructor(table_id: TableId, from: PeerId, recipients: PeerId[], encrypted_data: Uint8Array[]) {
    this.table_id = table_id;
    this.hand_id = null;
    this.from = from;
    this.recipients = recipients;
    this.encrypted_data = encrypted_data;
  }

  static new(table_id: TableId, from: PeerId, recipients: PeerId[], encrypted_data: Uint8Array[]): SignalBundle {
    return new SignalBundle(table_id, from, recipients, encrypted_data);
  }

  with_hand_id(hand_id: HandId): SignalBundle {
    this.hand_id = hand_id;
    return this;
  }
}

export class NetworkRunRequest {
  table: TableHandle;
  role: NetworkRoleValue;
  local_peer_id: PeerId;
  local_player_index: PlayerIndex;

  constructor(table: TableHandle, role: NetworkRoleValue, local_peer_id: PeerId, local_player_index: PlayerIndex) {
    this.table = table;
    this.role = role;
    this.local_peer_id = local_peer_id;
    this.local_player_index = local_player_index;
  }

  static new(
    table: TableHandle,
    role: NetworkRoleValue,
    local_peer_id: PeerId,
    local_player_index: PlayerIndex,
  ): NetworkRunRequest {
    return new NetworkRunRequest(table, role, local_peer_id, local_player_index);
  }
}

export type LobbyCommandShape =
  | { type: "CreateTable"; spec: TableSpec; annonce_public_key: Uint8Array }
  | { type: "JoinTable"; table_id: TableId; annonce_public_key: Uint8Array }
  | { type: "LeaveTable"; table_id: TableId }
  | { type: "StartHand"; table_id: TableId }
  | { type: "SendSignal"; signal_bundle: SignalBundle }
  | { type: "RunNetwork"; request: NetworkRunRequest };

export const LobbyCommand = Object.freeze({
  CreateTable: ({ spec, annonce_public_key }: { spec: TableSpec; annonce_public_key: Uint8Array }): LobbyCommandShape => ({
    type: "CreateTable",
    spec,
    annonce_public_key,
  }),
  JoinTable: ({ table_id, annonce_public_key }: { table_id: TableId; annonce_public_key: Uint8Array }): LobbyCommandShape => ({
    type: "JoinTable",
    table_id,
    annonce_public_key,
  }),
  LeaveTable: ({ table_id }: { table_id: TableId }): LobbyCommandShape => ({ type: "LeaveTable", table_id }),
  StartHand: ({ table_id }: { table_id: TableId }): LobbyCommandShape => ({ type: "StartHand", table_id }),
  SendSignal: (signal_bundle: SignalBundle): LobbyCommandShape => ({ type: "SendSignal", signal_bundle }),
  RunNetwork: (request: NetworkRunRequest): LobbyCommandShape => ({ type: "RunNetwork", request }),
});

export type NetworkEventShape =
  | { type: "TableCreated"; table: TableHandle }
  | { type: "TableJoined"; table: TableHandle; player_index: PlayerIndex }
  | { type: "PlayerAnnounced"; peer_announcement: PeerAnnouncementShape }
  | { type: "SignalReceived"; handshake_signal: HandshakeSignalShape }
  | { type: "SignalPublished"; signal_bundle: SignalBundle }
  | { type: "HandStarted"; table_id: TableId; hand_id: HandId }
  | { type: "PokerActionReceived"; envelope: PokerActionEnvelopeWireShape }
  | { type: "PokerActionBroadcast"; envelope: PokerActionEnvelopeWireShape }
  | { type: "SyncFrameReceived"; frame: SyncFrame }
  | { type: "NetworkReady"; table_id: TableId; connected_peers: PeerId[] }
  | { type: "NetworkStopped"; table_id: TableId }
  | { type: "Error"; message: string };

export const NetworkEvent = Object.freeze({
  TableCreated: ({ table }: { table: TableHandle }): NetworkEventShape => ({ type: "TableCreated", table }),
  TableJoined: ({ table, player_index }: { table: TableHandle; player_index: PlayerIndex }): NetworkEventShape => ({
    type: "TableJoined",
    table,
    player_index,
  }),
  PlayerAnnounced: (peer_announcement: PeerAnnouncementShape): NetworkEventShape => ({
    type: "PlayerAnnounced",
    peer_announcement,
  }),
  SignalReceived: (handshake_signal: HandshakeSignalShape): NetworkEventShape => ({ type: "SignalReceived", handshake_signal }),
  SignalPublished: (signal_bundle: SignalBundle): NetworkEventShape => ({ type: "SignalPublished", signal_bundle }),
  HandStarted: ({ table_id, hand_id }: { table_id: TableId; hand_id: HandId }): NetworkEventShape => ({
    type: "HandStarted",
    table_id,
    hand_id,
  }),
  PokerActionReceived: (envelope: PokerActionEnvelopeWireShape): NetworkEventShape => ({ type: "PokerActionReceived", envelope }),
  PokerActionBroadcast: (envelope: PokerActionEnvelopeWireShape): NetworkEventShape => ({ type: "PokerActionBroadcast", envelope }),
  SyncFrameReceived: (frame: SyncFrame): NetworkEventShape => ({ type: "SyncFrameReceived", frame }),
  NetworkReady: ({ table_id, connected_peers }: { table_id: TableId; connected_peers: PeerId[] }): NetworkEventShape => ({
    type: "NetworkReady",
    table_id,
    connected_peers,
  }),
  NetworkStopped: ({ table_id }: { table_id: TableId }): NetworkEventShape => ({ type: "NetworkStopped", table_id }),
  Error: ({ message }: { message: string }): NetworkEventShape => ({ type: "Error", message }),
});

export type PlayerEventShape =
  | { type: "CommandAccepted"; command: LobbyCommandShape }
  | { type: "Network"; event: NetworkEventShape }
  | { type: "LocalActionRequested"; action: PokerAction }
  | { type: "Tick" };

export const PlayerEvent = Object.freeze({
  CommandAccepted: (command: LobbyCommandShape): PlayerEventShape => ({ type: "CommandAccepted", command }),
  Network: (event: NetworkEventShape): PlayerEventShape => ({ type: "Network", event }),
  LocalActionRequested: (action: PokerAction): PlayerEventShape => ({ type: "LocalActionRequested", action }),
  Tick: { type: "Tick" } as PlayerEventShape,
});

export class PlayerContext {
  role: NetworkRoleValue;
  local_peer_id: PeerId;
  local_player_index: PlayerIndex | null;
  table: TableHandle | null;
  poker: PokerClientState | null;

  constructor(role: NetworkRoleValue, local_peer_id: PeerId) {
    this.role = role;
    this.local_peer_id = local_peer_id;
    this.local_player_index = null;
    this.table = null;
    this.poker = null;
  }

  static new(role: NetworkRoleValue, local_peer_id: PeerId): PlayerContext {
    return new PlayerContext(role, local_peer_id);
  }

  static for_table(
    role: NetworkRoleValue,
    local_peer_id: PeerId,
    local_player_index: PlayerIndex,
    table: TableHandle,
  ): PlayerContext {
    const context = new PlayerContext(role, local_peer_id);
    context.local_player_index = local_player_index;
    context.table = table;
    return context;
  }

  attach_poker_state(poker: PokerClientState): void {
    this.poker = poker;
  }

  set_table(table: TableHandle): void {
    const seated = table.seated.find((peer) => peer.peer_id === this.local_peer_id);
    this.local_player_index = seated?.player_index ?? this.local_player_index;
    this.table = table;
  }

  table_id(): TableId | null {
    return this.table?.table_id ?? null;
  }
}

export type PlayerCommandShape =
  | { type: "Lobby"; command: LobbyCommandShape }
  | { type: "SubmitPokerAction"; action: PokerAction }
  | { type: "BroadcastPokerAction"; envelope: PokerActionEnvelopeWireShape }
  | { type: "SendPokerAction"; peer_id: PeerId; envelope: PokerActionEnvelopeWireShape }
  | { type: "EmitSyncFrame"; frame: SyncFrame };

export const PlayerCommand = Object.freeze({
  Lobby: (command: LobbyCommandShape): PlayerCommandShape => ({ type: "Lobby", command }),
  SubmitPokerAction: (action: PokerAction): PlayerCommandShape => ({ type: "SubmitPokerAction", action }),
  BroadcastPokerAction: (envelope: PokerActionEnvelopeWireShape): PlayerCommandShape => ({
    type: "BroadcastPokerAction",
    envelope,
  }),
  SendPokerAction: ({ peer_id, envelope }: { peer_id: PeerId; envelope: PokerActionEnvelopeWireShape }): PlayerCommandShape => ({
    type: "SendPokerAction",
    peer_id,
    envelope,
  }),
  EmitSyncFrame: (frame: SyncFrame): PlayerCommandShape => ({ type: "EmitSyncFrame", frame }),
});

export class PlayerAct {
  commands: PlayerCommandShape[];

  constructor(commands: PlayerCommandShape[] = []) {
    this.commands = commands;
  }

  static new(): PlayerAct {
    return new PlayerAct();
  }

  static single(command: PlayerCommandShape): PlayerAct {
    return new PlayerAct([command]);
  }

  push(command: PlayerCommandShape): void {
    this.commands.push(command);
  }

  is_empty(): boolean {
    return this.commands.length === 0;
  }
}

export interface PokerGameState {
  table(): unknown;
  submit_action(action: PokerAction, log_lines: string[]): unknown;
}

export interface Player<State extends PokerGameState, Event extends PlayerEventShape> {
  act(state: State, events: Event[]): unknown;
}

export interface PokerPlayerRegistrar<P> {
  register_player(player: P): unknown;
}

export function create_table_command(spec: TableSpec, annonce_public_key: Uint8Array): LobbyCommandShape {
  return LobbyCommand.CreateTable({ spec, annonce_public_key });
}

export function join_table_command(table_id: TableId, annonce_public_key: Uint8Array): LobbyCommandShape {
  return LobbyCommand.JoinTable({ table_id, annonce_public_key });
}

export function start_hand_command(table_id: TableId): LobbyCommandShape {
  return LobbyCommand.StartHand({ table_id });
}

export function run_network_command(request: NetworkRunRequest): LobbyCommandShape {
  return LobbyCommand.RunNetwork(request);
}

export function handle_action_command(envelope: PokerActionEnvelopeWireShape): PlayerCommandShape {
  return PlayerCommand.BroadcastPokerAction(envelope);
}
