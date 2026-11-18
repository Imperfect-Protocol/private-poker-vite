import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PPDC_FAUCET_MAX_REFILL,
  allowanceTone,
  effectiveAllowance,
  formatPpdc,
  nextRefillLabel,
  parsePpdc,
} from '../lib/ppdcFaucet.js';

test('PPDC amounts round-trip through the 6-decimal token format', () => {
  assert.equal(parsePpdc('100'), 100_000_000n);
  assert.equal(parsePpdc('12.5'), 12_500_000n);
  assert.equal(parsePpdc(''), 0n);
  assert.equal(formatPpdc(100_000_000n), '100.00');
  assert.equal(formatPpdc(12_500_000n), '12.50');
});

test('allowance is restored to the cap once the refill timestamp passes', () => {
  const remaining = 10_000_000n;
  const nextRefill = 1_700_000_000n;

  assert.equal(
    effectiveAllowance({ remaining, nextRefill, nowSeconds: 1_699_999_999n }),
    remaining,
  );
  assert.equal(
    effectiveAllowance({ remaining, nextRefill, nowSeconds: 1_700_000_001n }),
    PPDC_FAUCET_MAX_REFILL,
  );
  assert.equal(
    effectiveAllowance({ remaining: 0n, nextRefill: 0n, nowSeconds: 1_700_000_001n }),
    PPDC_FAUCET_MAX_REFILL,
  );
});

test('refill label reads as available while allowance remains', () => {
  assert.equal(nextRefillLabel({ nextRefill: 0n, allowance: 0n }), 'Available now');
  assert.equal(nextRefillLabel({ nextRefill: 1_700_000_000n, allowance: 1n }), 'Available now');
  assert.notEqual(
    nextRefillLabel({ nextRefill: 1_700_000_000n, allowance: 0n }),
    'Available now',
  );
});

test('allowance tone escalates as the remaining allowance runs out', () => {
  assert.equal(allowanceTone(PPDC_FAUCET_MAX_REFILL), 'ok');
  assert.equal(allowanceTone(20_000_000n), 'low');
  assert.equal(allowanceTone(0n), 'empty');
});
