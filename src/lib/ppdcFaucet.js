import { formatUnits, parseUnits } from 'viem';

export const PPDC_DECIMALS = 6;
export const PPDC_FAUCET_MAX_REFILL = 100_000_000n;
export const PPDC_FAUCET_MIN_ALLOWANCE = 10_000_000n;
export const PPDC_FAUCET_LOW_ALLOWANCE = ((PPDC_FAUCET_MAX_REFILL - PPDC_FAUCET_MIN_ALLOWANCE) * 20n / 100n)
  + PPDC_FAUCET_MIN_ALLOWANCE;
export const PPDC_FAUCET_DEFAULT_AMOUNT = '100';

export const PPDC_FAUCET_GAS_OVERRIDES = {
  maxFeePerGas: 1_000_000_000n,
  maxPriorityFeePerGas: 10_000_000n,
};

export const PPDC_FAUCET_ABI = [
  {
    type: 'function',
    name: 'faucet',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'faucetRemainingAmount',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'faucetNextRefill',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

export function formatPpdc(value) {
  return Number(formatUnits(value ?? 0n, PPDC_DECIMALS)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parsePpdc(value) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return 0n;
  return parseUnits(normalized, PPDC_DECIMALS);
}

/**
 * The faucet grants an allowance that refills over time. Once the refill
 * timestamp has passed the allowance is back to the full cap. A fresh account
 * reports a zero refill timestamp, which also means the cap is available.
 */
export function effectiveAllowance({ remaining, nextRefill, nowSeconds }) {
  return nowSeconds > nextRefill ? PPDC_FAUCET_MAX_REFILL : remaining;
}

export function nextRefillLabel({ nextRefill, allowance }) {
  if (!nextRefill || nextRefill === 0n || allowance > 0n) return 'Available now';
  return new Date(Number(nextRefill) * 1000).toLocaleString();
}

export function allowanceTone(allowance) {
  if (allowance < PPDC_FAUCET_MIN_ALLOWANCE) return 'empty';
  if (allowance <= PPDC_FAUCET_LOW_ALLOWANCE) return 'low';
  return 'ok';
}
