import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatEther,
  http,
  isAddress,
  parseAbi,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  CHAIN_KEY,
  CHAIN_RPC_URL,
  PRIVATE_POKER_CONTRACT_ADDRESS,
  VERIFY_SHUFFLE_CONTRACT_ADDRESS,
} from '../lib/chain/index.js';
import {
  VERIFY_SHUFFLE_ABI,
  buildShuffleVerificationArgs,
  buildSubmitPublicKeyVerificationArgs,
} from '../lib/verification.js';
import {
  POKER_HOLDEM_ROUNDS,
  PokerTable,
} from '../lib/crum_pkr/index.js';
import { make_public_key_from_signing_key } from '../lib/crum_bls/index.js';

const LIVE_ABI = parseAbi([
  'function getLobbyCount() view returns (uint256)',
  'function createTable(uint256 lobby_id, uint256 table_id, string name, uint256 buy_in, uint256 num_players, address player_address, address operator, bytes annonce_public_key)',
  'function joinTable(uint256 lobby_id, uint256 table_id, address player_address, address operator, bytes annonce_public_key)',
  'function startHand(uint256 lobby_id, uint256 table_id)',
  'function submitPublicKey(uint256 lobby_id, uint256 table_id, uint256 hand_id, uint8 player, bytes public_key, bytes[] masked_before, bytes[] masked_after, bytes[] traces, bytes[] player_keys, bytes[][] shuffle_history, bytes[][][] unmasking_sequence_cards, uint8[] unmasking_actors, uint8[] unmasking_states)',
]);

const ANVIL_ACCOUNTS = [
  privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
  privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'),
];

const DEFAULT_FUNDER_PRIVATE_KEY = '0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659';
const PLAYER_SIGNING_KEYS = [17n, 19n];
const INITIAL_CHIPS = 1000;
const SMALL_BLIND = 10;

function configuredRpcUrl() {
  if (CHAIN_RPC_URL === '/local-rpc') {
    return process.env.PRIVATE_POKER_TEST_RPC_URL
      ?? process.env.RPC_URL
      ?? 'http://localhost:8547';
  }
  return CHAIN_RPC_URL;
}

function requireDevnode() {
  assert.equal(
    CHAIN_KEY,
    'devnode',
    'live verification test must run with NEXT_PUBLIC_PRIVATE_POKER_CHAIN=devnode',
  );
  assert.ok(
    isAddress(PRIVATE_POKER_CONTRACT_ADDRESS),
    `PRIVATE_POKER_CONTRACT_ADDRESS is not configured: ${PRIVATE_POKER_CONTRACT_ADDRESS}`,
  );
  assert.ok(
    isAddress(VERIFY_SHUFFLE_CONTRACT_ADDRESS),
    `VERIFY_SHUFFLE_CONTRACT_ADDRESS is not configured: ${VERIFY_SHUFFLE_CONTRACT_ADDRESS}`,
  );
}

function publicClient() {
  return createPublicClient({
    transport: http(configuredRpcUrl()),
  });
}

function walletClient(account) {
  return createWalletClient({
    account,
    transport: http(configuredRpcUrl()),
  });
}

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

function generateFinishedTwoPlayerHand() {
  const table = makePokerTable(2);
  const hand = table.get_current_hand();
  const publicKeys = PLAYER_SIGNING_KEYS.map(make_public_key_from_signing_key);
  const tracesByPlayer = new Map();
  let steps = 0;

  while (!hand.get_current_state().is_finished()) {
    steps += 1;
    assert.ok(steps < 100, 'poker hand did not finish');

    const pokerState = hand.get_current_state().to_enum();
    const player = pokerState.player;
    const signingKey = PLAYER_SIGNING_KEYS[player];

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
  }

  return { hand, publicKeys, tracesByPlayer };
}

async function ensureFunded(client, account) {
  const minimumBalance = parseEther('0.5');
  const balance = await client.getBalance({ address: account.address });
  if (balance >= minimumBalance) return;

  const funderPrivateKey = process.env.PRIVATE_POKER_TEST_FUNDER_PRIVATE_KEY
    ?? DEFAULT_FUNDER_PRIVATE_KEY;
  const funder = privateKeyToAccount(funderPrivateKey);
  const funderBalance = await client.getBalance({ address: funder.address });

  assert.ok(
    funderBalance >= parseEther('1'),
    `Anvil account ${account.address} has ${formatEther(balance)} ETH and funder ${funder.address} has ${formatEther(funderBalance)} ETH`,
  );

  const hash = await walletClient(funder).sendTransaction({
    to: account.address,
    value: parseEther('1'),
  });
  await expectSuccessfulReceipt(client, hash, `fund ${account.address}`);
}

async function expectSuccessfulReceipt(client, hash, label) {
  const receipt = await client.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success', `${label} reverted in tx ${hash}`);
  return receipt;
}

async function writeAndWait(client, account, functionName, args) {
  let hash;
  try {
    hash = await walletClient(account).writeContract({
      address: PRIVATE_POKER_CONTRACT_ADDRESS,
      abi: LIVE_ABI,
      functionName,
      args,
    });
  } catch (error) {
    throw new Error(`${functionName} transaction was rejected: ${contractErrorSummary(error)}`);
  }
  return expectSuccessfulReceipt(client, hash, functionName);
}

async function expectCallable(client, account, functionName, args) {
  try {
    await client.call({
      account,
      to: PRIVATE_POKER_CONTRACT_ADDRESS,
      data: encodeFunctionData({ abi: LIVE_ABI, functionName, args }),
    });
  } catch (error) {
    throw new Error(`${functionName} eth_call reverted: ${contractErrorSummary(error)}`);
  }
}

async function expectStandaloneShuffleCallable(client, player, args, testContext) {
  const [maskedBefore, maskedAfter, publicKey, traces] = args;
  testContext.diagnostic(
    `player ${player} shuffle args: maskedBefore=${maskedBefore.length}, maskedAfter=${maskedAfter.length}, traces=${traces.length}, calldataBytes=${encodedCalldataBytes(VERIFY_SHUFFLE_ABI, 'verifyShuffle', args)}`,
  );

  try {
    await client.call({
      to: VERIFY_SHUFFLE_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: VERIFY_SHUFFLE_ABI,
        functionName: 'verifyShuffle',
        args,
      }),
    });
  } catch (error) {
    await diagnoseStandaloneShuffleTraceLimit(client, player, args, testContext);
    throw new Error(
      `standalone verifyShuffle failed for player ${player}: ${contractErrorSummary(error)}`,
    );
  }
}

async function diagnoseStandaloneShuffleTraceLimit(client, player, args, testContext) {
  const [maskedBefore, maskedAfter, publicKey, traces] = args;
  const counts = [1, 2, 4, 8, 16, 32, traces.length]
    .filter((count, index, values) => count <= traces.length && values.indexOf(count) === index);

  for (const count of counts) {
    try {
      await client.call({
        to: VERIFY_SHUFFLE_CONTRACT_ADDRESS,
        data: encodeFunctionData({
          abi: VERIFY_SHUFFLE_ABI,
          functionName: 'verifyShuffle',
          args: [maskedBefore, maskedAfter, publicKey, traces.slice(0, count)],
        }),
      });
      testContext.diagnostic(`player ${player} standalone verifyShuffle traces=${count}: ok`);
    } catch (error) {
      testContext.diagnostic(
        `player ${player} standalone verifyShuffle traces=${count}: ${contractErrorSummary(error)}`,
      );
    }
  }
}

function encodedCalldataBytes(abi, functionName, args) {
  const data = encodeFunctionData({ abi, functionName, args });
  return (data.length - 2) / 2;
}

function contractErrorSummary(error) {
  const data = findErrorData(error);
  const ascii = hexToAscii(data);
  return [
    error?.name ? `name=${error.name}` : null,
    error?.shortMessage ?? error?.message ?? String(error),
    error?.details ? `details=${error.details}` : null,
    error?.code != null ? `code=${error.code}` : null,
    data ? `data=${data}` : null,
    ascii ? `ascii=${ascii}` : null,
  ].filter(Boolean).join('; ');
}

function findErrorData(error) {
  let current = error;
  for (let depth = 0; current && depth < 6; depth += 1) {
    if (typeof current.data === 'string') return current.data;
    current = current.cause;
  }
  return null;
}

function hexToAscii(data) {
  if (!data?.startsWith?.('0x') || data.length <= 2 || data.length % 2 !== 0) return null;
  const text = Buffer.from(data.slice(2), 'hex').toString('utf8');
  return /^[\x20-\x7e]+$/.test(text) ? text : null;
}

test('app verification args submit through the live devnode diamond path', { timeout: 300_000 }, async (t) => {
  requireDevnode();

  const client = publicClient();
  const lobbyCount = await client.readContract({
    address: PRIVATE_POKER_CONTRACT_ADDRESS,
    abi: LIVE_ABI,
    functionName: 'getLobbyCount',
  });
  assert.ok(lobbyCount > 0n, 'devnode has no lobbies; deploy contracts and seed a lobby first');

  await Promise.all(ANVIL_ACCOUNTS.map((account) => ensureFunded(client, account)));

  const lobbyId = 1n;
  const tableId = BigInt(Date.now());
  const handId = 1n;
  const numPlayers = BigInt(ANVIL_ACCOUNTS.length);
  const { hand, publicKeys, tracesByPlayer } = generateFinishedTwoPlayerHand();

  await writeAndWait(client, ANVIL_ACCOUNTS[0], 'createTable', [
    lobbyId,
    tableId,
    `Verification ${tableId}`,
    0n,
    numPlayers,
    ANVIL_ACCOUNTS[0].address,
    ANVIL_ACCOUNTS[0].address,
    '0x',
  ]);
  await writeAndWait(client, ANVIL_ACCOUNTS[1], 'joinTable', [
    lobbyId,
    tableId,
    ANVIL_ACCOUNTS[1].address,
    ANVIL_ACCOUNTS[1].address,
    '0x',
  ]);
  await writeAndWait(client, ANVIL_ACCOUNTS[0], 'startHand', [lobbyId, tableId]);
  await writeAndWait(client, ANVIL_ACCOUNTS[1], 'startHand', [lobbyId, tableId]);

  for (let player = 0; player < ANVIL_ACCOUNTS.length; player += 1) {
    const traces = tracesByPlayer.get(player);
    const shuffleArgs = buildShuffleVerificationArgs({
      hand,
      player,
      publicKey: publicKeys[player],
      traces,
    });
    const args = buildSubmitPublicKeyVerificationArgs({
      lobbyId,
      tableId,
      handId,
      hand,
      player,
      publicKey: publicKeys[player],
      traces,
    });

    await expectStandaloneShuffleCallable(
      client,
      player,
      [
        shuffleArgs.maskedBefore,
        shuffleArgs.maskedAfter,
        shuffleArgs.publicKey,
        shuffleArgs.traces,
      ],
      t,
    );
    await expectCallable(client, ANVIL_ACCOUNTS[player], 'submitPublicKey', args);
    await writeAndWait(client, ANVIL_ACCOUNTS[player], 'submitPublicKey', args);
  }
});
