import { useCallback } from 'react';
import { useConnection, useWriteContract } from 'wagmi';
import { PRIVATE_POKER_CONTRACT_ADDRESS, VERIFY_SHUFFLE_CONTRACT_ADDRESS } from '@/lib/chain';
import { getBufferedGasOverrides } from '@/lib/gas';
import { publicPokerClient } from '@/lib/publicPokerClient';
import {
  HAND_VERIFICATION_ABI,
  VERIFY_SHUFFLE_ABI,
  buildShuffleVerificationArgs,
  buildSubmitPublicKeyVerificationArgs,
} from '@/lib/verification';
import { useOperatorAddress } from '@/hooks/useOperatorAddress';

export function useVerifyShuffle({ onOperatorTopUp } = {}) {
  const { address } = useConnection();
  const { mutateAsync } = useWriteContract();
  const { writeContractFromOperator } = useOperatorAddress({ onOperatorTopUp });

  const writeContract = useCallback(async ({
    contract = PRIVATE_POKER_CONTRACT_ADDRESS,
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

  const submitPublicKeyVerification = useCallback(async ({
    lobbyId,
    tableId,
    handId,
    hand,
    player,
    publicKey,
    traces,
    operatorPrivateKey,
  }) => {
    const args = buildSubmitPublicKeyVerificationArgs({
      lobbyId,
      tableId,
      handId,
      hand,
      player,
      publicKey,
      traces,
    });

    return writeContract({
      abi: HAND_VERIFICATION_ABI,
      functionName: 'submitPublicKey',
      args,
      operatorPrivateKey,
    });
  }, [writeContract]);

  const verifyShuffle = useCallback(async ({
    hand,
    player,
    publicKey,
    traces,
    operatorPrivateKey,
  }) => {
    const args = buildShuffleVerificationArgs({ hand, player, publicKey, traces });
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
    submitPublicKeyVerification,
    verifyShuffle,
  };
}
