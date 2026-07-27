import { PokerHand } from "./poker_hand.ts";
import { POKER_TABLE_EVENT, PokerEventSource } from "./poker_events.ts";
import type {
  ChipAmount,
  PlayerIndex,
  PokerTableDisplayData,
  Scalar,
  SeatId,
} from "./types.ts";

export class PokerTable extends PokerEventSource {
  max_players: number;
  max_rounds: number;
  current_players: SeatId[];
  dealer_button: PlayerIndex;
  current_hand: PokerHand | null;
  hand_number: number;
  sequence_number: number;

  constructor(max_players: number, max_rounds: number) {
    super();
    this.max_players = max_players;
    this.max_rounds = max_rounds;
    this.current_players = [];
    this.dealer_button = 0;
    this.current_hand = null;
    this.hand_number = 0;
    this.sequence_number = 0;
  }

  static new(max_players: number, max_rounds: number): PokerTable {
    return new PokerTable(max_players, max_rounds);
  }

  clone(): PokerTable {
    const table = new PokerTable(this.max_players, this.max_rounds);
    table.current_players = [...this.current_players];
    table.dealer_button = this.dealer_button;
    table.current_hand = this.current_hand?.clone() ?? null;
    table.current_hand?.on_event((event) => table.emit_event(event));
    table.hand_number = this.hand_number;
    table.sequence_number = this.sequence_number;
    return table;
  }

  join(player: SeatId): void {
    this.current_players.push(player);
  }

  start_hand(initial_chips: ChipAmount | ChipAmount[], small_blind: ChipAmount, dealer_button: PlayerIndex): void {
    if (
      !(
        this.current_hand == null ||
        this.current_hand.get_current_state().is_finished()
      )
    ) {
      throw new Error("Hand in progress");
    }

    this.dealer_button = dealer_button;
    this.hand_number += 1;
    this.sequence_number = 0;
    const playerChips = Array.isArray(initial_chips)
      ? initial_chips
      : Array(this.current_players.length).fill(initial_chips);
    this.current_hand = PokerHand.new(
      this.current_players.length,
      this.max_rounds,
      dealer_button,
      playerChips,
      small_blind,
    );
    this.current_hand.on_event((event) => this.emit_event(event));
    this.emit_event({
      type: POKER_TABLE_EVENT.HAND_STARTED,
      hand_number: this.hand_number,
      dealer_seat_number: dealer_button,
      small_blind,
      initial_chips,
      player_chips: this.current_hand.betting_state.player_chips.slice(),
    });
  }

  get_current_hand(): PokerHand | null {
    return this.current_hand;
  }

  get_current_hand_mut(): PokerHand | null {
    return this.current_hand;
  }

  get_max_players(): number {
    return this.max_players;
  }

  get_max_rounds(): number {
    return this.max_rounds;
  }

  get_current_player_count(): number {
    return this.current_players.length;
  }

  get_player(player: PlayerIndex): SeatId | null {
    return this.current_players[player] ?? null;
  }

  to_display_data(
    acting_player: PlayerIndex | null = null,
    acting_signing_key: Scalar | null = null,
  ): PokerTableDisplayData {
    const hand_data = this.current_hand?.to_display_data(acting_player, acting_signing_key) ?? {
      current_player: "",
      current_round: 0,
      current_state: "",
      state_type: "Waiting",
      state_label: "Waiting",
      dealer_seat_number: this.dealer_button,
      small_blind: 0,
      big_blind: 0,
      current_pot: "0",
      min_bet: 0,
      max_bet: 0,
      bet_step: 0,
      community_cards: [],
      own_player_cards: [],
      player_cards_by_seat: {},
      player_chips: [],
      current_round_bets: [],
      active_players: [],
      allin_players: [],
    };

    return {
      max_players: this.max_players,
      max_rounds: this.max_rounds,
      current_players: [...this.current_players],
      dealer_button: this.dealer_button,
      hand_number: this.hand_number,
      sequence_number: this.sequence_number,
      current_hand: hand_data,
    };
  }
}
