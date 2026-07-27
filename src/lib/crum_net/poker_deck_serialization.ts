import { G1 } from "../crum_bls/curves.js";
import { toBytes } from "../crum_bls/bytes.js";
import { MaskedCards, UnmaskedCards } from "../crum_pkr/index.ts";
import type {
  BytesLike,
  ContractCardBytes,
  ContractCardSetsBytes,
  ContractCardsBytes,
  ContractUnmaskingSequenceBytes,
  G1Point,
} from "../crum_pkr/types.ts";

export const G1AFFINE_COMPRESSED_LEN = 48;

export type PokerDeckSerializationErrorKind =
  | "InvalidG1CompressedLength"
  | "G1DecodeError";

type PokerDeckSerializationErrorFields =
  | { expected: number; actual: number }
  | Record<string, never>;

export class PokerDeckSerializationError extends Error {
  kind: PokerDeckSerializationErrorKind;
  expected?: number;
  actual?: number;

  constructor(
    kind: PokerDeckSerializationErrorKind,
    fields: PokerDeckSerializationErrorFields = {},
  ) {
    const message = formatError(kind, fields);
    super(message);
    this.name = "PokerDeckSerializationError";
    this.kind = kind;
    Object.assign(this, fields);
  }
}

export function serialize_g1_affine(point: G1Point): ContractCardBytes {
  return point.toRawBytes(true);
}

export function deserialize_g1_affine(bytes: BytesLike): G1Point {
  const data = toBytes(bytes);
  if (data.length !== G1AFFINE_COMPRESSED_LEN) {
    throw new PokerDeckSerializationError("InvalidG1CompressedLength", {
      expected: G1AFFINE_COMPRESSED_LEN,
      actual: data.length,
    });
  }

  try {
    const point = G1.fromHex(data) as G1Point & { assertValidity(): void };
    point.assertValidity();
    return point;
  } catch {
    throw new PokerDeckSerializationError("G1DecodeError");
  }
}

export function serialize_masked_cards(cards: MaskedCards): ContractCardsBytes {
  return serialize_g1_cards(cards.cards());
}

export function deserialize_masked_cards(cards: BytesLike[]): MaskedCards {
  return MaskedCards.new(deserialize_g1_cards(cards));
}

export function serialize_masked_card_sets(card_sets: MaskedCards[]): ContractCardSetsBytes {
  return card_sets.map(serialize_masked_cards);
}

export function deserialize_masked_card_sets(card_sets: BytesLike[][]): MaskedCards[] {
  return card_sets.map(deserialize_masked_cards);
}

export function serialize_unmasked_cards(cards: UnmaskedCards): ContractCardsBytes {
  return serialize_g1_cards(cards.cards());
}

export function deserialize_unmasked_cards(cards: BytesLike[]): UnmaskedCards {
  return UnmaskedCards.new(deserialize_g1_cards(cards));
}

export function serialize_unmasked_card_sets(card_sets: UnmaskedCards[]): ContractCardSetsBytes {
  return card_sets.map(serialize_unmasked_cards);
}

export function deserialize_unmasked_card_sets(card_sets: BytesLike[][]): UnmaskedCards[] {
  return card_sets.map(deserialize_unmasked_cards);
}

export function serialize_unmasking_sequence(sequence: UnmaskedCards[][]): ContractUnmaskingSequenceBytes {
  return sequence.map((stage) => serialize_unmasked_card_sets(stage));
}

export function deserialize_unmasking_sequence(sequence: BytesLike[][][]): UnmaskedCards[][] {
  return sequence.map((stage) => deserialize_unmasked_card_sets(stage));
}

function serialize_g1_cards(cards: G1Point[]): ContractCardsBytes {
  return cards.map(serialize_g1_affine);
}

function deserialize_g1_cards(cards: BytesLike[]): G1Point[] {
  return cards.map(deserialize_g1_affine);
}

function formatError(
  kind: PokerDeckSerializationErrorKind,
  fields: PokerDeckSerializationErrorFields,
): string {
  switch (kind) {
    case "InvalidG1CompressedLength":
      return `invalid compressed G1 length: expected ${fields.expected}, received ${fields.actual}`;
    case "G1DecodeError":
      return "could not decode compressed G1 point";
    default:
      return kind;
  }
}
