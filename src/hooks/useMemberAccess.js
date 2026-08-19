import { useEffect, useState } from 'react';
import { useConnection } from 'wagmi';
import { isAddress, parseAbi } from 'viem';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import { ACCOUNT_CONTRACT_ADDRESS } from '@/lib/chain';
import { publicPokerClient } from '@/lib/publicPokerClient';

const ACCOUNT_STATUS = {
  VERIFIED: 2n,
  SUSPENDED: 4n,
  BANNED: 8n,
  DELETED: 16n,
};

const ACCOUNT_ABI = parseAbi([
  "function getAccountStatus(address player_address) view returns (uint256)",
  "function isSubscriptionActive(address player_address) view returns (bool)",
]);

const normalizeAddress = (value) => value?.toLowerCase() ?? '';

export function useMemberAccess() {
  const { address, isConnected } = useConnection();
  const { accountSession, isRestoringSession } = useAccountSession();
  const [accountStatus, setAccountStatus] = useState(0n);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAccessDelaying, setIsAccessDelaying] = useState(true);
  const [hasCheckedAccount, setHasCheckedAccount] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAccessDelaying(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval = null;

    const loadAccount = async () => {
      if (!isConnected || !address || !isAddress(ACCOUNT_CONTRACT_ADDRESS)) {
        setAccountStatus(0n);
        setIsSubscriptionActive(false);
        setIsChecking(false);
        setHasCheckedAccount(true);
        return;
      }

      setIsChecking(true);
      try {
        const status = await publicPokerClient.readContract({
          address: ACCOUNT_CONTRACT_ADDRESS,
          abi: ACCOUNT_ABI,
          functionName: 'getAccountStatus',
          args: [address],
        });
        const active = status === ACCOUNT_STATUS.VERIFIED
          ? await publicPokerClient.readContract({
            address: ACCOUNT_CONTRACT_ADDRESS,
            abi: ACCOUNT_ABI,
            functionName: 'isSubscriptionActive',
            args: [address],
          })
          : false;
        if (!cancelled) {
          setAccountStatus(status);
          setIsSubscriptionActive(Boolean(active));
        }
      } catch (error) {
        console.error('Failed to load membership account status:', error);
        if (!cancelled) {
          setAccountStatus(0n);
          setIsSubscriptionActive(false);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
          setHasCheckedAccount(true);
        }
      }
    };

    setHasCheckedAccount(false);
    loadAccount();
    interval = setInterval(loadAccount, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, isConnected]);

  const isWalletConnected = Boolean(isConnected && address);
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
    || (isWalletConnected && !hasCheckedAccount)
  );
  const isVerified = accountStatus === ACCOUNT_STATUS.VERIFIED;

  return {
    accountStatus,
    hasCurrentWalletKeypair,
    isAccountBanned: accountStatus === ACCOUNT_STATUS.BANNED,
    isAccountDeleted: accountStatus === ACCOUNT_STATUS.DELETED,
    isAccountSuspended: accountStatus === ACCOUNT_STATUS.SUSPENDED,
    isAccountVerified: isVerified,
    isAccessPending,
    isChecking,
    isMember: isWalletConnected && hasCurrentWalletKeypair && isVerified && isSubscriptionActive,
    isSubscriptionActive,
    isWalletConnected,
  };
}
