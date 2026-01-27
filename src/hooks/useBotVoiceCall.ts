import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CHAT_BOTS, ROOM_BOTS } from '@/lib/chatBots';
import { isLovableCloud } from '@/lib/environment';

interface BotVoiceCallState {
  status: 'idle' | 'connecting' | 'greeting' | 'listening' | 'responding' | 'ended';
  botResponse: string;
  userTranscript: string;
  responsesGiven: number;
}

interface UseBotVoiceCallProps {
  botId: string;
  botName: string;
  onBotMessage?: (message: string) => void;
}

// Get bot personality from ID
const getBotPersonality = (botId: string) => {
  const allBots = [...CHAT_BOTS, ...ROOM_BOTS];
  return allBots.find(b => b.id === botId);
};

export const useBotVoiceCall = ({ botId, botName, onBotMessage }: UseBotVoiceCallProps) => {
  const [state, setState] = useState<BotVoiceCallState>({
    status: 'idle',
    botResponse: '',
    userTranscript: '',
    responsesGiven: 0,
  });
  
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const maxResponsesRef = useRef(3);
  const conversationHistoryRef = useRef<string[]>([]);

  // Text-to-speech for bot responses
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.log('[BOT-VOICE] Speech synthesis not supported');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      // Try to get a natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Google') ||
        v.name.includes('Microsoft') ||
        v.lang.startsWith('en')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.error('[BOT-VOICE] Speech error:', e);
        resolve();
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Get AI response for user input
  const getBotResponse = useCallback(async (userInput: string): Promise<string> => {
    if (!isLovableCloud()) {
      // VPS fallback - simple responses
      const fallbackResponses = [
        "That's interesting, tell me more!",
        "I hear you. What else is on your mind?",
        "Cool! Anything else you wanna chat about?",
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    try {
      conversationHistoryRef.current.push(`User: ${userInput}`);
      
      const { data, error } = await supabase.functions.invoke('chat-bot', {
        body: {
          botId,
          context: 'voice-call',
          recentMessages: conversationHistoryRef.current.map((msg, i) => ({
            username: msg.startsWith('User:') ? 'User' : botName,
            content: msg.replace(/^(User|Bot): /, ''),
            timestamp: new Date(Date.now() - (conversationHistoryRef.current.length - i) * 1000).toISOString(),
          })),
          respondTo: userInput,
          isPM: true,
          isVoiceCall: true,
        },
      });

      if (error) throw error;
      
      const response = data?.message || "Sorry, I didn't catch that. Can you say it again?";
      conversationHistoryRef.current.push(`Bot: ${response}`);
      return response;
    } catch (err) {
      console.error('[BOT-VOICE] AI response error:', err);
      return "Hmm, having trouble thinking right now. Try again?";
    }
  }, [botId, botName]);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        variant: 'destructive',
        title: 'Speech not supported',
        description: 'Your browser does not support speech recognition.',
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[BOT-VOICE] Listening started');
      setState(prev => ({ ...prev, status: 'listening', userTranscript: '' }));
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setState(prev => ({ ...prev, userTranscript: transcript }));
    };

    recognition.onend = async () => {
      console.log('[BOT-VOICE] Listening ended');
      const transcript = (recognitionRef.current as any)?._lastTranscript || '';
      
      if (transcript.trim()) {
        setState(prev => ({ ...prev, status: 'responding' }));
        
        const response = await getBotResponse(transcript);
        setState(prev => ({ 
          ...prev, 
          botResponse: response,
          responsesGiven: prev.responsesGiven + 1,
        }));
        
        onBotMessage?.(response);
        
        await speak(response);
        
        // Check if we should continue or end
        setState(prev => {
          if (prev.responsesGiven >= maxResponsesRef.current) {
            return { ...prev, status: 'ended' };
          }
          return { ...prev, status: 'listening' };
        });
        
        // Continue listening if not done
        if (state.responsesGiven < maxResponsesRef.current - 1) {
          setTimeout(() => {
            if (recognitionRef.current && state.status !== 'ended') {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('[BOT-VOICE] Recognition restart failed:', e);
              }
            }
          }, 500);
        }
      } else {
        // No speech detected, try again
        setTimeout(() => {
          if (recognitionRef.current && state.status === 'listening') {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('[BOT-VOICE] Recognition restart failed:', e);
            }
          }
        }, 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[BOT-VOICE] Recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Retry listening
        setTimeout(() => {
          if (recognitionRef.current && state.status === 'listening') {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('[BOT-VOICE] Recognition restart failed:', e);
            }
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [getBotResponse, onBotMessage, speak, state.responsesGiven, state.status, toast]);

  // Start the bot voice call
  const startCall = useCallback(async () => {
    console.log('[BOT-VOICE] Starting call with bot:', botId, botName);
    
    conversationHistoryRef.current = [];
    
    setState({
      status: 'connecting',
      botResponse: '',
      userTranscript: '',
      responsesGiven: 0,
    });

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      
      // Bot greeting
      setState(prev => ({ ...prev, status: 'greeting' }));
      
      const greeting = `Hey! What's up?`;
      setState(prev => ({ ...prev, botResponse: greeting }));
      onBotMessage?.(greeting);
      
      await speak(greeting);
      
      // Start listening for user input
      startListening();
      
    } catch (err) {
      console.error('[BOT-VOICE] Failed to start call:', err);
      toast({
        variant: 'destructive',
        title: 'Call failed',
        description: 'Could not access microphone. Please allow microphone access.',
      });
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  }, [botId, botName, onBotMessage, speak, startListening, toast]);

  // End the call
  const endCall = useCallback(() => {
    console.log('[BOT-VOICE] Ending call');
    
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    
    // Stop speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setState({
      status: 'idle',
      botResponse: '',
      userTranscript: '',
      responsesGiven: 0,
    });
    
    conversationHistoryRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    ...state,
    startCall,
    endCall,
    isActive: state.status !== 'idle' && state.status !== 'ended',
  };
};
