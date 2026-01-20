import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useCommitChoice, useRevealChoice } from '@/contracts/hooks/useBaseRPS';
import { useMatchSalts } from '@/store/useSaltStore';
import { useGameStore } from '@/store/useGameStore';
import { generateSalt } from '@/lib/crypto';
import { generateCommitHash } from '@/lib/hash';
import { log } from '@/lib/serverLog';
import type { Choice } from '@/config/constants';
import toast from 'react-hot-toast';

interface UseCommitRevealProps {
  matchId: bigint;
  currentRound: number;
}

export function useCommitReveal({ matchId, currentRound }: UseCommitRevealProps) {
  const { address } = useAccount();
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const { commitChoice, isPending: commitPending, isConfirming: commitConfirming } = useCommitChoice();
  const { revealChoice, isPending: revealPending, isConfirming: revealConfirming } = useRevealChoice();
  const { addSalt, getSalt, removeSalt } = useMatchSalts(matchId);
  const { setMyChoice, updatePhase } = useGameStore();

  const commit = useCallback(
    async (choice: Choice) => {
      const logData = { matchId: matchId.toString(), currentRound, choice, wallet: address };
      log.info('Commit started', logData);

      if (isCommitting) {
        log.warn('Commit skipped - already committing', logData);
        return;
      }

      try {
        setIsCommitting(true);

        // Generate salt BEFORE transaction
        const salt = generateSalt();
        const hash = generateCommitHash(choice, salt);
        log.info('Commit hash generated', { ...logData, hash });

        // Store salt first (critical for reveal)
        addSalt(currentRound, choice, salt, hash);
        setMyChoice(choice);
        log.info('Salt stored, sending transaction', logData);

        // Send commit transaction
        await commitChoice(matchId, hash);

        log.info('Commit transaction sent successfully', logData);
        toast.success('Choice committed! Waiting for opponent...');
        updatePhase('waiting-commit');
      } catch (error) {
        log.error('Commit failed', { ...logData, error: String(error) });
        // Remove stored salt on failure
        removeSalt(currentRound);
        toast.error('Failed to commit choice');
        throw error;
      } finally {
        setIsCommitting(false);
      }
    },
    [matchId, currentRound, isCommitting, addSalt, commitChoice, setMyChoice, updatePhase, removeSalt, address]
  );

  const reveal = useCallback(async () => {
    const logData = { matchId: matchId.toString(), currentRound, wallet: address };
    log.info('Reveal started', logData);

    if (isRevealing) {
      log.warn('Reveal skipped - already revealing', logData);
      return;
    }

    try {
      setIsRevealing(true);

      // Get stored salt and choice
      const saltEntry = getSalt(currentRound);
      log.info('Salt entry retrieved', { ...logData, hasSalt: !!saltEntry, choice: saltEntry?.choice });

      if (!saltEntry) {
        log.error('Salt not found!', logData);
        throw new Error('Salt not found! Cannot reveal without the original salt.');
      }

      log.info('Sending reveal transaction', { ...logData, choice: saltEntry.choice });

      // Send reveal transaction
      await revealChoice(matchId, saltEntry.choice, saltEntry.salt);

      log.info('Reveal transaction sent successfully', logData);
      toast.success('Choice revealed! Waiting for result...');
      updatePhase('waiting-reveal');

      // Remove salt after successful reveal
      removeSalt(currentRound);
    } catch (error) {
      log.error('Reveal failed', { ...logData, error: String(error) });
      toast.error('Failed to reveal choice');
      throw error;
    } finally {
      setIsRevealing(false);
    }
  }, [matchId, currentRound, isRevealing, getSalt, revealChoice, updatePhase, removeSalt, address]);

  const canReveal = useCallback(() => {
    const saltEntry = getSalt(currentRound);
    return !!saltEntry;
  }, [getSalt, currentRound]);

  const getStoredChoice = useCallback(() => {
    const saltEntry = getSalt(currentRound);
    return saltEntry?.choice ?? null;
  }, [getSalt, currentRound]);

  return {
    commit,
    reveal,
    canReveal,
    getStoredChoice,
    isCommitting: isCommitting || commitPending || commitConfirming,
    isRevealing: isRevealing || revealPending || revealConfirming,
  };
}
