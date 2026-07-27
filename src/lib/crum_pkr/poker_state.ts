export const POKER_HAND_STATE_SHUFFLE = 0;
export const POKER_HAND_STATE_SMALL_BLIND = 1;
export const POKER_HAND_STATE_BIG_BLIND = 2;
export const POKER_HAND_STATE_BET = 3;
export const POKER_HAND_STATE_UNMASK_HOLE_CARDS = 4;
export const POKER_HAND_STATE_UNMASK_COMMUNITY_CARDS = 5;
export const POKER_HAND_STATE_UNMASK_SHOWDOWN = 6;
export const POKER_HAND_STATE_SUBMIT_PUBLIC_KEY = 7;
export const POKER_HAND_STATE_FINISHED = 8;
export const POKER_HAND_STATE_CHEATED = 9;

export const POKER_HOLDEM_PREFLOP = 0;
export const POKER_HOLDEM_FLOP = 1;
export const POKER_HOLDEM_TURN = 2;
export const POKER_HOLDEM_RIVER = 3;
export const POKER_HOLDEM_ROUNDS = 4;

export type PokerHandStateEnum =
  | { type: "Shuffle"; player: number; is_dealer: boolean }
  | { type: "SmallBlind"; player: number }
  | { type: "BigBlind"; player: number }
  | { type: "Bet"; round: number; player: number }
  | { type: "UnmaskHoleCards"; player: number }
  | { type: "UnmaskCommunityCards"; round: number; player: number }
  | { type: "UnmaskShowdown"; player: number }
  | { type: "SubmitPublicKey"; player: number }
  | { type: "Cheated"; player: number }
  | { type: "Finished" }
  | { type: "Invalid" };

export class PokerHandState {
  num_players: number;
  max_rounds: number;
  dealer_button: number;
  current_player: number;
  current_round: number;
  current_state: number;

  constructor(num_players: number, max_rounds: number, dealer_button: number) {
    this.num_players = num_players;
    this.max_rounds = max_rounds;
    this.dealer_button = dealer_button;
    this.current_player = dealer_button;
    this.current_round = 0;
    this.current_state = POKER_HAND_STATE_SHUFFLE;
  }

  static new(num_players: number, max_rounds: number, dealer_button: number): PokerHandState {
    return new PokerHandState(num_players, max_rounds, dealer_button);
  }

  clone(): PokerHandState {
    const state = new PokerHandState(this.num_players, this.max_rounds, this.dealer_button);
    state.current_player = this.current_player;
    state.current_round = this.current_round;
    state.current_state = this.current_state;
    return state;
  }

  is_dealer(player: number): boolean {
    return this.dealer_button === player;
  }

  is_current_dealer(): boolean {
    return this.is_dealer(this.current_player);
  }

  is_finished(): boolean {
    return this.current_state === POKER_HAND_STATE_FINISHED;
  }

  get_current_player(): number {
    return this.current_player;
  }

  next_dealer(): void {
    this.current_player = this.dealer_button;
  }

  next_player(): boolean {
    this.current_player = (this.current_player + 1) % this.num_players;
    return this.current_player === this.dealer_button;
  }

  next_player_masked(mask: boolean[], from_dealer: boolean): boolean {
    if (from_dealer) {
      this.next_dealer();
      if (mask[this.current_player]) {
        return false;
      }
    }
    const current_player = this.current_player;
    while (true) {
      this.next_player();
      if (mask[this.current_player]) {
        return false;
      }
      if (current_player === this.current_player) {
        return true;
      }
    }
  }

  next_round(): boolean {
    const next_round = this.current_round + 1;

    if (next_round > this.max_rounds) {
      throw new Error("No next round - Hand has finished");
    }

    this.current_round = next_round;

    if (next_round === this.max_rounds) {
      return true;
    }

    return false;
  }

  to_tuple(): [number, number, number] {
    return [this.current_round, this.current_player, this.current_state];
  }

  to_enum(): PokerHandStateEnum {
    switch (this.current_state) {
      case POKER_HAND_STATE_SHUFFLE:
        return {
          type: "Shuffle",
          player: this.current_player,
          is_dealer: this.is_current_dealer(),
        };
      case POKER_HAND_STATE_SMALL_BLIND:
        return { type: "SmallBlind", player: this.current_player };
      case POKER_HAND_STATE_BIG_BLIND:
        return { type: "BigBlind", player: this.current_player };
      case POKER_HAND_STATE_BET:
        return {
          type: "Bet",
          round: this.current_round,
          player: this.current_player,
        };
      case POKER_HAND_STATE_UNMASK_HOLE_CARDS:
        return { type: "UnmaskHoleCards", player: this.current_player };
      case POKER_HAND_STATE_UNMASK_COMMUNITY_CARDS:
        return {
          type: "UnmaskCommunityCards",
          round: this.current_round,
          player: this.current_player,
        };
      case POKER_HAND_STATE_UNMASK_SHOWDOWN:
        return { type: "UnmaskShowdown", player: this.current_player };
      case POKER_HAND_STATE_SUBMIT_PUBLIC_KEY:
        return { type: "SubmitPublicKey", player: this.current_player };
      case POKER_HAND_STATE_CHEATED:
        return { type: "Cheated", player: this.current_player };
      case POKER_HAND_STATE_FINISHED:
        return { type: "Finished" };
      default:
        return { type: "Invalid" };
    }
  }
}
