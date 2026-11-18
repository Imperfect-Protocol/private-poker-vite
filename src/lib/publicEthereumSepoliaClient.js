import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Ethereum Sepolia (L1) is only used to tell the onboarding flow whether the
 * player still has test ETH to bridge. It is never used for gameplay.
 */
export const ETHEREUM_SEPOLIA_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

export const ethereumSepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(ETHEREUM_SEPOLIA_RPC_URL),
});
