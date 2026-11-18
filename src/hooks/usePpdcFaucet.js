import { useCallback, useMemo, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useConnection, useWriteContract } from 'wagmi';
import { isAddress } from 'viem';
import { PPDC_CONTRACT_ADDRESS } from '@/lib/chain';
import { publicPokerClient } from '@/lib/publicPokerClient';
import { useChainPolling } from '@/hooks/useChainPolling';
import {
  PPDC_FAUCET_ABI,
  PPDC_FAUCET_DEFAULT_AMOUNT,
  PPDC_FAUCET_GAS_OVERRIDES,
  allowanceTone,
  effectiveAllowance,
  formatPpdc,
  nextRefillLabel,
  parsePpdc,
} from '@/lib/ppdcFaucet';

const toRequest = (address, functionName) => (
  address && isAddress(PPDC_CONTRACT_ADDRESS)
    ? {
      address: PPDC_CONTRACT_ADDRESS,
      abi: PPDC_FAUCET_ABI,
      functionName,
      args: [address],
    }
    : null
);

export function usePpdcFaucet() {
  const { address, isConnected } = useConnection();
  const { mutateAsync: writeContract } = useWriteContract();
  const { open } = useAppKit();
  const [amount, setAmount] = useState(PPDC_FAUCET_DEFAULT_AMOUNT);
  const [isFunding, setIsFunding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const enabled = Boolean(isConnected && address);
  const remainingRequest = useMemo(() => toRequest(address, 'faucetRemainingAmount'), [address]);
  const refillRequest = useMemo(() => toRequest(address, 'faucetNextRefill'), [address]);
  const balanceRequest = useMemo(() => toRequest(address, 'balanceOf'), [address]);

  const remainingPoll = useChainPolling(remainingRequest, { enabled });
  const refillPoll = useChainPolling(refillRequest, { enabled });
  const balancePoll = useChainPolling(balanceRequest, { enabled });

  const remaining = remainingPoll.data ?? null;
  const nextRefill = refillPoll.data ?? null;
  const balance = balancePoll.data ?? null;
  const isLoading = enabled && (remainingPoll.isLoading || refillPoll.isLoading);

  const allowance = useMemo(() => (
    remaining == null
      ? null
      : effectiveAllowance({
        remaining,
        nextRefill: nextRefill ?? 0n,
        nowSeconds: BigInt(Math.floor(Date.now() / 1000)),
      })
  ), [nextRefill, remaining]);

  const requestedAmount = useMemo(() => {
    try {
      return parsePpdc(amount);
    } catch {
      return null;
    }
  }, [amount]);

  const claimAmount = requestedAmount == null || allowance == null
    ? 0n
    : (requestedAmount > allowance ? allowance : requestedAmount);

  const canClaim = enabled
    && !isFunding
    && requestedAmount != null
    && requestedAmount > 0n
    && allowance != null
    && claimAmount > 0n;

  const fund = useCallback(async () => {
    if (!canClaim) return;
    setError('');
    setMessage('');
    setIsFunding(true);

    try {
      const hash = await writeContract({
        address: PPDC_CONTRACT_ADDRESS,
        abi: PPDC_FAUCET_ABI,
        functionName: 'faucet',
        args: [address, claimAmount],
        ...PPDC_FAUCET_GAS_OVERRIDES,
      });

      setMessage('Funding transaction submitted. Waiting for confirmation...');
      const receipt = await publicPokerClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error(`Funding reverted in transaction ${hash}`);
      }
      setMessage(`Sent ${formatPpdc(claimAmount)} PPDC to your wallet.`);
    } catch (err) {
      console.error('PPDC funding failed:', err);
      setError(err?.shortMessage ?? err?.message ?? 'Funding failed.');
    } finally {
      setIsFunding(false);
    }
  }, [address, canClaim, claimAmount, writeContract]);

  return {
    address,
    isConnected,
    open,
    amount,
    setAmount,
    allowance,
    allowanceTone: allowance == null ? 'empty' : allowanceTone(allowance),
    nextRefill: nextRefillLabel({ nextRefill, allowance: allowance ?? 0n }),
    balance,
    isLoading,
    isFunding,
    canClaim,
    requestedAmount,
    claimAmount,
    message,
    error,
    fund,
  };
}
