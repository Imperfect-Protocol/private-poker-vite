import { useMemo } from 'react';
import { useConnection } from 'wagmi';
import { formatUnits, isAddress, parseAbi } from 'viem';
import { CHIPS_CONTRACT_ADDRESS } from '@/lib/chain';
import { useChainPolling } from '@/hooks/useChainPolling';
import { usePpdcBalance } from '@/hooks/usePpdcBalance';

const BALANCE_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

const formatBalance = (value) => Number(formatUnits(value, 6)).toFixed(2);

const balanceRequest = (tokenAddress, account) => (
  account && isAddress(tokenAddress)
    ? {
      address: tokenAddress,
      abi: BALANCE_ABI,
      functionName: 'balanceOf',
      args: [account],
    }
    : null
);

/**
 * The navbar balance strip. A wallet with no PPDC cannot sit down, so the
 * numbers stay hidden and the navbar's single action points at the setup guide.
 */
export default function NavWalletStats() {
  const { address, isConnected } = useConnection();
  const { pddc } = usePpdcBalance();
  const chipsRequest = useMemo(() => balanceRequest(CHIPS_CONTRACT_ADDRESS, address), [address]);
  const chipsPoll = useChainPolling(chipsRequest, { enabled: Boolean(chipsRequest), intervalMs: 10000 });

  if (!isConnected || pddc == null || pddc === 0n) return null;

  const chipsBalance = chipsPoll.error ? null : chipsPoll.data ?? null;

  return (
    <div className="flex items-center rounded border border-teal-500/20 bg-slate-900 px-1 py-1">
      <div className="flex items-center gap-3 px-3 py-1 font-mono text-[0.8em] font-bold">
        <span className="text-cyan-300">{formatBalance(pddc)} PPDC</span>
        <span className="text-slate-700">|</span>
        <span className="text-teal-400">
          {chipsBalance == null ? '... CHIPS' : `${formatBalance(chipsBalance)} CHIPS`}
        </span>
      </div>
    </div>
  );
}
