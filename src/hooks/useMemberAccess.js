import { useEffect, useState } from 'react';
import { useConnection } from 'wagmi';
import { isAddress, parseAbi } from 'viem';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import { CHIPS_CONTRACT_ADDRESS } from '@/lib/chain';
import { publicPokerClient } from '@/lib/publicPokerClient';

const CHIPS_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

const normalizeAddress = (value) => value?.toLowerCase() ?? '';

export function useMemberAccess() {
  const { address, isConnected } = useConnection();
  const { accountSession, isRestoringSession } = useAccountSession();
  const [chipsBalance, setChipsBalance] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAccessDelaying, setIsAccessDelaying] = useState(true);
  const [hasCheckedBalance, setHasCheckedBalance] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAccessDelaying(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval = null;

    const loadBalance = async () => {
      if (!isConnected || !address || !isAddress(CHIPS_CONTRACT_ADDRESS)) {
        setChipsBalance(null);
        setIsChecking(false);
        setHasCheckedBalance(true);
        return;
      }

      setIsChecking(true);
      try {
        const balance = await publicPokerClient.readContract({
          address: CHIPS_CONTRACT_ADDRESS,
          abi: CHIPS_ABI,
          functionName: 'balanceOf',
          args: [address],
        });
        if (!cancelled) setChipsBalance(balance);
      } catch (error) {
        console.error('Failed to load membership chips balance:', error);
        if (!cancelled) setChipsBalance(null);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          setHasCheckedBalance(true);
        }
      }
    };

    setHasCheckedBalance(false);
    loadBalance();
    interval = setInterval(loadBalance, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, isConnected]);

  const isWalletConnected = Boolean(isConnected && address);
  const hasChips = typeof chipsBalance === 'bigint' && chipsBalance > 0n;
  const hasCurrentWalletKeypair = Boolean(
    accountSession?.rootSeed
    && accountSession?.blsSeed
    && accountSession?.operatorPrivateKey
    && accountSession?.operatorBlsPrivateKey
    && accountSession?.operatorBlsPublicKey
    && normalizeAddress(accountSession.walletAddress) === normalizeAddress(address),
  );
  const isAccessPending = Boolean(
    isRestoringSession || isAccessDelaying
    || (isWalletConnected && !hasCheckedBalance)
  );

  return {
    chipsBalance,
    hasChips,
    hasCurrentWalletKeypair,
    isAccessPending,
    isChecking,
    isMember: isWalletConnected && hasChips && hasCurrentWalletKeypair,
    isWalletConnected,
  };
}
