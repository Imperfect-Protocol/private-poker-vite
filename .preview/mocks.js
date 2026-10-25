// Temporary design-preview mocks. Delete with the .preview folder.
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

export const ACCOUNT_STATUS = { NONE: 0n, UNVERIFIED: 1n, VERIFIED: 2n, SUSPENDED: 4n, BANNED: 8n, DELETED: 16n };

const step = new URLSearchParams(window.location.search).get('step') ?? 'signin';
const noop = () => {};

export function useAccounts() {
  return {
    step,
    accountSession: { walletAddress: '0x85c4a1b2c3d4e5f60718293a4b5c6d7e8f90aAdc', operator: '0x32b1a1b2c3d4e5f60718293a4b5c6d7e8f90fE92' },
    accountStatus: ACCOUNT_STATUS.UNVERIFIED,
    error: null,
    isCheckingAccount: false,
    isSavingProfile: false,
    isSigningIn: false,
    isSubscribing: false,
    isSubscriptionActive: false,
    isWalletConnected: step !== 'signin',
    operationDialog: null,
    profile: { displayName: 'Cipher' },
    profileMode: 'view',
    selectedTier: SUBSCRIPTION_TIERS[1],
    subscriptionTiers: SUBSCRIPTION_TIERS,
    subscriptionStep: '',
    signinData: { domain: { name: 'PrivatePoker', version: '1' }, primaryType: 'PrivatePokerAccountSession' },
    signinFields: [
      { field: 'app', value: 'PrivatePoker' },
      { field: 'purpose', value: 'Create deterministic PrivatePoker session keys' },
      { field: 'operatorRealm', value: 'Lobby and table blockchain operations' },
      { field: 'blsRealm', value: 'Per-table peer-to-peer poker sessions' },
      { field: 'network', value: 'Arbitrum Sepolia' },
      { field: 'version', value: '1' },
    ],
    handleSignin: noop, handleProfileChange: noop, handleProfileContinue: noop, handleProfileEdit: noop,
    handleProfileSave: noop, handleContinue: noop, handleOperationDialogOk: noop, setSelectedTier: noop,
  };
}
