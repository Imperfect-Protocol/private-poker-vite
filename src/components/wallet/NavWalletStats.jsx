import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useConnection } from 'wagmi';
import { formatUnits, isAddress, parseAbi } from 'viem';
import { CHIPS_CONTRACT_ADDRESS, PPDC_CONTRACT_ADDRESS } from '@/lib/chain';
import { useChainPolling } from '@/hooks/useChainPolling';

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

function GetStartedLink() {
  return (
    <Link
      to="/get-started"
      className="inline-flex h-8 items-center gap-1.5 rounded border border-teal-500/40 bg-teal-500/10 px-3 font-mono text-[0.7em] font-bold uppercase tracking-[0.18em] text-teal-200 transition-colors hover:border-teal-400 hover:bg-teal-500/20 hover:text-white"
    >
      Get Started
      <ArrowRight size={11} aria-hidden />
    </Link>
  );
}

/**
 * The navbar balance strip. A wallet with no PPDC cannot sit down, so the
 * numbers are replaced by a pointer to the setup guide.
 */
export default function NavWalletStats() {
  const { address, isConnected } = useConnection();
  const ppdcRequest = useMemo(() => balanceRequest(PPDC_CONTRACT_ADDRESS, address), [address]);
  const chipsRequest = useMemo(() => balanceRequest(CHIPS_CONTRACT_ADDRESS, address), [address]);
  const ppdcPoll = useChainPolling(ppdcRequest, { enabled: Boolean(ppdcRequest), intervalMs: 10000 });
  const chipsPoll = useChainPolling(chipsRequest, { enabled: Boolean(chipsRequest), intervalMs: 10000 });

  if (!isConnected) return <GetStartedLink />;

  const ppdcBalance = ppdcPoll.error ? null : ppdcPoll.data ?? null;
  const chipsBalance = chipsPoll.error ? null : chipsPoll.data ?? null;

  if (ppdcBalance == null) return null;

  if (ppdcBalance === 0n) return <GetStartedLink />;

  return (
    <div className="flex items-center rounded border border-teal-500/20 bg-slate-900 px-1 py-1">
      <div className="flex items-center gap-3 px-3 py-1 font-mono text-[0.8em] font-bold">
        <span className="text-cyan-300">{formatBalance(ppdcBalance)} PPDC</span>
        <span className="text-slate-700">|</span>
        <span className="text-teal-400">
          {chipsBalance == null ? '... CHIPS' : `${formatBalance(chipsBalance)} CHIPS`}
        </span>
      </div>
    </div>
  );
}
