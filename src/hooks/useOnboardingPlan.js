import { useCallback, useEffect, useState } from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useConnection } from 'wagmi';
import { CHAIN_ID } from '@/lib/chain';
import { buildOnboardingPlan } from '@/lib/onboarding';
import { useMemberAccess } from '@/hooks/useMemberAccess';
import { useOnboardingBalances } from '@/hooks/useOnboardingBalances';

const NO_ACCOUNT = 0n;

const hasBrowserWallet = () => typeof window !== 'undefined' && Boolean(window.ethereum);

/**
 * Snapshot of everything the setup guide needs to decide what the player still
 * has to do: wallet, network, balances, and account status.
 */
export function useOnboardingPlan() {
  const { address, isConnected, chainId } = useConnection();
  const { open } = useAppKit();
  const memberAccess = useMemberAccess();
  const balances = useOnboardingBalances();
  const [walletDetected, setWalletDetected] = useState(hasBrowserWallet);

  useEffect(() => {
    if (walletDetected) return undefined;

    const onWalletAnnounced = () => setWalletDetected(hasBrowserWallet());
    window.addEventListener('ethereum#initialized', onWalletAnnounced, { once: true });
    return () => window.removeEventListener('ethereum#initialized', onWalletAnnounced);
  }, [walletDetected]);

  const hasWallet = walletDetected || isConnected;
  const onArbitrum = isConnected && chainId === CHAIN_ID;
  const isCheckingAccount = isConnected && memberAccess.isChecking;
  const hasAccount = isConnected
    && !isCheckingAccount
    && memberAccess.accountStatus !== NO_ACCOUNT;
  const isVerified = isConnected && !isCheckingAccount && memberAccess.isAccountVerified;
  const isSignedIn = isConnected && memberAccess.hasCurrentWalletKeypair;

  const plan = buildOnboardingPlan({
    hasWallet,
    isConnected,
    onArbitrum,
    pddcBalance: balances.pddc,
    arbitrumBalance: balances.arbitrum,
    ethereumBalance: balances.ethereum,
    hasAccount,
    isVerified,
  });

  const openWallet = useCallback(() => open(), [open]);
  const openNetworks = useCallback(() => open({ view: 'Networks' }), [open]);

  return {
    plan,
    address,
    hasWallet,
    isConnected,
    onArbitrum,
    isCheckingAccount,
    isSignedIn,
    balances,
    openWallet,
    openNetworks,
  };
}
