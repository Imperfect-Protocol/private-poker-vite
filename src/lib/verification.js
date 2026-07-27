import { parseAbi } from 'viem';
import {
  POKER_HAND_STATE_UNMASK_COMMUNITY_CARDS,
  POKER_HAND_STATE_UNMASK_HOLE_CARDS,
  POKER_HAND_STATE_UNMASK_SHOWDOWN,
} from './crum_pkr/index.ts';

export const HAND_VERIFICATION_ABI = parseAbi([
  'function submitPublicKey(uint256 lobby_id, uint256 table_id, uint256 hand_id, uint8 player, bytes public_key, bytes[] masked_before, bytes[] masked_after, bytes[] traces, bytes[] player_keys, bytes[][] shuffle_history, bytes[][][] unmasking_sequence_cards, uint8[] unmasking_actors, uint8[] unmasking_states)',
  'event PublicKeySubmitted(uint256 lobby_id, uint256 table_id, uint256 hand_id, uint256 seat_number, uint256 remain_count)',
  'event HandVerified(uint256 lobby_id, uint256 table_id, uint256 hand_id)',
]);

export const VERIFY_SHUFFLE_ABI = parseAbi([
  'function verifyShuffle(bytes[] masked_before, bytes[] masked_after, bytes public_key, bytes[] traces)',
]);

export const VERIFY_UNMASKING_ABI = parseAbi([
  'function verifyUnmasking(uint8 num_players, bytes[] player_keys, bytes[][] shuffle_history, bytes[][][] unmasking_sequence_cards, uint8[] unmasking_actors, uint8[] unmasking_states)',
]);

export const POKER_HAND_STATE_TO_CONTRACT_STATE = {
  UnmaskHoleCards: POKER_HAND_STATE_UNMASK_HOLE_CARDS,
  UnmaskCommunityCards: POKER_HAND_STATE_UNMASK_COMMUNITY_CARDS,
  UnmaskShowdown: POKER_HAND_STATE_UNMASK_SHOWDOWN,
};

export function buildSubmitPublicKeyVerificationArgs({
  lobbyId,
  tableId,
  handId,
  hand,
  player,
  publicKey,
  traces,
}) {
  const playerIndex = Number(player);
  const publicKeyHex = toHexBytes(publicKey);
  const shuffle = buildShuffleVerificationArgs({ hand, player: playerIndex, publicKey, traces });
  const unmasking = buildUnmaskingVerificationArgs({ hand });

  return [
    BigInt(lobbyId),
    BigInt(tableId),
    BigInt(handId),
    playerIndex,
    publicKeyHex,
    shuffle.maskedBefore,
    shuffle.maskedAfter,
    shuffle.traces,
    unmasking.playerKeys,
    unmasking.shuffleHistory,
    unmasking.unmaskingSequenceCards,
    unmasking.unmaskingActors,
    unmasking.unmaskingStates,
  ];
}

export function buildShuffleVerificationArgs({ hand, player, publicKey, traces }) {
  if (!hand) throw new Error('Poker hand is required for shuffle verification.');

  const numPlayers = Number(hand.current_state?.num_players ?? 0);
  const dealer = Number(hand.current_state?.dealer_button ?? 0);
  const playerIndex = Number(player);
  const stepIndex = (playerIndex + numPlayers - dealer) % numPlayers;
  const previousDeck = stepIndex === 0
    ? hand.poker_deck
    : hand.shuffle_history?.[stepIndex - 1];
  const nextDeck = hand.shuffle_history?.[stepIndex];

  if (!previousDeck || !nextDeck) {
    throw new Error(`Missing shuffle history for player ${playerIndex}.`);
  }

  return {
    maskedBefore: serializeCards(previousDeck),
    maskedAfter: serializeCards(nextDeck),
    publicKey: toHexBytes(publicKey),
    traces: serializeShuffleTraces(traces),
  };
}

export function buildUnmaskingVerificationArgs({ hand }) {
  if (!hand) throw new Error('Poker hand is required for unmasking verification.');

  const numPlayers = Number(hand.current_state?.num_players ?? 0);
  const playerKeys = Array.from({ length: numPlayers }, (_, index) => {
    const key = hand.player_keys?.[index];
    if (!key) throw new Error(`Missing public key for player ${index}.`);
    return toHexBytes(key);
  });

  return {
    numPlayers,
    playerKeys,
    shuffleHistory: (hand.shuffle_history ?? []).map(serializeCards),
    unmaskingSequenceCards: (hand.unmasking_sequence ?? []).map((entry) => (
      serializeUnmaskingEntryCards(entry)
    )),
    unmaskingActors: (hand.unmasking_sequence ?? []).map(([actor]) => Number(actor)),
    unmaskingStates: (hand.unmasking_sequence ?? []).map(([, state]) => Number(state)),
  };
}

export function serializeCards(cards) {
  return cards.cards().map(toHexBytes);
}

export function serializeShuffleTraces(traces = []) {
  return traces.map((trace) => {
    const afterIndex = Number(trace?.after_index ?? trace?.[0]);
    const claimedBeforeIndex = Number(trace?.claimed_before_index ?? trace?.[1]);
    return `0x${u32LeHex(afterIndex)}${u32LeHex(claimedBeforeIndex)}`;
  });
}

function serializeUnmaskingEntryCards(entry) {
  const cards = entry?.[2];
  if (Array.isArray(cards)) return cards.map(serializeCards);
  return [serializeCards(cards)];
}

function toHexBytes(value) {
  if (typeof value === 'string') {
    return value.startsWith('0x') ? value : `0x${value}`;
  }
  if (value?.toRawBytes) return bytesToHex(value.toRawBytes(true));
  if (value instanceof Uint8Array) return bytesToHex(value);
  if (ArrayBuffer.isView(value)) {
    return bytesToHex(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  }
  if (value instanceof ArrayBuffer) return bytesToHex(new Uint8Array(value));
  throw new TypeError('Expected bytes, hex string, or BLS point.');
}

function bytesToHex(bytes) {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function u32LeHex(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 0xffffffff) {
    throw new Error(`Invalid shuffle trace index: ${value}`);
  }

  const bytes = [
    number & 0xff,
    (number >>> 8) & 0xff,
    (number >>> 16) & 0xff,
    (number >>> 24) & 0xff,
  ];
  return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
