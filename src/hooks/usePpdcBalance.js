import { useMemo } from 'react';
import { useConnection } from 'wagmi';
import { isAddress, parseAbi } from 'viem';
import { PPDC_CONTRACT_ADDRESS } from '@/lib/chain';
import { useChainPolling } from '@/hooks/useChainPolling';

const BALANCE_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

/**
 * Reads the connected wallet's PPDC balance. A wallet needs PPDC before it can
 * sign up, so this decides between Get Started and Sign Up in the navbar.
 */
export function usePpdcBalance() {
  const { address, isConnected } = useConnection();
  const request = useMemo(() => (
    isConnected && address && isAddress(PPDC_CONTRACT_ADDRESS)
      ? {
        address: PPDC_CONTRACT_ADDRESS,
        abi: BALANCE_ABI,
        functionName: 'balanceOf',
        args: [address],
      }
      : null
  ), [address, isConnected]);
  const poll = useChainPolling(request, { enabled: Boolean(request), intervalMs: 10000 });

  const pddc = poll.error ? null : poll.data ?? null;

  return {
    pddc,
    hasPpdc: pddc != null && pddc > 0n,
    isChecking: Boolean(request) && !poll.hasResolved && !poll.error,
  };
}
