import { useCallback } from 'react';
import { useConnection, useWriteContract } from 'wagmi';
import { VERIFY_SHUFFLE_CONTRACT_ADDRESS } from '@/lib/chain';
import { getBufferedGasOverrides } from '@/lib/gas';
import { publicPokerClient } from '@/lib/publicPokerClient';
import {
  VERIFY_SHUFFLE_ABI,
  buildShuffleVerificationArgs,
} from '@/lib/verification';
import { useOperatorAddress } from '@/hooks/useOperatorAddress';

export function useVerifyShuffle({ onOperatorTopUp } = {}) {
  const { address } = useConnection();
  const { mutateAsync } = useWriteContract();
  const { writeContractFromOperator } = useOperatorAddress({ onOperatorTopUp });

  const writeContract = useCallback(async ({
    contract = VERIFY_SHUFFLE_CONTRACT_ADDRESS,
    abi,
    functionName,
    args,
    operatorPrivateKey,
  }) => {
    if (operatorPrivateKey) {
      return writeContractFromOperator({
        operatorPrivateKey,
        contract,
        abi,
        functionName,
        args,
      });
    }

    const overrides = address
      ? await getBufferedGasOverrides(publicPokerClient, {
        address: contract,
        abi,
        functionName,
        args,
        account: address,
      })
      : {};

    return mutateAsync({
      address: contract,
      abi,
      functionName,
      args,
      ...overrides,
    });
  }, [address, mutateAsync, writeContractFromOperator]);

  const verifyShuffle = useCallback(async ({
    hand,
    player,
    publicKey,
    traces,
    shuffleTracesByPlayer,
    operatorPrivateKey,
  }) => {
    const args = buildShuffleVerificationArgs({
      hand,
      player,
      publicKey,
      traces,
      shuffleTracesByPlayer,
    });
    return writeContract({
      contract: VERIFY_SHUFFLE_CONTRACT_ADDRESS,
      abi: VERIFY_SHUFFLE_ABI,
      functionName: 'verifyShuffle',
      args: [
        args.maskedBefore,
        args.maskedAfter,
        args.publicKey,
        args.traces,
      ],
      operatorPrivateKey,
    });
  }, [writeContract]);

  return {
    verifyShuffle,
  };
}
