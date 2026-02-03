/**
 * ╔═ JustAChat™ ══════════════════════ Since 2026 ═══ © Unix ═╗
 * ╚═ Proprietary software. All rights reserved. ══════════════╝
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TriviaQuestion, getRandomQuestion, checkAnswer } from '@/lib/triviaQuestions';

interface TriviaScore {
  user_id: string;
  points: number;
  correct_answers: number;
  total_answers: number;
  username?: string;
}

interface TriviaGameState {
  isActive: boolean;
  currentQuestion: TriviaQuestion | null;
  questionStartTime: number | null;
  questionNumber: number;
  askedQuestionIds: Set<number>;
}

export const useTriviaGame = (
  userId: string | undefined,
  username: string,
  channelName: string | undefined,
  addModeratorMessage: (content: string, channelName: string) => void,
  addSystemMessage: (content: string) => void
) => {
  const [gameState, setGameState] = useState<TriviaGameState>({
    isActive: false,
    currentQuestion: null,
    questionStartTime: null,
    questionNumber: 0,
    askedQuestionIds: new Set(),
  });
  
  const [leaderboard, setLeaderboard] = useState<TriviaScore[]>([]);
  const questionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoQuestionRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're in the trivia channel
  const isTriviaChannel = channelName?.toLowerCase() === 'trivia';

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    const { data: scores } = await supabase
      .from('trivia_scores')
      .select('*')
      .order('points', { ascending: false })
      .limit(10);

    if (scores && scores.length > 0) {
      // Fetch usernames for the scores
      const userIds = scores.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      
      setLeaderboard(scores.map(s => ({
        ...s,
        username: profileMap.get(s.user_id) || 'Unknown'
      })));
    }
  }, []);

  // Subscribe to realtime updates for leaderboard
  useEffect(() => {
    if (!isTriviaChannel) return;

    fetchLeaderboard();

    const channel = supabase
      .channel('trivia-scores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trivia_scores' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isTriviaChannel, fetchLeaderboard]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
      if (autoQuestionRef.current) clearTimeout(autoQuestionRef.current);
    };
  }, []);

  // Ask a new trivia question
  const askQuestion = useCallback(() => {
    if (!isTriviaChannel || !channelName) return;

    const question = getRandomQuestion();
    
    setGameState(prev => ({
      ...prev,
      isActive: true,
      currentQuestion: question,
      questionStartTime: Date.now(),
      questionNumber: prev.questionNumber + 1,
    }));

    const difficultyEmoji = question.difficulty === 'easy' ? '🟢' : question.difficulty === 'medium' ? '🟡' : '🔴';
    
    addModeratorMessage(
      `🎯 **TRIVIA TIME!** ${difficultyEmoji}\n\n**Question #${gameState.questionNumber + 1}:** ${question.question}\n\n📝 Type your answer in chat! (${question.points} points • ${question.category})`,
      channelName
    );

    // Set timeout for question (30 seconds)
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    questionTimeoutRef.current = setTimeout(() => {
      if (gameState.currentQuestion) {
        addModeratorMessage(
          `⏰ **Time's up!** The correct answer was: **${question.answer}**\n\nNext question coming soon...`,
          channelName
        );
        setGameState(prev => ({ ...prev, currentQuestion: null, questionStartTime: null }));
        
        // Auto-ask next question after 10 seconds
        autoQuestionRef.current = setTimeout(() => {
          askQuestion();
        }, 10000);
      }
    }, 30000);
  }, [isTriviaChannel, channelName, addModeratorMessage, gameState.questionNumber]);

  // Check if a message is a correct answer
  const checkTriviaAnswer = useCallback(async (message: string, answererUsername: string) => {
    if (!gameState.currentQuestion || !userId || !channelName) return false;

    const isCorrect = checkAnswer(gameState.currentQuestion, message);
    
    if (isCorrect) {
      const points = gameState.currentQuestion.points;
      const timeTaken = Math.round((Date.now() - (gameState.questionStartTime || Date.now())) / 1000);
      
      // Clear the timeout
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
      
      // Update or insert score
      const { data: existingScore } = await supabase
        .from('trivia_scores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingScore) {
        await supabase
          .from('trivia_scores')
          .update({
            points: existingScore.points + points,
            correct_answers: existingScore.correct_answers + 1,
            total_answers: existingScore.total_answers + 1,
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('trivia_scores')
          .insert({
            user_id: userId,
            points: points,
            correct_answers: 1,
            total_answers: 1,
          });
      }

      addModeratorMessage(
        `🎉 **${answererUsername}** got it right in ${timeTaken}s!\n\n✅ Answer: **${gameState.currentQuestion.answer}**\n🏆 +${points} points!\n\nNext question in 10 seconds...`,
        channelName
      );

      setGameState(prev => ({ ...prev, currentQuestion: null, questionStartTime: null }));
      
      // Auto-ask next question
      autoQuestionRef.current = setTimeout(() => {
        askQuestion();
      }, 10000);

      return true;
    }

    return false;
  }, [gameState.currentQuestion, gameState.questionStartTime, userId, channelName, addModeratorMessage, askQuestion]);

  // Start a new trivia game
  const startTrivia = useCallback(() => {
    if (!isTriviaChannel || !channelName) {
      addSystemMessage('Trivia is only available in the #trivia channel!');
      return;
    }

    addModeratorMessage(
      `🎮 **Welcome to JAC Trivia!**\n\n📋 **How to play:**\n• Answer questions by typing in chat\n• Faster answers = same points, but bragging rights!\n• Use /score to see your points\n• Use /leaderboard to see top players\n\n🚀 First question coming up...`,
      channelName
    );

    setTimeout(() => {
      askQuestion();
    }, 3000);
  }, [isTriviaChannel, channelName, addModeratorMessage, addSystemMessage, askQuestion]);

  // Skip to next question
  const skipQuestion = useCallback(() => {
    if (!gameState.currentQuestion || !channelName) return;
    
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    
    addModeratorMessage(
      `⏭️ **Skipped!** The answer was: **${gameState.currentQuestion.answer}**`,
      channelName
    );
    
    setGameState(prev => ({ ...prev, currentQuestion: null, questionStartTime: null }));
    
    setTimeout(() => {
      askQuestion();
    }, 3000);
  }, [gameState.currentQuestion, channelName, addModeratorMessage, askQuestion]);

  // Get user's score
  const getUserScore = useCallback(async (): Promise<TriviaScore | null> => {
    if (!userId) return null;
    
    const { data } = await supabase
      .from('trivia_scores')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  }, [userId]);

  // Show score command
  const showScore = useCallback(async () => {
    const score = await getUserScore();
    
    if (score) {
      const accuracy = score.total_answers > 0 
        ? Math.round((score.correct_answers / score.total_answers) * 100) 
        : 0;
      
      addSystemMessage(
        `📊 **Your Trivia Stats:**\n🏆 Points: **${score.points}**\n✅ Correct: ${score.correct_answers}\n📝 Total: ${score.total_answers}\n🎯 Accuracy: ${accuracy}%`
      );
    } else {
      addSystemMessage('You haven\'t played any trivia yet! Type /trivia to start.');
    }
  }, [getUserScore, addSystemMessage]);

  // Show leaderboard command
  const showLeaderboard = useCallback(() => {
    if (leaderboard.length === 0) {
      addSystemMessage('No trivia scores yet! Be the first to play with /trivia');
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const leaderboardText = leaderboard
      .slice(0, 10)
      .map((score, index) => {
        const medal = medals[index] || `${index + 1}.`;
        return `${medal} **${score.username}** - ${score.points} pts (${score.correct_answers} correct)`;
      })
      .join('\n');

    addSystemMessage(`🏆 **Trivia Leaderboard:**\n\n${leaderboardText}`);
  }, [leaderboard, addSystemMessage]);

  return {
    gameState,
    leaderboard,
    isTriviaChannel,
    startTrivia,
    skipQuestion,
    showScore,
    showLeaderboard,
    checkTriviaAnswer,
    askQuestion,
  };
};
