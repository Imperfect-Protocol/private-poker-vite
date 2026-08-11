/* global process */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPublicClient, createWalletClient, http, isAddress, parseAbi, parseEther } from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';

import {
  PRIVATE_POKER_CONTRACT_ADDRESS,
  PPDC_CONTRACT_ADDRESS,
  CHAIN_ID,
  CHAIN_KEY,
  CHAIN_MAX_GAS,
  CHAIN_RPC_URL,
} from '../lib/chain/index.js';
import {
  buildFinalHandSettlement,
  buildNextFinalVerification,
  buildNextTableAggregatePublicKeyVerification,
  settlementContractArgs,
  tableAggregatePublicKey,
  tableAggregatePublicKeyContractArgs,
} from '../hooks/useFinalVerification.js';
import {
  POKER_HAND_STATE_SHUFFLE,
  POKER_HAND_STATE_FINISHED,
} from '../lib/crum_pkr/index.js';
import {
  HAND_ID,
  INITIAL_CHIPS,
  playFinishedP2pHand,
  publicKeyHex,
} from './final-settlement-helpers.js';

const PRIVATE_POKER_ABI = parseAbi([
  'function getLobbyById(uint256 lobbyId) view returns (bytes)',
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function subscribe(address player_address, address operator, bytes annonce_public_key, bytes encrypted_profile, uint8 subscription_tier)',
  'function createTable(uint256 lobby_id, uint256 table_id, string calldata name, uint256 buy_in, uint256 num_players, address player_address, address operator, bytes calldata annonce_public_key)',
  'function joinTable(uint256 lobby_id, uint256 table_id, address player_address, address operator, bytes calldata annonce_public_key)',
  'function setTableAggregatePublicKey(uint256 lobby_id, uint256 table_id, bytes aggregate_public_key, bytes aggregate_signature)',
  'function startHand(uint256 lobby_id, uint256 table_id)',
  'function settleHand(uint256 lobby_id, uint256 table_id, uint256 hand_id, uint256 pot_size, uint256[] pot_split, uint256[] chips_balances, bytes digest, bytes aggregate_signature)',
]);

const TEST_USDC_ABI = parseAbi([
  'function faucet(uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]);

const DEV_MNEMONIC = 'test test test test test test test test test test test junk';
const DEV_OWNER_PRIVATE_KEY = process.env.PP_PRIVATE_KEY
  ?? process.env.PRIVATE_POKER_DEV_OWNER_PRIVATE_KEY
  ?? '0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659';
const LOBBY_ID = 1n;
const NUM_PLAYERS = Number(process.env.PRIVATE_POKER_LIVE_PLAYERS ?? 3);
const BUY_IN = BigInt(INITIAL_CHIPS);
const STARTER_SUBSCRIPTION_USDC = 10_000_000n;
const PLAYER_GAS_TOP_UP = parseEther('0.1');
const ETH_USD = 2000;

function rpcUrl() {
  if (CHAIN_RPC_URL === '/local-rpc') return 'http://localhost:8547';
  return CHAIN_RPC_URL;
}

function testChain() {
  return {
    id: CHAIN_ID,
    name: CHAIN_KEY,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl()] } },
  };
}

function standardAccount(index) {
  return mnemonicToAccount(DEV_MNEMONIC, { addressIndex: index });
}

function liveTableId() {
  const timestamp = BigInt(Math.floor(Date.now() / 1000));
  return 9_000_000n + (timestamp % 1_000_000n);
}

function gasLimit(functionName) {
  return BigInt(
    CHAIN_MAX_GAS.privatePoker?.functions?.[functionName]
      ?? CHAIN_MAX_GAS.privatePoker?.default
      ?? 5_000_000n,
  );
}

function gasUsd(receipt) {
  const gasCostWei = receipt.gasUsed * (receipt.effectiveGasPrice ?? 0n);
  const eth = Number(gasCostWei) / 1e18;
  return eth * ETH_USD;
}

function receiptLine(label, receipt) {
  return [
    label,
    `hash=${receipt.transactionHash}`,
    `status=${receipt.status}`,
    `gasUsed=${receipt.gasUsed}`,
    `~$${gasUsd(receipt).toFixed(4)}`,
  ].join(' ');
}

async function writeAndWait({
  publicClient,
  walletClient,
  account,
  address = PRIVATE_POKER_CONTRACT_ADDRESS,
  abi = PRIVATE_POKER_ABI,
  functionName,
  args,
  gas = gasLimit(functionName),
}) {
  const hash = await walletClient.writeContract({
    account,
    address,
    abi,
    functionName,
    args,
    gas,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(receiptLine(`${functionName}(${account.address})`, receipt));
  assert.equal(receipt.status, 'success', `${functionName} reverted in tx ${hash}`);
  return receipt;
}

async function ensureLobby(publicClient) {
  await publicClient.readContract({
    address: PRIVATE_POKER_CONTRACT_ADDRESS,
    abi: PRIVATE_POKER_ABI,
    functionName: 'getLobbyById',
    args: [LOBBY_ID],
  });
}

async function ensurePlayerGas({ publicClient, walletClient, owner, player }) {
  const balance = await publicClient.getBalance({ address: player.address });
  if (balance >= PLAYER_GAS_TOP_UP / 2n) return null;

  const hash = await walletClient.sendTransaction({
    account: owner,
    to: player.address,
    value: PLAYER_GAS_TOP_UP,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(receiptLine(`fundGas(${player.address})`, receipt));
  assert.equal(receipt.status, 'success', `gas top-up reverted in tx ${hash}`);
  return receipt;
}

async function preparePlayer({ publicClient, walletClient, account, announcePublicKey }) {
  await writeAndWait({
    publicClient,
    walletClient,
    account,
    address: PPDC_CONTRACT_ADDRESS,
    abi: TEST_USDC_ABI,
    functionName: 'faucet',
    args: [STARTER_SUBSCRIPTION_USDC],
    gas: 1_000_000n,
  });
  await writeAndWait({
    publicClient,
    walletClient,
    account,
    address: PPDC_CONTRACT_ADDRESS,
    abi: TEST_USDC_ABI,
    functionName: 'transfer',
    args: [PRIVATE_POKER_CONTRACT_ADDRESS, STARTER_SUBSCRIPTION_USDC],
    gas: 1_000_000n,
  });
  await writeAndWait({
    publicClient,
    walletClient,
    account,
    functionName: 'subscribe',
    args: [account.address, account.address, announcePublicKey, '0x', 1],
  });
  await writeAndWait({
    publicClient,
    walletClient,
    account,
    functionName: 'approve',
    args: [PRIVATE_POKER_CONTRACT_ADDRESS, BUY_IN],
  });

  const chips = await publicClient.readContract({
    address: PRIVATE_POKER_CONTRACT_ADDRESS,
    abi: PRIVATE_POKER_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });
  assert.ok(chips >= BUY_IN, `Player ${account.address} has insufficient chips`);
}

test('live final settlement creates table, joins players, starts hand, and settles on-chain', async () => {
  assert.equal(CHAIN_KEY, 'devnode', 'live final settlement test expects devnode chain config');
  assert.ok(isAddress(PRIVATE_POKER_CONTRACT_ADDRESS), 'PrivatePoker diamond address is not configured');
  assert.ok(isAddress(PPDC_CONTRACT_ADDRESS), 'TEST_USDC/PPDC address is not configured');
  assert.ok(NUM_PLAYERS >= 2, 'live final settlement requires at least two players');

  const chain = testChain();
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl()) });
  const walletClient = createWalletClient({ chain, transport: http(rpcUrl()) });
  const owner = privateKeyToAccount(DEV_OWNER_PRIVATE_KEY);
  const tableId = liveTableId();
  const {
    hand,
    tableSigningKeys,
    tablePublicKeys,
    tableSignaturePublicKeys,
    handHistoryEntries,
    handSetup,
  } = playFinishedP2pHand(NUM_PLAYERS, Number(tableId));
  const accounts = Array.from({ length: NUM_PLAYERS }, (_, index) => standardAccount(index));
  const tableSeats = accounts.map((account, seat) => ({
    playerAddress: account.address,
    announcePublicKey: publicKeyHex(tablePublicKeys[seat]),
  }));
  const tableSignatureSeats = tableSeats.map((seat, index) => ({
    ...seat,
    signaturePublicKey: publicKeyHex(tableSignaturePublicKeys[index]),
  }));
  assert.deepEqual([
    POKER_HAND_STATE_SHUFFLE,
    POKER_HAND_STATE_FINISHED,
  ], [0, 8]);

  await ensureLobby(publicClient);

  for (const account of accounts) {
    await ensurePlayerGas({ publicClient, walletClient, owner, player: account });
  }

  for (let player = 0; player < NUM_PLAYERS; player += 1) {
    await preparePlayer({
      publicClient,
      walletClient,
      account: accounts[player],
      announcePublicKey: tableSeats[player].announcePublicKey,
    });
  }

  await writeAndWait({
    publicClient,
    walletClient,
    account: accounts[0],
    functionName: 'createTable',
    args: [
      LOBBY_ID,
      tableId,
      `Live Final Settlement ${tableId}`,
      BUY_IN,
      BigInt(NUM_PLAYERS),
      accounts[0].address,
      accounts[0].address,
      tableSeats[0].announcePublicKey,
    ],
  });

  for (let player = 1; player < NUM_PLAYERS; player += 1) {
    await writeAndWait({
      publicClient,
      walletClient,
      account: accounts[player],
      functionName: 'joinTable',
      args: [
        LOBBY_ID,
        tableId,
        accounts[player].address,
        accounts[player].address,
        tableSeats[player].announcePublicKey,
      ],
    });
  }

  const aggregatePublicKey = tableAggregatePublicKey(tableSignatureSeats);
  let tableAggregatePublicKeyShares = [];
  let tableAggregateSignatureShares = [];
  let tableAggregateVerification = null;
  for (let player = 0; player < NUM_PLAYERS; player += 1) {
    tableAggregateVerification = buildNextTableAggregatePublicKeyVerification({
      lobbyId: LOBBY_ID,
      tableId,
      tableSeats,
      publicKeyShares: tableAggregatePublicKeyShares,
      signatureShares: [],
      currentSeatNo: player,
      signingKey: tableSigningKeys[player],
      publicKey: tableSignaturePublicKeys[player],
    });
    tableAggregatePublicKeyShares = tableAggregateVerification.publicKeyShares;
  }

  for (let player = 0; player < NUM_PLAYERS; player += 1) {
    tableAggregateVerification = buildNextTableAggregatePublicKeyVerification({
      lobbyId: LOBBY_ID,
      tableId,
      tableSeats,
      publicKeyShares: tableAggregatePublicKeyShares,
      signatureShares: tableAggregateSignatureShares,
      currentSeatNo: player,
      signingKey: tableSigningKeys[player],
      publicKey: tableSignaturePublicKeys[player],
    });
    tableAggregateSignatureShares = tableAggregateVerification.signatureShares;
  }
  assert.equal(tableAggregateVerification.complete, true);
  assert.equal(tableAggregateVerification.aggregatePublicKey, aggregatePublicKey);

  await writeAndWait({
    publicClient,
    walletClient,
    account: accounts[NUM_PLAYERS - 1],
    functionName: 'setTableAggregatePublicKey',
    args: tableAggregatePublicKeyContractArgs({
      lobbyId: LOBBY_ID,
      tableId,
      tableAggregateVerification,
    }),
  });

  for (let player = 0; player < NUM_PLAYERS; player += 1) {
    await writeAndWait({
      publicClient,
      walletClient,
      account: accounts[player],
      functionName: 'startHand',
      args: [LOBBY_ID, tableId],
    });
  }

  let signatureShares = [];
  let finalVerification = null;
  for (let player = 0; player < NUM_PLAYERS; player += 1) {
    finalVerification = buildNextFinalVerification({
      lobbyId: LOBBY_ID,
      tableId,
      handId: BigInt(HAND_ID),
      hand,
      handSetup,
      handHistoryEntries,
      tableSeats,
      publicKeyShares: tableAggregateVerification.publicKeyShares,
      settlement: buildFinalHandSettlement(hand, tableSeats),
      signatureShares,
      currentSeatNo: player,
      signingKey: tableSigningKeys[player],
      publicKey: tableSignaturePublicKeys[player],
    });
    signatureShares = finalVerification.signatureShares;
  }
  assert.equal(finalVerification.complete, true);
  assert.equal(finalVerification.aggregatePublicKey, aggregatePublicKey);

  const settleArgs = settlementContractArgs({
    lobbyId: LOBBY_ID,
    tableId,
    handId: BigInt(HAND_ID),
    finalVerification,
  });
  const settleReceipt = await writeAndWait({
    publicClient,
    walletClient,
    account: accounts[NUM_PLAYERS - 1],
    functionName: 'settleHand',
    args: settleArgs,
  });

  const totalGasUsed = settleReceipt.gasUsed;
  console.log(`final settlement live tableId=${tableId} players=${NUM_PLAYERS} settleGas=${totalGasUsed}`);
});
