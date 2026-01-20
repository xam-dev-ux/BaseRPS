import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useChainId } from 'wagmi';
import { zeroHash } from 'viem';
import { getContractAddress } from '../addresses';
import BaseRPSAbi from '../abi/BaseRPS.json';
import type { Choice, GameMode } from '@/config/constants';

export function useBaseRPSContract() {
  const chainId = useChainId();
  const address = getContractAddress(chainId);

  return {
    address,
    abi: BaseRPSAbi,
  };
}

// Read hooks
export function useMinBet() {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'minBet',
  });
}

export function useMaxBet() {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'maxBet',
  });
}

export function useCommissionRate() {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'commissionRate',
  });
}

export function useMatchCounter() {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'matchCounter',
  });
}

export function useMatch(matchId: bigint | undefined) {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'getMatch',
    args: matchId ? [matchId] : undefined,
    query: {
      enabled: !!matchId,
    },
  });
}

export function useRoundState(matchId: bigint | undefined, round: number) {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'getRoundState',
    args: matchId ? [matchId, round] : undefined,
    query: {
      enabled: !!matchId && round > 0,
    },
  });
}

export function usePlayerStats(playerAddress: `0x${string}` | undefined) {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'getPlayerStats',
    args: playerAddress ? [playerAddress] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });
}

export function useActiveMatches(playerAddress: `0x${string}` | undefined) {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'getActiveMatches',
    args: playerAddress ? [playerAddress] : undefined,
    query: {
      enabled: !!playerAddress,
    },
  });
}

export function useOpenMatches(offset: bigint, limit: bigint) {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'getOpenMatches',
    args: [offset, limit],
  });
}

export function useOpenMatchCount() {
  const { address, abi } = useBaseRPSContract();
  return useReadContract({
    address,
    abi,
    functionName: 'getOpenMatchCount',
  });
}

// Write hooks
export function useCreateMatch() {
  const { address, abi } = useBaseRPSContract();
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createMatch = async (
    betAmount: bigint,
    gameMode: GameMode,
    isPrivate: boolean = false,
    privateCodeHash: `0x${string}` = zeroHash
  ): Promise<bigint | undefined> => {
    try {
      await writeContractAsync({
        address,
        abi,
        functionName: 'createMatch',
        args: [gameMode, isPrivate, privateCodeHash],
        value: betAmount,
      });
      // Note: Match ID would need to be extracted from transaction receipt logs
      // For now, we return undefined and rely on the isSuccess state
      return undefined;
    } catch (err) {
      console.error('Create match failed:', err);
      throw err;
    }
  };

  return {
    createMatch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useJoinMatch() {
  const { address, abi } = useBaseRPSContract();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const joinMatch = async (matchId: bigint, betAmount: bigint) => {
    writeContract({
      address,
      abi,
      functionName: 'joinMatch',
      args: [matchId],
      value: betAmount,
    });
  };

  return {
    joinMatch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useJoinPrivateMatch() {
  const { address, abi } = useBaseRPSContract();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const joinPrivateMatch = async (
    matchId: bigint,
    privateCode: string,
    betAmount: bigint
  ) => {
    writeContract({
      address,
      abi,
      functionName: 'joinPrivateMatch',
      args: [matchId, privateCode],
      value: betAmount,
    });
  };

  return {
    joinPrivateMatch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCancelMatch() {
  const { address, abi } = useBaseRPSContract();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelMatch = async (matchId: bigint) => {
    writeContract({
      address,
      abi,
      functionName: 'cancelMatch',
      args: [matchId],
    });
  };

  return {
    cancelMatch,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCommitChoice() {
  const { address, abi } = useBaseRPSContract();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const commitChoice = async (matchId: bigint, commitHash: `0x${string}`) => {
    writeContract({
      address,
      abi,
      functionName: 'commitChoice',
      args: [matchId, commitHash],
    });
  };

  return {
    commitChoice,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useRevealChoice() {
  const { address, abi } = useBaseRPSContract();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revealChoice = async (
    matchId: bigint,
    choice: Choice,
    salt: `0x${string}`
  ) => {
    writeContract({
      address,
      abi,
      functionName: 'revealChoice',
      args: [matchId, choice, salt],
    });
  };

  return {
    revealChoice,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimTimeout() {
  const { address, abi } = useBaseRPSContract();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimTimeout = async (matchId: bigint) => {
    writeContract({
      address,
      abi,
      functionName: 'claimTimeout',
      args: [matchId],
    });
  };

  return {
    claimTimeout,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
