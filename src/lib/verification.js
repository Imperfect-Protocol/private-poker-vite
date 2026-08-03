import { parseAbi } from 'viem';
import {
  POKER_HAND_STATE_UNMASK_COMMUNITY_CARDS,
  POKER_HAND_STATE_UNMASK_HOLE_CARDS,
  POKER_HAND_STATE_UNMASK_SHOWDOWN,
} from './crum_pkr/index.js';

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
  shuffleTracesByPlayer,
}) {
  const playerIndex = Number(player);
  const publicKeyHex = toHexBytes(publicKey);
  const shuffle = buildShuffleVerificationArgs({
    hand,
    player: playerIndex,
    publicKey,
    traces,
    shuffleTracesByPlayer,
  });
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

export function buildShuffleVerificationArgs({
  hand,
  player,
  publicKey,
  traces,
  shuffleTracesByPlayer,
}) {
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
  const compact = compactShuffleProof({
    hand,
    player: playerIndex,
    traces,
    shuffleTracesByPlayer,
    previousDeck,
    nextDeck,
  });

  return {
    maskedBefore: serializeCards(compact.maskedBefore),
    maskedAfter: serializeCards(compact.maskedAfter),
    publicKey: toHexBytes(publicKey),
    traces: serializeShuffleTraces(compact.traces),
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
  const dealtCardCount = texasHoldemDealtCardCount(numPlayers);
  const finalDeck = hand.shuffle_history?.at(-1);
  if (!finalDeck) throw new Error('Missing final shuffle history for unmasking verification.');

  return {
    numPlayers,
    playerKeys,
    shuffleHistory: [serializeCards(finalDeck, dealtCardCount)],
    unmaskingSequenceCards: (hand.unmasking_sequence ?? []).map((entry) => (
      serializeUnmaskingEntryCards(entry)
    )),
    unmaskingActors: (hand.unmasking_sequence ?? []).map(([actor]) => Number(actor)),
    unmaskingStates: (hand.unmasking_sequence ?? []).map(([, state]) => Number(state)),
  };
}

export function texasHoldemDealtCardCount(numPlayers) {
  return Number(numPlayers) * 2 + 5;
}

export function serializeCards(cards, count = null) {
  const cardPoints = Array.isArray(cards) ? cards : cards.cards();
  const selectedCards = count == null ? cardPoints : cardPoints.slice(0, count);
  return selectedCards.map(toHexBytes);
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

function compactShuffleProof({
  hand,
  player,
  traces,
  shuffleTracesByPlayer,
  previousDeck,
  nextDeck,
}) {
  const numPlayers = Number(hand.current_state?.num_players ?? 0);
  const dealer = Number(hand.current_state?.dealer_button ?? 0);
  const playerIndex = Number(player);
  const stepIndex = (playerIndex + numPlayers - dealer) % numPlayers;
  const dealtCardCount = texasHoldemDealtCardCount(numPlayers);
  const currentTraces = normalizeShuffleTraces(traces);
  const relevantAfterIndices = relevantAfterIndicesForShuffleStep({
    numPlayers,
    dealer,
    stepIndex,
    dealtCardCount,
    traces,
    shuffleTracesByPlayer,
  });
  const selectedTraces = currentTraces
    .filter((trace) => relevantAfterIndices.has(Number(trace.after_index)))
    .sort((left, right) => Number(left.after_index) - Number(right.after_index));

  if (selectedTraces.length !== relevantAfterIndices.size) {
    throw new Error(`Missing dealt-card shuffle traces for player ${playerIndex}.`);
  }

  const afterIndexByOriginal = new Map();
  const beforeIndexByOriginal = new Map();
  const previousCards = previousDeck.cards();
  const nextCards = nextDeck.cards();
  const compactAfter = [];
  const compactBefore = [];
  const compactTraces = [];

  for (const trace of selectedTraces) {
    const originalAfterIndex = Number(trace.after_index);
    const originalBeforeIndex = Number(trace.claimed_before_index);

    if (!afterIndexByOriginal.has(originalAfterIndex)) {
      afterIndexByOriginal.set(originalAfterIndex, compactAfter.length);
      compactAfter.push(nextCards[originalAfterIndex]);
    }
    if (!beforeIndexByOriginal.has(originalBeforeIndex)) {
      beforeIndexByOriginal.set(originalBeforeIndex, compactBefore.length);
      compactBefore.push(previousCards[originalBeforeIndex]);
    }

    compactTraces.push({
      after_index: afterIndexByOriginal.get(originalAfterIndex),
      claimed_before_index: beforeIndexByOriginal.get(originalBeforeIndex),
    });
  }

  if (compactBefore.length !== compactAfter.length) {
    throw new Error(`Duplicate dealt-card shuffle source for player ${playerIndex}.`);
  }

  return {
    maskedBefore: compactBefore,
    maskedAfter: compactAfter,
    traces: compactTraces,
  };
}

function relevantAfterIndicesForShuffleStep({
  numPlayers,
  dealer,
  stepIndex,
  dealtCardCount,
  traces,
  shuffleTracesByPlayer,
}) {
  let relevant = new Set(range(dealtCardCount));

  for (let laterStep = numPlayers - 1; laterStep > stepIndex; laterStep -= 1) {
    const laterPlayer = (dealer + laterStep) % numPlayers;
    const laterTraces = normalizeShuffleTraces(
      shuffleTracesForPlayer({
        player: laterPlayer,
        currentPlayer: (dealer + stepIndex) % numPlayers,
        currentTraces: traces,
        shuffleTracesByPlayer,
      }),
    );
    if (laterTraces.length === 0) {
      throw new Error(`Missing later shuffle traces for player ${laterPlayer}.`);
    }

    const nextRelevant = new Set();
    for (const trace of laterTraces) {
      if (relevant.has(Number(trace.after_index))) {
        nextRelevant.add(Number(trace.claimed_before_index));
      }
    }
    if (nextRelevant.size !== relevant.size) {
      throw new Error(`Missing dealt-card trace coverage for player ${laterPlayer}.`);
    }
    relevant = nextRelevant;
  }

  return relevant;
}

function shuffleTracesForPlayer({
  player,
  currentPlayer,
  currentTraces,
  shuffleTracesByPlayer,
}) {
  if (Number(player) === Number(currentPlayer)) return currentTraces;
  if (shuffleTracesByPlayer instanceof Map) {
    const value = shuffleTracesByPlayer.get(player) ?? shuffleTracesByPlayer.get(String(player));
    return value?.traces ?? value;
  }
  if (Array.isArray(shuffleTracesByPlayer)) {
    const value = shuffleTracesByPlayer[player];
    return value?.traces ?? value;
  }
  const value = shuffleTracesByPlayer?.[player] ?? shuffleTracesByPlayer?.[String(player)];
  return value?.traces ?? value;
}

function normalizeShuffleTraces(traces = []) {
  return Array.from(traces ?? []).map((trace) => ({
    after_index: Number(trace?.after_index ?? trace?.[0]),
    claimed_before_index: Number(trace?.claimed_before_index ?? trace?.[1]),
  }));
}

function range(length) {
  return Array.from({ length }, (_, index) => index);
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
