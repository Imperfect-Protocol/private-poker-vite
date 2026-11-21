import { useEffect, useState } from 'react';
import { isAddress, parseAbi } from 'viem';
import { useConnection } from 'wagmi';
import { PPDC_CONTRACT_ADDRESS } from '@/lib/chain';
import { publicPokerClient } from '@/lib/publicPokerClient';
import { ethereumSepoliaClient } from '@/lib/publicEthereumSepoliaClient';

const PPDC_BALANCE_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

const EMPTY_BALANCES = {
  address: null,
  pddc: null,
  arbitrum: null,
  ethereum: null,
};

const settledValue = (result) => (result.status === 'fulfilled' ? result.value : null);

/**
 * Reads the three balances the setup steps care about: PPDC and native ETH on
 * Arbitrum Sepolia, plus native ETH on Ethereum Sepolia for bridging. Reads run
 * when the page loads, when the wallet changes, and when the window regains
 * focus (for example after returning from a bridge).
 */
export function useOnboardingBalances() {
  const { address } = useConnection();
  const [balances, setBalances] = useState(EMPTY_BALANCES);

  useEffect(() => {
    if (!address) return undefined;

    let cancelled = false;

    const load = async () => {
      const [pddc, arbitrum, ethereum] = await Promise.allSettled([
        isAddress(PPDC_CONTRACT_ADDRESS)
          ? publicPokerClient.readContract({
            address: PPDC_CONTRACT_ADDRESS,
            abi: PPDC_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [address],
          })
          : null,
        publicPokerClient.getBalance({ address }),
        ethereumSepoliaClient.getBalance({ address }),
      ]);

      if (cancelled) return;

      setBalances({
        address,
        pddc: settledValue(pddc),
        arbitrum: settledValue(arbitrum),
        ethereum: settledValue(ethereum),
      });
    };

    load();
    window.addEventListener('focus', load);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', load);
    };
  }, [address]);

  if (!address) {
    return { ...EMPTY_BALANCES, isChecking: false };
  }

  const isChecking = balances.address !== address;

  return {
    address,
    pddc: isChecking ? null : balances.pddc,
    arbitrum: isChecking ? null : balances.arbitrum,
    ethereum: isChecking ? null : balances.ethereum,
    isChecking,
  };
}
