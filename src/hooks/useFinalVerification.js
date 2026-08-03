import { useCallback } from 'react';
import { keccak256 } from 'viem';
import {
  bytesToHex,
  combine as combineLagrange,
  hexToBytes,
  make_public_key_from_compressed_slice,
  make_signature_from_compressed_slice,
  recover as recoverLagrange,
  sign as blsSign,
  verify as blsVerify,
} from '../lib/crum_bls/index.js';
import { holdemShowdown } from '../lib/crum_pkr/hand_evaluator.js';
import { POKER_HOLDEM_ROUNDS } from '../lib/crum_pkr/index.js';

export const FINAL_VERIFICATION_SIGNATURE_SCHEME = 'BLS12-381-FINAL-HAND-V1';

const textEncoder = new TextEncoder();

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function ensureHexPrefix(value) {
  const normalized = String(value ?? '');
  return normalized.startsWith('0x') ? normalized : `0x${normalized}`;
}

function hexPoint(bytes) {
  return bytesToHex(bytes, { prefix: true });
}

function normalizeAddress(value) {
  return value?.toLowerCase?.() ?? null;
}

function pointHex(point) {
  return point?.toRawBytes ? hexPoint(point.toRawBytes(true)) : ensureHexPrefix(point);
}

function cardsToStrings(cards) {
  return cards
    .filter(Boolean)
    .map((card) => card.toString());
}

function chipStacks(hand, winner = null, payout = 0) {
  const stacks = [...(hand?.betting_state?.player_chips ?? [])];
  if (winner != null && stacks[winner] != null) {
    stacks[winner] += payout;
  }
  return stacks;
}

export function buildFinalHandSettlement(hand, tableSeats = []) {
  if (!hand) {
    return {
      winner: null,
      winner_player_address: null,
      pot_size_per_player: [],
      chips_balances: [],
    };
  }

  const numPlayers = Number(hand.current_state?.num_players ?? tableSeats.length ?? 0);
  const activePlayers = hand.betting_state?.active_players ?? [];
  const payoutAmount = Number(hand.betting_state?.pot?.toString?.() ?? 0);
  const foldedWinner = activePlayers.filter(Boolean).length === 1
    ? activePlayers.findIndex(Boolean)
    : null;
  const payoutForWinner = (winner) => Array.from({ length: numPlayers }, (_, player) => (
    player === winner ? payoutAmount : 0
  ));

  if (foldedWinner != null) {
    return {
      winner: foldedWinner,
      winner_player_address: tableSeats[foldedWinner]?.playerAddress ?? null,
      pot_size_per_player: payoutForWinner(foldedWinner),
      chips_balances: chipStacks(hand, foldedWinner, payoutAmount),
    };
  }

  const deck = hand.get_poker_deck();
  const playerCards = hand.get_player_cards().map((cardSet) => {
    try {
      return cardsToStrings(deck.unmasked_cards(cardSet));
    } catch {
      return [];
    }
  });
  const communityCards = [];
  for (let round = 0; round < POKER_HOLDEM_ROUNDS; round += 1) {
    const cards = hand.get_community_cards(round);
    if (cards) {
      communityCards.push(...cardsToStrings(deck.unmasked_cards(cards)));
    }
  }

  const showdown = holdemShowdown(playerCards, communityCards, activePlayers);
  const winner = showdown.winner;
  return {
    winner,
    winner_player_address: winner == null ? null : tableSeats[winner]?.playerAddress ?? null,
    pot_size_per_player: winner == null ? Array(numPlayers).fill(0) : payoutForWinner(winner),
    chips_balances: chipStacks(hand, winner, winner == null ? 0 : payoutAmount),
  };
}

function finalTranscript({
  lobbyId,
  tableId,
  handId,
  hand,
  handSetup,
  handHistoryEntries,
  tableSeats,
}) {
  const handState = hand?.get_current_state?.();
  const bettingState = hand?.betting_state;
  const numPlayers = Number(hand?.current_state?.num_players ?? 0);

  return {
    type: 'PrivatePokerFinalHandTranscript',
    version: 1,
    lobby_id: lobbyId?.toString?.() ?? String(lobbyId ?? ''),
    table_id: tableId?.toString?.() ?? String(tableId ?? ''),
    hand_id: handId?.toString?.() ?? String(handId ?? ''),
    hand_setup: handSetup ?? null,
    state: {
      current_state: handState?.current_state ?? null,
      current_player: handState?.get_current_player?.() ?? null,
      current_round: hand?.current_state?.current_round ?? null,
      dealer_button: hand?.current_state?.dealer_button ?? null,
      num_players: numPlayers,
    },
    betting: {
      pot: bettingState?.pot?.toString?.() ?? '0',
      active_players: bettingState?.active_players ?? [],
      all_in_players: bettingState?.allin_players ?? [],
      player_chips: (bettingState?.player_chips ?? []).map((chips) => Number(chips)),
      player_bets: (bettingState?.player_bets ?? []).map((chips) => Number(chips)),
    },
    players: Array.from({ length: numPlayers }, (_, seat) => ({
      seat,
      address: normalizeAddress(tableSeats?.[seat]?.playerAddress),
      public_key: pointHex(hand?.player_keys?.[seat]),
    })),
    hand_history: (handHistoryEntries ?? []).map((entry) => ({
      sequence_number: Number(entry?.sequence_number ?? entry?.wire?.sequence_number ?? 0),
      from: Number(entry?.from ?? entry?.wire?.from ?? 0),
      wire: entry?.wire ?? null,
      action_signature: entry?.action_signature ?? null,
    })),
  };
}

function finalDigestPayload({ transcript, settlement, lobbyId, tableId, handId }) {
  const payload = textEncoder.encode(canonicalJson(transcript));
  const handDigest = keccak256(payload);
  const settlementMessage = {
    type: 'PrivatePokerFinalHandSettlement',
    version: 1,
    lobby_id: lobbyId?.toString?.() ?? String(lobbyId ?? ''),
    table_id: tableId?.toString?.() ?? String(tableId ?? ''),
    hand_id: handId?.toString?.() ?? String(handId ?? ''),
    hand_digest: handDigest,
    winner_player_address: normalizeAddress(settlement?.winner_player_address),
    pot_size_per_player: (settlement?.pot_size_per_player ?? []).map((chips) => Number(chips)),
    chips_balances: (settlement?.chips_balances ?? []).map((chips) => Number(chips)),
  };
  const settlementDigest = keccak256(textEncoder.encode(canonicalJson(settlementMessage)));

  return {
    transcript,
    settlementMessage,
    finalHandDigest: handDigest,
    settlementDigest,
    signaturePayload: hexToBytes(settlementDigest),
  };
}

function assertFinishedHand(hand) {
  if (!hand?.get_current_state?.().is_finished?.()) {
    throw new Error('Final verification requires a finished hand.');
  }
  const cheater = hand.verify_unmasking?.();
  if (cheater != null) {
    throw new Error(`Player cheated during unmasking ${cheater}`);
  }
}

function publicKeyForSeat(hand, seat) {
  const publicKey = hand?.player_keys?.[seat];
  if (!publicKey) throw new Error(`Missing final public key for Player ${seat + 1}.`);
  return publicKey;
}

function decodePublicKey(publicKey) {
  return make_public_key_from_compressed_slice(hexToBytes(ensureHexPrefix(publicKey)));
}

function decodeSignature(signature) {
  return make_signature_from_compressed_slice(hexToBytes(ensureHexPrefix(signature)));
}

function assertSignedTranscriptPresent(handHistoryEntries) {
  if (!handHistoryEntries?.length) {
    throw new Error('Final verification requires a signed hand transcript.');
  }
}

function normalizeSignatureShares(signatureShares = []) {
  return [...signatureShares].sort((left, right) => (
    Number(left.signer_seat ?? 0) - Number(right.signer_seat ?? 0)
  ));
}

function aggregateSignatureShares({ hand, signatureShares, signaturePayload }) {
  const ordered = normalizeSignatureShares(signatureShares);
  const signatureSharePoints = [];
  const publicKeySharePoints = [];

  ordered.forEach((share, index) => {
    const seat = Number(share?.signer_seat);
    if (seat !== index) {
      throw new Error(`Final verification expected Player ${index + 1} signature.`);
    }
    if (share.scheme !== FINAL_VERIFICATION_SIGNATURE_SCHEME) {
      throw new Error(`Unsupported final verification signature from Player ${seat + 1}.`);
    }

    const expectedPublicKey = pointHex(publicKeyForSeat(hand, seat)).toLowerCase();
    if (ensureHexPrefix(share.public_key).toLowerCase() !== expectedPublicKey) {
      throw new Error(`Final verification public key mismatch for Player ${seat + 1}.`);
    }

    const publicKey = decodePublicKey(share.public_key);
    const signature = decodeSignature(share.signature);
    if (!blsVerify(signaturePayload, publicKey, signature)) {
      throw new Error(`Invalid final verification signature from Player ${seat + 1}.`);
    }

    const label = BigInt(seat + 1);
    signatureSharePoints.push([label, signature]);
    publicKeySharePoints.push([label, publicKey]);
  });

  const aggregateSignature = ordered.length > 0 ? combineLagrange(signatureSharePoints) : null;
  const aggregatePublicKey = ordered.length > 0 ? recoverLagrange(publicKeySharePoints) : null;

  if (
    aggregateSignature
    && aggregatePublicKey
    && !blsVerify(signaturePayload, aggregatePublicKey, aggregateSignature)
  ) {
    throw new Error('Invalid Lagrange aggregate final verification signature.');
  }

  return {
    signatureShares: ordered,
    signerSeats: ordered.map((share) => Number(share.signer_seat)),
    aggregateSignature: aggregateSignature ? hexPoint(aggregateSignature.toRawBytes(true)) : null,
    aggregatePublicKey: aggregatePublicKey ? hexPoint(aggregatePublicKey.toRawBytes(true)) : null,
  };
}

export function buildNextFinalVerification({
  lobbyId,
  tableId,
  handId,
  hand,
  handSetup,
  handHistoryEntries,
  tableSeats,
  settlement = buildFinalHandSettlement(hand, tableSeats),
  signatureShares = [],
  currentSeatNo,
  signingKey,
  publicKey,
}) {
  assertFinishedHand(hand);
  assertSignedTranscriptPresent(handHistoryEntries);

  const transcript = finalTranscript({
    lobbyId,
    tableId,
    handId,
    hand,
    handSetup,
    handHistoryEntries,
    tableSeats,
  });
  const digestPayload = finalDigestPayload({
    transcript,
    settlement,
    lobbyId,
    tableId,
    handId,
  });
  const verified = aggregateSignatureShares({
    hand,
    signatureShares,
    signaturePayload: digestPayload.signaturePayload,
  });

  const nextSeat = verified.signatureShares.length;
  const numPlayers = Number(hand?.current_state?.num_players ?? 0);
  if (nextSeat >= numPlayers) {
    return {
      ...digestPayload,
      ...verified,
      nextSeat,
      complete: true,
      signed: false,
    };
  }
  if (Number(currentSeatNo) !== nextSeat) {
    return {
      ...digestPayload,
      ...verified,
      nextSeat,
      complete: false,
      signed: false,
    };
  }

  const finalPublicKey = publicKey ?? publicKeyForSeat(hand, currentSeatNo);
  const signature = blsSign(digestPayload.signaturePayload, signingKey);
  const nextSignatureShares = [
    ...verified.signatureShares,
    {
      scheme: FINAL_VERIFICATION_SIGNATURE_SCHEME,
      signer_seat: Number(currentSeatNo),
      public_key: pointHex(finalPublicKey),
      signature: hexPoint(signature.toRawBytes(true)),
    },
  ];
  const nextVerified = aggregateSignatureShares({
    hand,
    signatureShares: nextSignatureShares,
    signaturePayload: digestPayload.signaturePayload,
  });

  return {
    ...digestPayload,
    ...nextVerified,
    nextSeat: nextVerified.signatureShares.length,
    complete: nextVerified.signatureShares.length === numPlayers,
    signed: true,
  };
}

export function useFinalVerification() {
  const buildNextFinalVerificationCallback = useCallback((args) => (
    buildNextFinalVerification(args)
  ), []);

  const submitFinalHandOnChain = useCallback((finalVerification) => {
    console.log('[FinalVerification] submit final hand on-chain placeholder', {
      handDigest: finalVerification.finalHandDigest,
      settlementDigest: finalVerification.settlementDigest,
      settlement: finalVerification.settlementMessage,
      signers: finalVerification.signerSeats,
      aggregateSignature: finalVerification.aggregateSignature,
      aggregatePublicKey: finalVerification.aggregatePublicKey,
    });
  }, []);

  return {
    buildNextFinalVerification: buildNextFinalVerificationCallback,
    submitFinalHandOnChain,
  };
}
