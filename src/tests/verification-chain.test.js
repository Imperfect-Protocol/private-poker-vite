import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPublicClient, encodeFunctionData, http, isAddress } from 'viem';

import {
  CHAIN_KEY,
  CHAIN_RPC_URL,
  VERIFY_SHUFFLE_CONTRACT_ADDRESS,
  VERIFY_UNMASKING_CONTRACT_ADDRESS,
} from '../lib/chain/index.js';
import {
  POKER_HAND_STATE_TO_CONTRACT_STATE,
  VERIFY_SHUFFLE_ABI,
  VERIFY_UNMASKING_ABI,
} from '../lib/verification.js';
import { Fr, G1, G2 } from '../lib/crum_bls/curves.js';

function configuredRpcUrl() {
  if (CHAIN_RPC_URL === '/local-rpc') {
    return process.env.PRIVATE_POKER_TEST_RPC_URL
      ?? process.env.RPC_URL
      ?? 'http://localhost:8547';
  }
  return CHAIN_RPC_URL;
}

function requireConfiguredAddress(name, address) {
  assert.ok(address, `${name} is not configured for chain ${CHAIN_KEY}`);
  assert.ok(isAddress(address), `${name} is not a valid address: ${address}`);
}

function client() {
  return createPublicClient({
    transport: http(configuredRpcUrl()),
  });
}

function pointHex(point) {
  return `0x${Buffer.from(point.toRawBytes(true)).toString('hex')}`;
}

function card(seed) {
  return G1.BASE.multiply(BigInt(seed));
}

function publicKey(secret) {
  return G2.BASE.multiply(secret);
}

function mask(point, secret) {
  return point.multiply(secret);
}

function unmask(point, secret) {
  return point.multiply(Fr.inv(secret));
}

function u32LeHex(value) {
  const bytes = Buffer.alloc(4);
  bytes.writeUInt32LE(value);
  return bytes.toString('hex');
}

function traceHex({ afterIndex, beforeIndex }) {
  return `0x${u32LeHex(afterIndex)}${u32LeHex(beforeIndex)}`;
}

function knownShuffleArgs() {
  const secret = 17n;
  const maskedBefore = Array.from({ length: 10 }, (_, index) => card(11 + index));
  const order = [2, 0, 7, 4, 9, 1, 8, 3, 6, 5];
  const maskedAfter = order.map((beforeIndex) => mask(maskedBefore[beforeIndex], secret));
  const traces = order.map((beforeIndex, afterIndex) => traceHex({ afterIndex, beforeIndex }));

  return [
    maskedBefore.map(pointHex),
    maskedAfter.map(pointHex),
    pointHex(publicKey(secret)),
    traces,
  ];
}

function knownUnmaskingArgs() {
  const secret0 = 17n;
  const secret1 = 19n;
  const finalDeck = Array.from({ length: 10 }, (_, index) => card(31 + index))
    .map((point) => mask(mask(point, secret0), secret1));

  const playerKeys = [publicKey(secret0), publicKey(secret1)].map(pointHex);

  const p0HoleAfterP1 = finalDeck.slice(0, 2).map((point) => unmask(point, secret1));
  const p1HoleAfterP0 = finalDeck.slice(2, 4).map((point) => unmask(point, secret0));

  const flopAfterP0 = finalDeck.slice(4, 7).map((point) => unmask(point, secret0));
  const flopAfterP0P1 = flopAfterP0.map((point) => unmask(point, secret1));

  const turnAfterP0 = finalDeck.slice(7, 8).map((point) => unmask(point, secret0));
  const turnAfterP0P1 = turnAfterP0.map((point) => unmask(point, secret1));

  const riverAfterP0 = finalDeck.slice(8, 9).map((point) => unmask(point, secret0));
  const riverAfterP0P1 = riverAfterP0.map((point) => unmask(point, secret1));

  const p0Showdown = p0HoleAfterP1.map((point) => unmask(point, secret0));
  const p1Showdown = p1HoleAfterP0.map((point) => unmask(point, secret1));

  const cardRows = (rows) => rows.map((row) => row.map(pointHex));
  const stage = (rows) => cardRows(rows);

  const holeCards = POKER_HAND_STATE_TO_CONTRACT_STATE.UnmaskHoleCards;
  const communityCards = POKER_HAND_STATE_TO_CONTRACT_STATE.UnmaskCommunityCards;
  const showdown = POKER_HAND_STATE_TO_CONTRACT_STATE.UnmaskShowdown;

  return [
    2,
    playerKeys,
    [finalDeck.map(pointHex)],
    [
      stage([[], p1HoleAfterP0]),
      stage([p0HoleAfterP1, []]),
      stage([flopAfterP0]),
      stage([flopAfterP0P1]),
      stage([turnAfterP0]),
      stage([turnAfterP0P1]),
      stage([riverAfterP0]),
      stage([riverAfterP0P1]),
      stage([p0Showdown, []]),
      stage([[], p1Showdown]),
    ],
    [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [
      holeCards,
      holeCards,
      communityCards,
      communityCards,
      communityCards,
      communityCards,
      communityCards,
      communityCards,
      showdown,
      showdown,
    ],
  ];
}

async function expectVoidEthCall({ to, abi, functionName, args }) {
  const result = await client().call({
    to,
    data: encodeFunctionData({ abi, functionName, args }),
  });
  assert.equal(result.data ?? '0x', '0x');
}

test('verify shuffle contract accepts known valid shuffle calldata', async () => {
  requireConfiguredAddress('VERIFY_SHUFFLE_CONTRACT_ADDRESS', VERIFY_SHUFFLE_CONTRACT_ADDRESS);

  await expectVoidEthCall({
    to: VERIFY_SHUFFLE_CONTRACT_ADDRESS,
    abi: VERIFY_SHUFFLE_ABI,
    functionName: 'verifyShuffle',
    args: knownShuffleArgs(),
  });
});

test('verify unmasking contract accepts known valid unmasking calldata', async () => {
  requireConfiguredAddress('VERIFY_UNMASKING_CONTRACT_ADDRESS', VERIFY_UNMASKING_CONTRACT_ADDRESS);

  await expectVoidEthCall({
    to: VERIFY_UNMASKING_CONTRACT_ADDRESS,
    abi: VERIFY_UNMASKING_ABI,
    functionName: 'verifyUnmasking',
    args: knownUnmaskingArgs(),
  });
});
