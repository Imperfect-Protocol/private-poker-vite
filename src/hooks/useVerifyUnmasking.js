import { useCallback } from 'react';
import { useConnection, useWriteContract } from 'wagmi';
import { VERIFY_UNMASKING_CONTRACT_ADDRESS } from '@/lib/chain';
import { getBufferedGasOverrides } from '@/lib/gas';
import { publicPokerClient } from '@/lib/publicPokerClient';
import {
  VERIFY_UNMASKING_ABI,
  buildUnmaskingVerificationArgs,
} from '@/lib/verification';
import { useOperatorAddress } from '@/hooks/useOperatorAddress';

export function useVerifyUnmasking({ onOperatorTopUp } = {}) {
  const { address } = useConnection();
  const { mutateAsync } = useWriteContract();
  const { writeContractFromOperator } = useOperatorAddress({ onOperatorTopUp });

  const verifyUnmasking = useCallback(async ({ hand, operatorPrivateKey }) => {
    const args = buildUnmaskingVerificationArgs({ hand });
    const contractArgs = [
      args.numPlayers,
      args.playerKeys,
      args.shuffleHistory,
      args.unmaskingSequenceCards,
      args.unmaskingActors,
      args.unmaskingStates,
    ];

    if (operatorPrivateKey) {
      return writeContractFromOperator({
        operatorPrivateKey,
        contract: VERIFY_UNMASKING_CONTRACT_ADDRESS,
        abi: VERIFY_UNMASKING_ABI,
        functionName: 'verifyUnmasking',
        args: contractArgs,
      });
    }

    const overrides = address
      ? await getBufferedGasOverrides(publicPokerClient, {
        address: VERIFY_UNMASKING_CONTRACT_ADDRESS,
        abi: VERIFY_UNMASKING_ABI,
        functionName: 'verifyUnmasking',
        args: contractArgs,
        account: address,
      })
      : {};

    return mutateAsync({
      address: VERIFY_UNMASKING_CONTRACT_ADDRESS,
      abi: VERIFY_UNMASKING_ABI,
      functionName: 'verifyUnmasking',
      args: contractArgs,
      ...overrides,
    });
  }, [address, mutateAsync, writeContractFromOperator]);

  return { verifyUnmasking };
}
