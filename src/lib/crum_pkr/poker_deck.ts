import {
  clonePoint,
  compressedBytes,
  hashToCurve,
  invertSigningKey,
  keccak256,
  maskPoint,
  pointEquals,
} from "./crum_bls_bridge.ts";
import type { G1Point, RandomSource, Scalar, ShuffleTrace } from "./types.ts";

function bytesForCard(card: string): Uint8Array {
  return Uint8Array.from([card.charCodeAt(0), card.charCodeAt(1)]);
}

function cloneCards(cards: G1Point[]): G1Point[] {
  return cards.map((card) => clonePoint(card));
}

function rngIndex(rng: RandomSource, upperExclusive: number): number {
  if (typeof rng === "function") {
    return Math.floor(rng() * upperExclusive);
  }
  if (typeof rng === "object" && rng != null && "random" in rng && typeof rng.random === "function") {
    return Math.floor(rng.random() * upperExclusive);
  }
  if (typeof rng === "object" && rng != null && "next" in rng && typeof rng.next === "function") {
    return Math.floor(rng.next() * upperExclusive);
  }
  throw new Error("rng is required");
}

export class PokerCard {
  bytes: Uint8Array;

  constructor(bytes: Uint8Array | number[] = new Uint8Array()) {
    this.bytes = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  }

  clone(): PokerCard {
    return new PokerCard(this.bytes);
  }

  toString(): string {
    return String.fromCharCode(...this.bytes);
  }
}

export class PokerDeck {
  poker_cards: PokerCard[];
  cards_g1: G1Point[];

  constructor(poker_cards: Array<PokerCard | Uint8Array | number[]> | null = null, cards_g1: G1Point[] | null = null) {
    if (poker_cards == null && cards_g1 == null) {
      const cards: PokerCard[] = [];
      const points: G1Point[] = [];
      for (const rank of "23456789TJQKA") {
        for (const suit of "shdc") {
          const card = `${rank}${suit}`;
          cards.push(new PokerCard(bytesForCard(card)));
          points.push(hashToCurve(bytesForCard(card)));
        }
      }
      this.poker_cards = cards;
      this.cards_g1 = points;
      return;
    }

    if (poker_cards == null || cards_g1 == null) {
      throw new Error("poker_cards and cards_g1 must be provided together");
    }

    this.poker_cards = poker_cards.map((card) =>
      card instanceof PokerCard ? card.clone() : new PokerCard(card),
    );
    this.cards_g1 = cloneCards(cards_g1);
  }

  static new(): PokerDeck {
    return new PokerDeck();
  }

  clone(): PokerDeck {
    return new PokerDeck(this.poker_cards, this.cards_g1);
  }

  find_card(revealed_point: G1Point): PokerCard | null {
    const card_index = this.cards_g1.findIndex((point) => pointEquals(revealed_point, point));
    if (card_index === -1) {
      return null;
    }
    return this.poker_cards[card_index].clone();
  }

  cards(): G1Point[] {
    return cloneCards(this.cards_g1);
  }

  len(): number {
    return this.cards_g1.length;
  }

  masked_cards(): MaskedCards {
    return MaskedCards.new(this.cards());
  }

  unmasked_cards(unmasked_cards: UnmaskedCards): Array<PokerCard | null> {
    return unmasked_cards.cards_g1.map((card_g1) => this.find_card(card_g1));
  }
}

export class MaskedCards {
  cards_g1: G1Point[];

  constructor(cards_g1: G1Point[] = []) {
    this.cards_g1 = cloneCards(cards_g1);
  }

  static new(cards_g1: G1Point[]): MaskedCards {
    return new MaskedCards(cards_g1);
  }

  static default(): MaskedCards {
    return new MaskedCards();
  }

  clone(): MaskedCards {
    return new MaskedCards(this.cards_g1);
  }

  cards(): G1Point[] {
    return cloneCards(this.cards_g1);
  }

  cards_n(count: number): G1Point[] {
    return cloneCards(this.cards_g1.slice(0, count));
  }

  len(): number {
    return this.cards_g1.length;
  }

  mask(sk: Scalar): void {
    this.cards_g1 = this.cards_g1.map((card_g1) => maskPoint(card_g1, sk));
  }

  shuffle(rng: RandomSource): void {
    for (let i = this.cards_g1.length - 1; i > 0; i -= 1) {
      const j = rngIndex(rng, i + 1);
      [this.cards_g1[i], this.cards_g1[j]] = [this.cards_g1[j], this.cards_g1[i]];
    }
  }

  shuffle_traced(rng: RandomSource): ShuffleTrace[] {
    const cards_g1_indexed = this.cards_g1.map((card, before_index) => ({
      before_index,
      card,
    }));

    for (let i = cards_g1_indexed.length - 1; i > 0; i -= 1) {
      const j = rngIndex(rng, i + 1);
      [cards_g1_indexed[i], cards_g1_indexed[j]] = [
        cards_g1_indexed[j],
        cards_g1_indexed[i],
      ];
    }

    const res = cards_g1_indexed.map(({ before_index }, after_index) => ({
      after_index,
      claimed_before_index: before_index,
    }));

    this.cards_g1 = cards_g1_indexed.map(({ card }) => card);
    return res;
  }

  hash(): Uint8Array {
    const bytes = this.cards_g1.map((card) => compressedBytes(card));
    return keccak256(bytes);
  }

  deal(count: number): UnmaskedCards {
    const dealt_cards = this.cards_g1.splice(0, count);
    return UnmaskedCards.new(dealt_cards);
  }
}

export class UnmaskedCards {
  cards_g1: G1Point[];

  constructor(cards_g1: G1Point[] = []) {
    this.cards_g1 = cloneCards(cards_g1);
  }

  static new(cards_g1: G1Point[]): UnmaskedCards {
    return new UnmaskedCards(cards_g1);
  }

  static default(): UnmaskedCards {
    return new UnmaskedCards();
  }

  clone(): UnmaskedCards {
    return new UnmaskedCards(this.cards_g1);
  }

  cards(): G1Point[] {
    return cloneCards(this.cards_g1);
  }

  len(): number {
    return this.cards_g1.length;
  }

  unmask(sk: Scalar): void {
    const sk_inv = invertSigningKey(sk);
    this.cards_g1 = this.cards_g1.map((card_g1) => maskPoint(card_g1, sk_inv));
  }
}
