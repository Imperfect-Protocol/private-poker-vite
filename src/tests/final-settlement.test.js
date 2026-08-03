import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildFinalHandSettlement,
  buildNextFinalVerification,
} from '../hooks/useFinalVerification.js';
import {
  POKER_HOLDEM_ROUNDS,
  PokerTable,
} from '../lib/crum_pkr/index.js';
import { make_public_key_from_signing_key } from '../lib/crum_bls/index.js';

const PLAYER_SIGNING_KEYS = [17n, 19n, 23n];
const INITIAL_CHIPS = 1000;
const SMALL_BLIND = 10;

function deterministicRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makePokerTable(numPlayers) {
  const table = PokerTable.new(numPlayers, POKER_HOLDEM_ROUNDS);
  for (let player = 1; player <= numPlayers; player += 1) {
    table.join(player);
  }
  table.start_hand(Array(numPlayers).fill(INITIAL_CHIPS), SMALL_BLIND, 0);
  return table;
}

function generateFinishedHand(numPlayers) {
  const table = makePokerTable(numPlayers);
  const hand = table.get_current_hand();
  const signingKeys = PLAYER_SIGNING_KEYS.slice(0, numPlayers);
  const publicKeys = signingKeys.map(make_public_key_from_signing_key);
  const tracesByPlayer = new Map();
  const handHistoryEntries = [];
  let steps = 0;

  while (!hand.get_current_state().is_finished()) {
    steps += 1;
    assert.ok(steps < 250, 'poker hand did not finish');

    const pokerState = hand.get_current_state().to_enum();
    const player = pokerState.player;
    const signingKey = signingKeys[player];

    switch (pokerState.type) {
      case 'Shuffle': {
        const cards = pokerState.is_dealer
          ? hand.get_poker_deck().masked_cards()
          : hand.get_shuffled_deck().clone();
        cards.mask(signingKey);
        const traces = cards.shuffle_traced(deterministicRng(0xC0FFEE + player));
        tracesByPlayer.set(player, traces);
        hand.submit_shuffled_deck(player, cards);
        break;
      }
      case 'SmallBlind':
        hand.submit_small_blind(player);
        break;
      case 'BigBlind':
        hand.submit_big_blind(player);
        break;
      case 'UnmaskHoleCards': {
        const cards = hand.get_player_cards().map((cardSet) => cardSet.clone());
        cards.forEach((cardSet, index) => {
          if (index !== player) cardSet.unmask(signingKey);
        });
        hand.submit_player_cards(player, cards);
        break;
      }
      case 'Bet':
        hand.submit_bet(player, hand.get_call_amount_required(player));
        break;
      case 'UnmaskCommunityCards': {
        const cards = hand.get_community_cards(pokerState.round)?.clone();
        assert.ok(cards, `missing community cards for round ${pokerState.round}`);
        cards.unmask(signingKey);
        hand.submit_community_cards(player, pokerState.round, cards);
        break;
      }
      case 'UnmaskShowdown': {
        const cards = hand.get_player_cards().map((cardSet) => cardSet.clone());
        cards[player].unmask(signingKey);
        hand.submit_player_cards_showdown(player, cards);
        break;
      }
      case 'SubmitPublicKey': {
        const traces = tracesByPlayer.get(player);
        assert.ok(traces, `missing shuffle traces for player ${player}`);
        hand.submit_public_key(player, publicKeys[player], traces);
        break;
      }
      default:
        throw new Error(`unhandled poker state: ${pokerState.type}`);
    }

    handHistoryEntries.push({
      sequence_number: steps,
      from: player ?? 0,
      wire: {
        hand_id: 1,
        sequence_number: steps,
        state: pokerState.type,
        player: player ?? null,
      },
      action_signature: {
        scheme: 'test-transcript-already-verified',
      },
    });
  }

  return {
    hand,
    signingKeys,
    publicKeys,
    handHistoryEntries,
  };
}

test('final settlement round verifies unmasking, evaluates winner, and Lagrange-aggregates player signatures', () => {
  const numPlayers = 3;
  const { hand, signingKeys, publicKeys, handHistoryEntries } = generateFinishedHand(numPlayers);
  const tableSeats = Array.from({ length: numPlayers }, (_, seat) => ({
    playerAddress: `0x${String(seat + 1).padStart(40, '0')}`,
  }));
  const handSetup = {
    hand_id: 1,
    hand_number: 1,
    initial_chips: Array(numPlayers).fill(INITIAL_CHIPS),
    small_blind: SMALL_BLIND,
    dealer_button: 0,
  };

  let signatureShares = [];
  let previousSettlementDigest = null;
  let finalVerification = null;

  for (let player = 0; player < numPlayers; player += 1) {
    const settlement = buildFinalHandSettlement(hand, tableSeats);
    finalVerification = buildNextFinalVerification({
      lobbyId: 1n,
      tableId: 777n,
      handId: 1n,
      hand,
      handSetup,
      handHistoryEntries,
      tableSeats,
      settlement,
      signatureShares,
      currentSeatNo: player,
      signingKey: signingKeys[player],
      publicKey: publicKeys[player],
    });

    assert.equal(finalVerification.signed, true);
    assert.equal(finalVerification.signerSeats.at(-1), player);
    assert.equal(finalVerification.signatureShares.length, player + 1);
    assert.ok(finalVerification.finalHandDigest.startsWith('0x'));
    assert.ok(finalVerification.settlementDigest.startsWith('0x'));
    assert.ok(finalVerification.aggregateSignature?.startsWith('0x'));
    assert.ok(finalVerification.aggregatePublicKey?.startsWith('0x'));
    assert.deepEqual(
      finalVerification.settlementMessage.pot_size_per_player,
      settlement.pot_size_per_player,
    );
    assert.deepEqual(
      finalVerification.settlementMessage.chips_balances,
      settlement.chips_balances,
    );

    previousSettlementDigest ??= finalVerification.settlementDigest;
    assert.equal(finalVerification.settlementDigest, previousSettlementDigest);
    signatureShares = finalVerification.signatureShares;
  }

  assert.equal(finalVerification.complete, true);
  assert.equal(finalVerification.signatureShares.length, numPlayers);
  assert.equal(finalVerification.signerSeats.join(','), '0,1,2');
  assert.ok(tableSeats.some((seat) => (
    seat.playerAddress.toLowerCase()
      === finalVerification.settlementMessage.winner_player_address?.toLowerCase()
  )));
  assert.equal(
    finalVerification.settlementMessage.pot_size_per_player.reduce((sum, amount) => sum + amount, 0),
    Number(hand.betting_state.pot.toString()),
  );
});
