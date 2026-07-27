import type {
  G2Point,
  MaskedCards,
  PokerSubmit,
  PokerSubmitMethod,
  PokerSubmitOptions,
  PokerSubmitResult,
  ShuffleTrace,
  UnmaskedCards,
} from "./types.ts";
import type { PokerHand } from "./poker_hand.ts";

export const POKER_HAND_SUBMIT_METHODS = Object.freeze([
  "submit_shuffled_deck",
  "submit_small_blind",
  "submit_big_blind",
  "submit_player_cards",
  "submit_player_cards_showdown",
  "submit_community_cards",
  "submit_public_key",
  "submit_bet",
]);

type OnSubmit = (submit: PokerSubmit, result: PokerSubmitResult) => void;

export class PokerHandProxy {
  hand: PokerHand;
  on_submit: OnSubmit | null;

  constructor(hand: PokerHand, { on_submit = null }: { on_submit?: OnSubmit | null } = {}) {
    this.hand = hand;
    this.on_submit = on_submit;
  }

  submit_shuffled_deck(player: number, deck: MaskedCards, options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_shuffled_deck", [player, deck], options);
  }

  submit_small_blind(player: number, options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_small_blind", [player], options);
  }

  submit_big_blind(player: number, options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_big_blind", [player], options);
  }

  submit_player_cards(player: number, player_cards: UnmaskedCards[], options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_player_cards", [player, player_cards], options);
  }

  submit_player_cards_showdown(player: number, player_cards: UnmaskedCards[], options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_player_cards_showdown", [player, player_cards], options);
  }

  submit_community_cards(player: number, round: number, cards: UnmaskedCards, options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_community_cards", [player, round, cards], options);
  }

  submit_public_key(player: number, public_key: G2Point, traces: ShuffleTrace[], options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_public_key", [player, public_key, traces], options);
  }

  submit_bet(player: number, amount: number, options: PokerSubmitOptions = {}): PokerSubmitResult {
    return this.submit("submit_bet", [player, amount], options);
  }

  apply_submit(submit: PokerSubmit, options: PokerSubmitOptions = {}): PokerSubmitResult {
    const args = submit?.args ?? submit?.data?.args;
    if (!submit?.method || !Array.isArray(args)) {
      throw new Error("PokerHandProxy submit messages require { method, args }");
    }
    return this.submit(submit.method, args, options);
  }

  submit(method: PokerSubmitMethod, args: unknown[], { publish = true }: PokerSubmitOptions = {}): PokerSubmitResult {
    if (!(POKER_HAND_SUBMIT_METHODS as readonly string[]).includes(method)) {
      throw new Error(`unknown PokerHand submit method: ${method}`);
    }

    this.hand.clear_events?.();
    const status = (this.hand[method] as (...methodArgs: unknown[]) => unknown)(...args);
    const events = this.hand.drain_events?.() ?? [];
    const result = { status, events };

    if (publish) {
      this.on_submit?.({ method, args }, result);
    }

    return result;
  }
}
