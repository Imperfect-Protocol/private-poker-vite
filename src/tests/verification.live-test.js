import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createPublicClient,
  createWalletClient,
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
  VERIFY_UNMASKING_CONTRACT_ADDRESS,
} from '../lib/chain/index.js';
import {
  VERIFY_SHUFFLE_ABI,
  VERIFY_UNMASKING_ABI,
  buildShuffleVerificationArgs,
  buildUnmaskingVerificationArgs,
} from '../lib/verification.js';
import { configuredMaxGas } from '../lib/gas.js';
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
]);

const ANVIL_ACCOUNTS = [
  privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
  privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'),
  // privateKeyToAccount('0x5de4111afa1a4b4b9f1faae4c1b9bf7d09230a575301d1df0d62a17eb340e345'),
  // privateKeyToAccount('0x7c852118294443be1bde3ebdcd99382415a8d082dbafa64fe2ab9079e6cde31c'),
  // privateKeyToAccount('0x47e179ec1974888300232f2d8590a4b263e68e771b3d5d2a39a7edbf68867245'),
  // privateKeyToAccount('0x8b3a350cf5c34c9194ca3a545d42a0b3222acb54c2d6392e5d7844d27cb1b897'),
];

const DEFAULT_FUNDER_PRIVATE_KEY = '0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659';
const PLAYER_SIGNING_KEYS = [17n, 19n, 23n, 29n, 31n, 37n];
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
  assert.ok(
    isAddress(VERIFY_UNMASKING_CONTRACT_ADDRESS),
    `VERIFY_UNMASKING_CONTRACT_ADDRESS is not configured: ${VERIFY_UNMASKING_CONTRACT_ADDRESS}`,
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

function generateFinishedHand(numPlayers) {
  const table = makePokerTable(numPlayers);
  const hand = table.get_current_hand();
  const signingKeys = PLAYER_SIGNING_KEYS.slice(0, numPlayers);
  const publicKeys = signingKeys.map(make_public_key_from_signing_key);
  const tracesByPlayer = new Map();
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

const USD_PER_ETH = 2_000;
const WEI_PER_ETH = 1_000_000_000_000_000_000n;

async function expectSuccessfulReceipt(client, hash, label, testContext = null) {
  const receipt = await client.waitForTransactionReceipt({ hash });
  testContext?.diagnostic(`${label}: gasUsed=${receipt.gasUsed}, ${receiptCostLabel(receipt)}`);
  assert.equal(
    receipt.status,
    'success',
    `${label} reverted in tx ${hash}; gasUsed=${receipt.gasUsed}`,
  );
  return receipt;
}

function receiptCostLabel(receipt) {
  const gasPrice = receipt.effectiveGasPrice ?? 0n;
  const wei = receipt.gasUsed * gasPrice;
  const eth = Number(wei) / Number(WEI_PER_ETH);
  const usd = eth * USD_PER_ETH;
  return `cost=${eth.toFixed(8)} ETH (~$${usd.toFixed(4)} at $${USD_PER_ETH}/ETH)`;
}

async function writeAndWait(client, account, functionName, args, testContext = null, label = functionName) {
  let hash;
  try {
    hash = await walletClient(account).writeContract({
      address: PRIVATE_POKER_CONTRACT_ADDRESS,
      abi: LIVE_ABI,
      functionName,
      args,
      ...gasOverride({ address: PRIVATE_POKER_CONTRACT_ADDRESS, functionName, args }),
    });
  } catch (error) {
    throw new Error(`${label} transaction was rejected: ${contractErrorSummary(error)}`);
  }
  return expectSuccessfulReceipt(client, hash, label, testContext);
}

async function writeVerifierAndWait(client, account, {
  address,
  abi,
  functionName,
  args,
  label = functionName,
  testContext = null,
}) {
  let hash;
  try {
    hash = await walletClient(account).writeContract({
      address,
      abi,
      functionName,
      args,
      ...gasOverride({ address, functionName, args }),
    });
  } catch (error) {
    throw new Error(`${label} transaction was rejected: ${contractErrorSummary(error)}`);
  }
  return expectSuccessfulReceipt(client, hash, label, testContext);
}

function gasOverride(request) {
  const gas = configuredMaxGas(request);
  return gas == null ? {} : { gas };
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

test('app verification args submit through standalone live devnode verifier contracts', { timeout: 300_000 }, async (t) => {
  requireDevnode();

  const client = publicClient();
  const lobbyCount = await client.readContract({
    address: PRIVATE_POKER_CONTRACT_ADDRESS,
    abi: LIVE_ABI,
    functionName: 'getLobbyCount',
  });
  assert.ok(lobbyCount > 0n, 'devnode has no lobbies; deploy contracts and seed a lobby first');

  for (const account of ANVIL_ACCOUNTS) {
    await ensureFunded(client, account);
  }

  const lobbyId = 1n;
  const tableId = BigInt(Date.now());
  const numPlayers = BigInt(ANVIL_ACCOUNTS.length);
  const { hand, publicKeys, tracesByPlayer } = generateFinishedHand(ANVIL_ACCOUNTS.length);
  const unmasking = buildUnmaskingVerificationArgs({ hand });

  await writeAndWait(client, ANVIL_ACCOUNTS[0], 'createTable', [
    lobbyId,
    tableId,
    `Verification ${tableId}`,
    0n,
    numPlayers,
    ANVIL_ACCOUNTS[0].address,
    ANVIL_ACCOUNTS[0].address,
    '0x',
  ], t);
  for (let player = 1; player < ANVIL_ACCOUNTS.length; player += 1) {
    await writeAndWait(client, ANVIL_ACCOUNTS[player], 'joinTable', [
      lobbyId,
      tableId,
      ANVIL_ACCOUNTS[player].address,
      ANVIL_ACCOUNTS[player].address,
      '0x',
    ], t, `joinTable player ${player}`);
  }
  for (let player = 0; player < ANVIL_ACCOUNTS.length; player += 1) {
    await writeAndWait(client, ANVIL_ACCOUNTS[player], 'startHand', [lobbyId, tableId], t, `startHand player ${player}`);
  }

  t.diagnostic(
    `unmasking args: shuffleHistoryCards=[${unmasking.shuffleHistory.map((deck) => deck.length).join(',')}], unmaskEntries=${unmasking.unmaskingSequenceCards.length}`,
  );

  for (let player = 0; player < ANVIL_ACCOUNTS.length; player += 1) {
    const traces = tracesByPlayer.get(player);
    const shuffleArgs = buildShuffleVerificationArgs({
      hand,
      player,
      publicKey: publicKeys[player],
      traces,
      shuffleTracesByPlayer: tracesByPlayer,
    });
    t.diagnostic(
      `player ${player} shuffle args: maskedBefore=${shuffleArgs.maskedBefore.length}, maskedAfter=${shuffleArgs.maskedAfter.length}, traces=${shuffleArgs.traces.length}`,
    );
    await writeVerifierAndWait(client, ANVIL_ACCOUNTS[player], {
      address: VERIFY_SHUFFLE_CONTRACT_ADDRESS,
      abi: VERIFY_SHUFFLE_ABI,
      functionName: 'verifyShuffle',
      args: [
        shuffleArgs.maskedBefore,
        shuffleArgs.maskedAfter,
        shuffleArgs.publicKey,
        shuffleArgs.traces,
      ],
      label: `verifyShuffle player ${player}`,
      testContext: t,
    });
  }

  await writeVerifierAndWait(client, ANVIL_ACCOUNTS[0], {
    address: VERIFY_UNMASKING_CONTRACT_ADDRESS,
    abi: VERIFY_UNMASKING_ABI,
    functionName: 'verifyUnmasking',
    args: [
      unmasking.numPlayers,
      unmasking.playerKeys,
      unmasking.shuffleHistory,
      unmasking.unmaskingSequenceCards,
      unmasking.unmaskingActors,
      unmasking.unmaskingStates,
    ],
    label: 'verifyUnmasking',
    testContext: t,
  });
});
