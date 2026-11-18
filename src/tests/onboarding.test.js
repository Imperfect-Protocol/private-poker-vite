import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MIN_NATIVE_BALANCE,
  PPDC_READY_THRESHOLD,
  StepState,
  buildOnboardingPlan,
} from '../lib/onboarding.js';

const ZERO = 0n;
const SOME_PPDC = 500_000_000n;
const ENOUGH_PPDC = PPDC_READY_THRESHOLD + 1n;
const NO_ETH = MIN_NATIVE_BALANCE - 1n;
const SOME_ETH = MIN_NATIVE_BALANCE * 2n;

const base = {
  hasWallet: true,
  isConnected: true,
  onArbitrum: true,
  pddcBalance: SOME_PPDC,
  arbitrumBalance: SOME_ETH,
  ethereumBalance: ZERO,
  hasAccount: false,
  isVerified: false,
};

test('a wallet above the PPDC threshold has every setup step done', () => {
  const plan = buildOnboardingPlan({ ...base, pddcBalance: ENOUGH_PPDC, arbitrumBalance: NO_ETH, ethereumBalance: ZERO });

  assert.equal(plan.ppdcReady, true);
  assert.equal(plan.next, null);
  assert.deepEqual(plan.steps, {
    install: StepState.DONE,
    network: StepState.DONE,
    topUp: StepState.DONE,
    bridge: StepState.DONE,
  });
});

test('no wallet leaves only the install step active', () => {
  const plan = buildOnboardingPlan({
    ...base,
    hasWallet: false,
    isConnected: false,
    onArbitrum: false,
    pddcBalance: null,
    arbitrumBalance: null,
    ethereumBalance: null,
  });

  assert.equal(plan.next, 'install');
  assert.deepEqual(plan.steps, {
    install: StepState.CURRENT,
    network: StepState.WAITING,
    topUp: StepState.WAITING,
    bridge: StepState.WAITING,
  });
});

test('an installed but disconnected wallet makes the network step active', () => {
  const plan = buildOnboardingPlan({
    ...base,
    isConnected: false,
    onArbitrum: false,
    pddcBalance: null,
    arbitrumBalance: null,
    ethereumBalance: null,
  });

  assert.equal(plan.next, 'network');
  assert.equal(plan.steps.install, StepState.DONE);
  assert.equal(plan.steps.network, StepState.CURRENT);
  assert.equal(plan.steps.topUp, StepState.WAITING);
  assert.equal(plan.steps.bridge, StepState.WAITING);
});

test('a connected wallet without test ETH is asked to top up first', () => {
  const plan = buildOnboardingPlan({
    ...base,
    arbitrumBalance: NO_ETH,
    ethereumBalance: NO_ETH,
  });

  assert.equal(plan.next, 'topUp');
  assert.equal(plan.steps.network, StepState.DONE);
  assert.equal(plan.steps.topUp, StepState.CURRENT);
  assert.equal(plan.steps.bridge, StepState.WAITING);
});

test('ETH on Ethereum Sepolia makes bridging the active step', () => {
  const plan = buildOnboardingPlan({
    ...base,
    arbitrumBalance: NO_ETH,
    ethereumBalance: SOME_ETH,
  });

  assert.equal(plan.next, 'bridge');
  assert.equal(plan.steps.topUp, StepState.DONE);
  assert.equal(plan.steps.bridge, StepState.CURRENT);
});

test('ETH on Arbitrum Sepolia needs no top up and no bridge', () => {
  const plan = buildOnboardingPlan({
    ...base,
    arbitrumBalance: SOME_ETH,
    ethereumBalance: ZERO,
  });

  assert.equal(plan.next, null);
  assert.equal(plan.steps.topUp, StepState.DONE);
  assert.equal(plan.steps.bridge, StepState.DONE);
});

test('account flags pass through untouched', () => {
  const plan = buildOnboardingPlan(base);
  assert.equal(plan.hasAccount, false);
  assert.equal(plan.isVerified, false);

  const known = buildOnboardingPlan({ ...base, hasAccount: true, isVerified: true });
  assert.equal(known.hasAccount, true);
  assert.equal(known.isVerified, true);
});
