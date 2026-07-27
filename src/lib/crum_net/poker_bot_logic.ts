import {
  POKER_HOLDEM_ROUNDS,
  PokerTable,
  cardsToConsoleString,
} from "../crum_pkr/index.ts";
import type { PlayerIndex, PokerCardText } from "../crum_pkr/types.ts";

export const NUM_PLAYERS = 2;
export const INITIAL_CHIPS = 1000;
export const SMALL_BLIND = 10;
export const TABLE_ID = 1;
export const HAND_ID = 1;

export class PokerBotLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PokerBotLogicError";
  }
}

export class PokerBotLogic {
  player_index_value: PlayerIndex | null;

  constructor() {
    this.player_index_value = null;
  }

  static new(): PokerBotLogic {
    return new PokerBotLogic();
  }

  seat_as(player_index: PlayerIndex): void {
    this.player_index_value = player_index;
  }

  player_index(): PlayerIndex {
    if (this.player_index_value == null) {
      throw new PokerBotLogicError("bot has not been seated at a table");
    }
    return this.player_index_value;
  }

  act(): never {
    throw new PokerBotLogicError(
      "PokerBotLogic.act exact JavaScript port is pending: Rust uses StdRng, WeightedIndex, and Scalar::random; do not approximate bot action selection"
    );
  }

  handle_actions(network: { register_player(bot: PokerBotLogic): unknown }): unknown {
    return network.register_player(this);
  }
}

export function new_table(): PokerTable {
  return new_table_with_players(NUM_PLAYERS);
}

export function new_table_with_players(num_players: number): PokerTable {
  const poker_table = PokerTable.new(num_players, POKER_HOLDEM_ROUNDS);
  for (let player_id = 1; player_id <= num_players; player_id += 1) {
    poker_table.join(player_id);
  }
  poker_table.start_hand(Array(num_players).fill(INITIAL_CHIPS), SMALL_BLIND, 0);
  return poker_table;
}

export function current_player(poker_table: PokerTable): PlayerIndex {
  const hand = poker_table.get_current_hand();
  if (hand == null) {
    throw new PokerBotLogicError("Hand not started");
  }
  return hand.get_current_state().get_current_player();
}

export function is_finished(poker_table: PokerTable): boolean {
  const hand = poker_table.get_current_hand();
  if (hand == null) {
    throw new PokerBotLogicError("Hand not started");
  }
  return hand.get_current_state().is_finished();
}

export function final_lines(poker_table: PokerTable): string[] {
  const hand = poker_table.get_current_hand();
  if (hand == null) {
    throw new PokerBotLogicError("Hand not started");
  }

  return [
    ...community_card_lines(hand),
    ...player_card_lines(hand),
    "Hand ended",
  ];
}

function community_card_lines(hand: NonNullable<ReturnType<PokerTable["get_current_hand"]>>): string[] {
  const community_cards: PokerCardText[] = [];
  for (let round = 0; round < POKER_HOLDEM_ROUNDS; round += 1) {
    const cards = hand.get_community_cards(round);
    if (cards != null) {
      community_cards.push(...hand.get_poker_deck().unmasked_cards(cards));
    }
  }
  return [`Community cards: ${cardsToString(community_cards)}`];
}

function player_card_lines(hand: NonNullable<ReturnType<PokerTable["get_current_hand"]>>): string[] {
  return hand.get_player_cards().map((cards, index) => {
    const unmasked = hand.get_poker_deck().unmasked_cards(cards);
    return `Player ${index + 1} cards: ${cardsToString(unmasked)}`;
  });
}

function cardsToString(cards: PokerCardText[]): string {
  return cardsToConsoleString(cards);
}
