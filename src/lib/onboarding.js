import { parseEther } from 'viem';

/** More than 1000 PPDC means the wallet can already play without a claim. */
export const PPDC_READY_THRESHOLD = 1_000_000_000n;
export const MIN_NATIVE_BALANCE = parseEther('0.01');

export const StepState = Object.freeze({
  DONE: 'done',
  CURRENT: 'current',
  WAITING: 'waiting',
});

const STEP_ORDER = ['install', 'network', 'topUp', 'bridge'];

/**
 * Decides which setup steps are done, which one is next, and which ones can
 * wait. A step is only done when the chain says so; everything after the next
 * unfinished step waits and is shown collapsed.
 */
export function buildOnboardingPlan({
  hasWallet,
  isConnected,
  onArbitrum,
  pddcBalance,
  arbitrumBalance,
  ethereumBalance,
  hasAccount,
  isVerified,
}) {
  const ppdcReady = pddcBalance != null && pddcBalance > PPDC_READY_THRESHOLD;
  const arbitrumReady = arbitrumBalance != null && arbitrumBalance >= MIN_NATIVE_BALANCE;
  const ethereumReady = ethereumBalance != null && ethereumBalance >= MIN_NATIVE_BALANCE;

  const steps = {
    install: hasWallet || ppdcReady ? StepState.DONE : StepState.CURRENT,
    network: ppdcReady || (isConnected && onArbitrum)
      ? StepState.DONE
      : hasWallet ? StepState.CURRENT : StepState.WAITING,
    topUp: ppdcReady || arbitrumReady || ethereumReady
      ? StepState.DONE
      : hasWallet ? StepState.CURRENT : StepState.WAITING,
    bridge: ppdcReady || arbitrumReady
      ? StepState.DONE
      : ethereumReady ? StepState.CURRENT : StepState.WAITING,
  };

  const next = STEP_ORDER.find((id) => steps[id] !== StepState.DONE) ?? null;

  for (const id of STEP_ORDER) {
    if (id !== next && steps[id] !== StepState.DONE) steps[id] = StepState.WAITING;
  }

  return {
    steps,
    next,
    ppdcReady,
    arbitrumReady,
    ethereumReady,
    hasAccount: Boolean(hasAccount),
    isVerified: Boolean(isVerified),
  };
}
