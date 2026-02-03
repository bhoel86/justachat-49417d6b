/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useCallback, useRef } from 'react';

interface SkipVote {
  isActive: boolean;
  voters: Set<string>; // user IDs who voted
  requiredVotes: number;
  initiatorId: string | null;
  expiresAt: number | null;
}

interface UseSkipVoteProps {
  onSkip: () => void;
  addBotMessage: (content: string, username: string, avatarUrl?: string) => void;
}

const VOTE_TIMEOUT_MS = 30000; // 30 seconds to vote
const REQUIRED_VOTES = 2;
const DJ_BOT_NAME = 'DJ Radio';
const DJ_BOT_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=djradio&backgroundColor=7c3aed';

export const useSkipVote = ({ onSkip, addBotMessage }: UseSkipVoteProps) => {
  const [vote, setVote] = useState<SkipVote>({
    isActive: false,
    voters: new Set(),
    requiredVotes: REQUIRED_VOTES,
    initiatorId: null,
    expiresAt: null,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const endVote = useCallback((reason: 'passed' | 'failed' | 'timeout') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setVote({
      isActive: false,
      voters: new Set(),
      requiredVotes: REQUIRED_VOTES,
      initiatorId: null,
      expiresAt: null,
    });
    
    if (reason === 'passed') {
      addBotMessage('🎉 vote passed! skipping song...', DJ_BOT_NAME, DJ_BOT_AVATAR);
      onSkip();
    } else if (reason === 'failed' || reason === 'timeout') {
      addBotMessage('❌ vote failed - not enough votes to skip', DJ_BOT_NAME, DJ_BOT_AVATAR);
    }
  }, [onSkip, addBotMessage]);

  const initiateVote = useCallback((initiatorId: string, initiatorUsername: string) => {
    if (vote.isActive) {
      return { success: false, message: 'a skip vote is already in progress! type "yes" to vote' };
    }
    
    // Start the vote with the initiator as first voter
    const newVoters = new Set<string>();
    newVoters.add(initiatorId);
    
    setVote({
      isActive: true,
      voters: newVoters,
      requiredVotes: REQUIRED_VOTES,
      initiatorId,
      expiresAt: Date.now() + VOTE_TIMEOUT_MS,
    });
    
    // Set timeout
    timeoutRef.current = setTimeout(() => {
      endVote('timeout');
    }, VOTE_TIMEOUT_MS);
    
    addBotMessage(
      `📻 ${initiatorUsername} wants to skip this song! type "yes" to vote (${1}/${REQUIRED_VOTES} votes, 30s to vote)`,
      DJ_BOT_NAME,
      DJ_BOT_AVATAR
    );
    
    return { success: true, message: 'skip vote started' };
  }, [vote.isActive, addBotMessage, endVote]);

  const castVote = useCallback((userId: string, username: string, messageContent: string): boolean => {
    // Check if vote is active and message is "yes"
    if (!vote.isActive) return false;
    
    const lowerContent = messageContent.toLowerCase().trim();
    if (lowerContent !== 'yes' && lowerContent !== 'y') return false;
    
    // Check if user already voted
    if (vote.voters.has(userId)) {
      addBotMessage(`${username} already voted!`, DJ_BOT_NAME, DJ_BOT_AVATAR);
      return true; // Message was handled
    }
    
    // Add vote
    const newVoters = new Set(vote.voters);
    newVoters.add(userId);
    const voteCount = newVoters.size;
    
    setVote(prev => ({
      ...prev,
      voters: newVoters,
    }));
    
    // Check if we have enough votes
    if (voteCount >= REQUIRED_VOTES) {
      endVote('passed');
    } else {
      addBotMessage(
        `✅ ${username} voted yes! (${voteCount}/${REQUIRED_VOTES} votes)`,
        DJ_BOT_NAME,
        DJ_BOT_AVATAR
      );
    }
    
    return true; // Message was handled
  }, [vote, addBotMessage, endVote]);

  const cancelVote = useCallback(() => {
    if (vote.isActive) {
      endVote('failed');
    }
  }, [vote.isActive, endVote]);

  return {
    isVoteActive: vote.isActive,
    voteCount: vote.voters.size,
    requiredVotes: vote.requiredVotes,
    initiateVote,
    castVote,
    cancelVote,
  };
};
