import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection, useWriteContract } from 'wagmi';
import { decodeAbiParameters, isAddress, parseAbi } from 'viem';
import { useAccountSession } from '@/contexts/AccountSessionContext.jsx';
import {
  EMPTY_ACCOUNT_PROFILE,
  buildAccountProfileBlob,
  profileHasRequiredFields,
  profileNeedsEdit,
  readAccountProfilePublicBlob,
  readAccountProfileBlob,
} from '@/lib/accountProfile';
import { buildAccountSessionTypedData } from '@/lib/accountSession';
import { PRIVATE_POKER_CONTRACT_ADDRESS, PPDC_CONTRACT_ADDRESS } from '@/lib/chain';
import { formatChainError } from '@/lib/chain/errors';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { getBufferedGasOverrides } from '@/lib/gas';
import { publicPokerClient } from '@/lib/publicPokerClient';
import { logWriteTransactionError, waitForLoggedTransactionReceipt } from '@/lib/tx_console';
import { useOperatorAddress } from '@/hooks/useOperatorAddress';

const PPDC_SCALE = 1_000_000n;

const PPDC_ABI = parseAbi([
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
]);

const PPDC = 'PPDC';
export const ACCOUNT_STATUS = {
  NONE: 0n,
  UNVERIFIED: 1n,
  VERIFIED: 2n,
  SUSPENDED: 4n,
  BANNED: 8n,
  DELETED: 16n,
};

const ACCOUNT_ABI = parseAbi([
  "function subscribe(address player_address, address operator, bytes annonce_public_key, bytes encrypted_profile, uint8 subscription_tier)",
  "function updateAccount(address player_address, bytes annonce_public_key, bytes encrypted_profile)",
  "function getAccountStatus(address player_address) view returns (uint256)",
  "function accountStatusChangedAt(address player_address) view returns (uint256)",
  "function isSubscriptionActive(address player_address) view returns (bool)",
  "function getAccount(address player_address) view returns (bytes)",
]);

const normalizeAddress = (value) => value?.toLowerCase() ?? '';

function tierToContractId(tier) {
  const index = SUBSCRIPTION_TIERS.findIndex((entry) => entry.id === tier.id);
  return index + 1;
}

function tierPpdcAmount(tier) {
  return BigInt(tier.monthlyPpdc) * PPDC_SCALE;
}

function decodeAccountBlob(blob) {
  const [account] = decodeAbiParameters(
    [{
      type: 'tuple',
      components: [
        { name: 'playerAddress', type: 'address' },
        { name: 'operator', type: 'address' },
        { name: 'flags', type: 'uint256' },
        { name: 'statusChangedAt', type: 'uint256' },
        { name: 'annoncePublicKey', type: 'bytes' },
        { name: 'encryptedProfile', type: 'bytes' },
        { name: 'subscriptionTier', type: 'uint8' },
        { name: 'subscriptionPaidAt', type: 'uint256' },
        { name: 'subscriptionExpiresAt', type: 'uint256' },
      ],
    }],
    blob,
  );

  return account;
}

export function accountStatusLabel(flags) {
  const status = BigInt(flags ?? 0n);
  if (status === ACCOUNT_STATUS.VERIFIED) return 'Verified';
  if (status === ACCOUNT_STATUS.SUSPENDED) return 'Suspended';
  if (status === ACCOUNT_STATUS.BANNED) return 'Banned';
  if (status === ACCOUNT_STATUS.DELETED) return 'Deleted';
  if (status === ACCOUNT_STATUS.UNVERIFIED) return 'Unverified';
  return 'Unverified';
}

export function useAccounts({ playerAddresses = [] } = {}) {
  const router = useRouter();
  const { accountSession, isSigningIn, isWalletConnected, signIn } = useAccountSession();
  const { address } = useConnection();
  const { mutateAsync: writeWalletContract } = useWriteContract();
  const { createOperatorAddress } = useOperatorAddress();
  const [step, setStep] = useState('signin');
  const [profileMode, setProfileMode] = useState('edit');
  const [profile, setProfile] = useState(EMPTY_ACCOUNT_PROFILE);
  const [profileBlob, setProfileBlob] = useState('');
  const [hasOnchainAccount, setHasOnchainAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState(ACCOUNT_STATUS.NONE);
  const [accountStatusChangedAt, setAccountStatusChangedAt] = useState(0n);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [playerDisplaynames, setPlayerDisplaynames] = useState({});
  const [selectedTier, setSelectedTier] = useState(SUBSCRIPTION_TIERS[1]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [subscriptionStep, setSubscriptionStep] = useState('');
  const [error, setError] = useState('');

  const signinData = useMemo(() => buildAccountSessionTypedData(), []);
  const signinFields = useMemo(() => (
    Object.entries(signinData.message).map(([field, value]) => ({
      field,
      value: typeof value === 'bigint' ? value.toString() : value,
    }))
  ), [signinData]);

  const playerAddressesKey = useMemo(() => (
    [...new Set(playerAddresses.map(normalizeAddress).filter(Boolean))].sort().join('|')
  ), [playerAddresses]);

  const syncProfileBlobToAccount = useCallback(async (blobHex) => {
    if (!accountSession || !blobHex || !isAddress(PRIVATE_POKER_CONTRACT_ADDRESS)) return;

    const operator = createOperatorAddress(accountSession.operatorPrivateKey);
    const args = [
      accountSession.walletAddress,
      accountSession.operatorBlsPublicKey ?? '0x',
      blobHex,
    ];
    let updateHash;
    try {
      updateHash = await operator.writeContract({
        contract: PRIVATE_POKER_CONTRACT_ADDRESS,
        abi: ACCOUNT_ABI,
        functionName: 'updateAccount',
        args,
      });
      await waitForLoggedTransactionReceipt({
        hash: updateHash,
        functionName: 'updateAccount',
        contract: PRIVATE_POKER_CONTRACT_ADDRESS,
        args,
      });
    } catch (error) {
      if (!updateHash) {
        logWriteTransactionError({
          functionName: 'updateAccount',
          contract: PRIVATE_POKER_CONTRACT_ADDRESS,
          args,
          error,
        });
      }
      throw error;
    }
  }, [accountSession, createOperatorAddress]);

  const loadAccountFromChain = useCallback(async (walletAddress, session) => {
    if (!isAddress(PRIVATE_POKER_CONTRACT_ADDRESS)) {
      return { exists: false, profileRecord: null, account: null, status: ACCOUNT_STATUS.NONE, statusChangedAt: 0n };
    }

    const status = await publicPokerClient.readContract({
      address: PRIVATE_POKER_CONTRACT_ADDRESS,
      abi: ACCOUNT_ABI,
      functionName: 'getAccountStatus',
      args: [walletAddress],
    });
    const statusChangedAt = status === ACCOUNT_STATUS.NONE
      ? 0n
      : await publicPokerClient.readContract({
        address: PRIVATE_POKER_CONTRACT_ADDRESS,
        abi: ACCOUNT_ABI,
        functionName: 'accountStatusChangedAt',
        args: [walletAddress],
      });
    if (status === ACCOUNT_STATUS.NONE) {
      return { exists: false, profileRecord: null, account: null, status, statusChangedAt };
    }

    const blob = await publicPokerClient.readContract({
      address: PRIVATE_POKER_CONTRACT_ADDRESS,
      abi: ACCOUNT_ABI,
      functionName: 'getAccount',
      args: [walletAddress],
    });
    const account = decodeAccountBlob(blob);
    const profileRecord = account.encryptedProfile && account.encryptedProfile !== '0x'
      ? await readAccountProfileBlob(account.encryptedProfile, session)
      : null;
    return { exists: true, profileRecord, account, status, statusChangedAt };
  }, []);

  useEffect(() => {
    if (!accountSession?.walletAddress) return undefined;

    let isMounted = true;
    const loadAccount = async () => {
      setIsCheckingAccount(true);
      if (!isAddress(PRIVATE_POKER_CONTRACT_ADDRESS)) {
        if (isMounted) {
          setHasOnchainAccount(false);
          setAccountStatus(ACCOUNT_STATUS.NONE);
          setAccountStatusChangedAt(0n);
          setProfile(EMPTY_ACCOUNT_PROFILE);
          setProfileBlob('');
          setProfileMode('edit');
          setIsSubscriptionActive(false);
          setStep('profile');
          setIsCheckingAccount(false);
        }
        return;
      }

      try {
        const { exists, profileRecord, status, statusChangedAt } = await loadAccountFromChain(
          accountSession.walletAddress,
          accountSession,
        );
        const isVerified = status === ACCOUNT_STATUS.VERIFIED;
        const isActive = isVerified
          ? await publicPokerClient.readContract({
            address: PRIVATE_POKER_CONTRACT_ADDRESS,
            abi: ACCOUNT_ABI,
            functionName: 'isSubscriptionActive',
            args: [accountSession.walletAddress],
          })
          : false;
        if (!isMounted) return;

        setHasOnchainAccount(exists);
        setAccountStatus(status);
        setAccountStatusChangedAt(statusChangedAt);
        setProfile(profileRecord?.profile ?? EMPTY_ACCOUNT_PROFILE);
        setProfileBlob(profileRecord?.blobHex ?? '');
        setProfileMode(profileNeedsEdit(profileRecord) ? 'edit' : 'view');
        setIsSubscriptionActive(Boolean(isActive));
        setStep(isVerified ? 'profile' : 'status');
      } catch (err) {
        console.debug('Account chain load failed:', err);
        if (isMounted) {
          setHasOnchainAccount(false);
          setAccountStatus(ACCOUNT_STATUS.NONE);
          setAccountStatusChangedAt(0n);
          setProfile(EMPTY_ACCOUNT_PROFILE);
          setProfileBlob('');
          setProfileMode('edit');
          setIsSubscriptionActive(false);
          setStep('status');
        }
      } finally {
        if (isMounted) setIsCheckingAccount(false);
      }
    };

    loadAccount();
    return () => {
      isMounted = false;
    };
  }, [accountSession, loadAccountFromChain]);

  useEffect(() => {
    if (!playerAddressesKey) return undefined;

    let isMounted = true;
    const addresses = playerAddressesKey.split('|').filter(Boolean);

    const loadDisplaynames = async () => {
      const entries = await Promise.all(addresses.map(async (playerAddress) => {
        try {
          const blob = await publicPokerClient.readContract({
            address: PRIVATE_POKER_CONTRACT_ADDRESS,
            abi: ACCOUNT_ABI,
            functionName: 'getAccount',
            args: [playerAddress],
          });
          const account = decodeAccountBlob(blob);
          const publicProfile = readAccountProfilePublicBlob(account.encryptedProfile);
          const displayName = publicProfile.displayName?.trim();
          return displayName ? [playerAddress, displayName] : null;
        } catch (err) {
          console.debug('Player display name lookup failed:', playerAddress, err);
          return null;
        }
      }));

      if (!isMounted) return;
      setPlayerDisplaynames((current) => ({
        ...current,
        ...Object.fromEntries(entries.filter(Boolean)),
      }));
    };

    loadDisplaynames();
    return () => {
      isMounted = false;
    };
  }, [playerAddressesKey]);

  const handleSignin = useCallback(async () => {
    setError('');

    try {
      const session = await signIn();
      if (session) setIsCheckingAccount(true);
    } catch (err) {
      console.error('Account sign-in failed:', err);
      setError('Signature cancelled. Sign in when you are ready.');
    }
  }, [signIn]);

  const handleProfileChange = useCallback((field, value) => {
    if (field === 'email' || field === 'phone' || field === 'legalName') return;
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const continueAfterProfile = useCallback(() => {
    if (accountStatus !== ACCOUNT_STATUS.VERIFIED) {
      setStep('status');
      return;
    }
    if (isSubscriptionActive) {
      router.push('/main-lobby');
      return;
    }
    setStep('subscription');
  }, [accountStatus, isSubscriptionActive, router]);

  const handleProfileEdit = useCallback(() => {
    setProfileMode('edit');
    setError('');
  }, []);

  const handleProfileContinue = useCallback(async () => {
    if (!profileHasRequiredFields(profile) || !profileBlob) {
      setProfileMode('edit');
      setError('Complete your profile before continuing.');
      return;
    }
    setError('');
    setIsSavingProfile(true);
    try {
      continueAfterProfile();
    } catch (err) {
      console.error('Account profile sync failed:', err);
      setError(err?.message ?? 'Profile sync failed.');
    } finally {
      setIsSavingProfile(false);
    }
  }, [continueAfterProfile, profile, profileBlob]);

  const handleProfileSave = useCallback(async () => {
    setError('');
    if (!accountSession) return;
    if (!profileHasRequiredFields(profile)) {
      setError('Display name is required.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const blobHex = await buildAccountProfileBlob(profile, accountSession);
      if (hasOnchainAccount && isSubscriptionActive && isAddress(PRIVATE_POKER_CONTRACT_ADDRESS)) {
        await syncProfileBlobToAccount(blobHex);
      }
      setProfileBlob(blobHex);
      setProfileMode('view');
      continueAfterProfile();
    } catch (err) {
      console.error('Account profile save failed:', err);
      setError(err?.message ?? 'Profile save failed.');
    } finally {
      setIsSavingProfile(false);
    }
  }, [accountSession, continueAfterProfile, hasOnchainAccount, isSubscriptionActive, profile, syncProfileBlobToAccount]);

  const getPlayerDisplayname = useCallback((playerAddress) => {
    const normalized = normalizeAddress(playerAddress);
    if (!normalized) return '';
    return playerDisplaynames[normalized] || '';
  }, [playerDisplaynames]);

  const approveOperatorPpdc = useCallback(async (session, amount) => {
    const allowance = await publicPokerClient.readContract({
      address: PPDC_CONTRACT_ADDRESS,
      abi: PPDC_ABI,
      functionName: 'allowance',
      args: [session.walletAddress, session.operator],
    });
    if (allowance >= amount) return;

    const args = [session.operator, amount];
    const overrides = await getBufferedGasOverrides(publicPokerClient, {
      address: PPDC_CONTRACT_ADDRESS,
      abi: PPDC_ABI,
      functionName: 'approve',
      args,
      account: session.walletAddress,
    });
    let hash;
    try {
      hash = await writeWalletContract({
        address: PPDC_CONTRACT_ADDRESS,
        abi: PPDC_ABI,
        functionName: 'approve',
        args,
        ...overrides,
      });
      await waitForLoggedTransactionReceipt({
        hash,
        functionName: 'approve',
        contract: PPDC_CONTRACT_ADDRESS,
        args,
      });
    } catch (error) {
      if (!hash) {
        logWriteTransactionError({
          functionName: 'approve',
          contract: PPDC_CONTRACT_ADDRESS,
          args,
          error,
        });
      }
      throw error;
    }
  }, [writeWalletContract]);

  const handleContinue = useCallback(async () => {
    setError('');

    try {
      if (!isAddress(PPDC_CONTRACT_ADDRESS)) {
        throw new Error(`${PPDC} contract address is not configured.`);
      }
      if (!isAddress(PRIVATE_POKER_CONTRACT_ADDRESS)) {
        throw new Error('PrivatePoker contract address is not configured.');
      }

      const session = accountSession ?? await signIn();
      if (!session) return;
      if (accountStatus !== ACCOUNT_STATUS.VERIFIED) {
        setStep('status');
        return;
      }
      if (!profileBlob) {
        setStep('profile');
        setError('Complete your profile before subscribing.');
        return;
      }
      if (!address || address.toLowerCase() !== session.walletAddress.toLowerCase()) {
        throw new Error('Connected wallet does not match the signed-in account.');
      }

      setIsSubscribing(true);
      const amount = tierPpdcAmount(selectedTier);
      const operator = createOperatorAddress(session.operatorPrivateKey);

      setSubscriptionStep(`Approve ${PPDC} for Operator...`);
      await approveOperatorPpdc(session, amount);

      setSubscriptionStep(`Operator transfers ${PPDC} into PrivatePoker...`);
      const transferArgs = [session.walletAddress, PRIVATE_POKER_CONTRACT_ADDRESS, amount];
      let transferHash;
      try {
        transferHash = await operator.writeContract({
          contract: PPDC_CONTRACT_ADDRESS,
          abi: PPDC_ABI,
          functionName: 'transferFrom',
          args: transferArgs,
        });
        await waitForLoggedTransactionReceipt({
          hash: transferHash,
          functionName: 'transferFrom',
          contract: PPDC_CONTRACT_ADDRESS,
          args: transferArgs,
        });
      } catch (error) {
        if (!transferHash) {
          logWriteTransactionError({
            functionName: 'transferFrom',
            contract: PPDC_CONTRACT_ADDRESS,
            args: transferArgs,
            error,
          });
        }
        throw error;
      }

      setSubscriptionStep('Operator creates account...');
      const subscribeArgs = [
        session.walletAddress,
        session.operator,
        session.operatorBlsPublicKey ?? '0x',
        profileBlob,
        tierToContractId(selectedTier),
      ];
      let subscribeHash;
      try {
        subscribeHash = await operator.writeContract({
          contract: PRIVATE_POKER_CONTRACT_ADDRESS,
          abi: ACCOUNT_ABI,
          functionName: 'subscribe',
          args: subscribeArgs,
        });
        await waitForLoggedTransactionReceipt({
          hash: subscribeHash,
          functionName: 'subscribe',
          contract: PRIVATE_POKER_CONTRACT_ADDRESS,
          args: subscribeArgs,
        });
      } catch (error) {
        if (!subscribeHash) {
          logWriteTransactionError({
            functionName: 'subscribe',
            contract: PRIVATE_POKER_CONTRACT_ADDRESS,
            args: subscribeArgs,
            error,
          });
        }
        throw error;
      }

      setHasOnchainAccount(true);
      setIsSubscriptionActive(true);
      router.push('/main-lobby');
    } catch (err) {
      console.error('Subscription failed:', err);
      setError(formatChainError(err, 'Subscription failed.'));
    } finally {
      setIsSubscribing(false);
      setSubscriptionStep('');
    }
  }, [
    accountSession,
    accountStatus,
    address,
    approveOperatorPpdc,
    createOperatorAddress,
    profileBlob,
    router,
    selectedTier,
    signIn,
  ]);

  return {
    accountSession,
    accountStatus,
    accountStatusChangedAt,
    accountStatusLabel: accountStatusLabel(accountStatus),
    error,
    handleProfileChange,
    handleProfileContinue,
    handleProfileEdit,
    handleProfileSave,
    handleContinue,
    handleSignin,
    getPlayerDisplayname,
    isCheckingAccount,
    isSavingProfile,
    isSigningIn,
    isSubscribing,
    isWalletConnected,
    profile,
    profileBlob,
    profileMode,
    selectedTier,
    setSelectedTier,
    signinData,
    signinFields,
    step,
    subscriptionStep,
    subscriptionTiers: SUBSCRIPTION_TIERS,
  };
}
