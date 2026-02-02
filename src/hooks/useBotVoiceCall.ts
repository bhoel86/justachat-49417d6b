import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CHAT_BOTS, ROOM_BOTS } from '@/lib/chatBots';
import { getChatBotFunctionName, isLovableCloud } from '@/lib/environment';

interface BotVoiceCallState {
  status: 'idle' | 'connecting' | 'greeting' | 'listening' | 'responding' | 'ended';
  botResponse: string;
  userTranscript: string;
  responsesGiven: number;
  userAudioLevel: number;
  botAudioLevel: number;
  speechSupported: boolean;
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
    userAudioLevel: 0,
    botAudioLevel: 0,
    speechSupported: ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window),
  });
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);
  const botSpeakingRef = useRef(false);
  
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const maxResponsesRef = useRef(3);
  const conversationHistoryRef = useRef<string[]>([]);
  const lastTranscriptRef = useRef<string>('');
  const responsesGivenRef = useRef(0);

  // Simulate bot audio level when speaking
  const startBotAudioSimulation = useCallback(() => {
    botSpeakingRef.current = true;
    const simulateBotAudio = () => {
      if (!botSpeakingRef.current) return;
      // Simulate varying audio levels
      const level = 0.3 + Math.random() * 0.5;
      setState(prev => ({ ...prev, botAudioLevel: level }));
      requestAnimationFrame(simulateBotAudio);
    };
    simulateBotAudio();
  }, []);

  const stopBotAudioSimulation = useCallback(() => {
    botSpeakingRef.current = false;
    setState(prev => ({ ...prev, botAudioLevel: 0 }));
  }, []);

  // Text-to-speech for bot responses
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
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

      utterance.onstart = () => startBotAudioSimulation();
      utterance.onend = () => {
        stopBotAudioSimulation();
        resolve();
      };
      utterance.onerror = (e) => {
        console.error('[BOT-VOICE] Speech error:', e);
        stopBotAudioSimulation();
        resolve();
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [startBotAudioSimulation, stopBotAudioSimulation]);

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
      
      const { data, error } = await supabase.functions.invoke(getChatBotFunctionName(), {
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
      // Speech not supported - switch to text input mode
      console.log('[BOT-VOICE] Speech recognition not supported, using text input mode');
      setState(prev => ({ ...prev, status: 'listening', speechSupported: false }));
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
      lastTranscriptRef.current = transcript;
      setState(prev => ({ ...prev, userTranscript: transcript }));
    };

    recognition.onend = async () => {
      console.log('[BOT-VOICE] Listening ended, transcript:', lastTranscriptRef.current);
      const transcript = lastTranscriptRef.current;
      
      if (transcript.trim()) {
        setState(prev => ({ ...prev, status: 'responding' }));
        
        const response = await getBotResponse(transcript);
        responsesGivenRef.current += 1;
        
        setState(prev => ({ 
          ...prev, 
          botResponse: response,
          responsesGiven: responsesGivenRef.current,
        }));
        
        onBotMessage?.(response);
        
        await speak(response);
        
        // Reset transcript for next round
        lastTranscriptRef.current = '';
        
        // Check if we should continue or end
        if (responsesGivenRef.current >= maxResponsesRef.current) {
          setState(prev => ({ ...prev, status: 'ended' }));
        } else {
          setState(prev => ({ ...prev, status: 'listening' }));
          // Continue listening
          setTimeout(() => {
            if (recognitionRef.current) {
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
          if (recognitionRef.current) {
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
    
    // Reset refs
    lastTranscriptRef.current = '';
    responsesGivenRef.current = 0;
    
    setState(prev => ({
      status: 'connecting',
      botResponse: '',
      userTranscript: '',
      responsesGiven: 0,
      userAudioLevel: 0,
      botAudioLevel: 0,
      speechSupported: prev.speechSupported,
    }));

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      
      // Set up audio analyser for mic level
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // Start monitoring audio level
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalized = Math.min(average / 128, 1);
        setState(prev => ({ ...prev, userAudioLevel: normalized }));
      };
      audioLevelIntervalRef.current = window.setInterval(updateAudioLevel, 50);
      
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
    
    // Stop audio level monitoring
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }
    
    // Stop bot audio simulation
    stopBotAudioSimulation();
    
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
    
    analyserRef.current = null;
    
    setState(prev => ({
      status: 'idle',
      botResponse: '',
      userTranscript: '',
      responsesGiven: 0,
      userAudioLevel: 0,
      botAudioLevel: 0,
      speechSupported: prev.speechSupported,
    }));
    
    conversationHistoryRef.current = [];
  }, [stopBotAudioSimulation]);

  // Send a text message (fallback when speech isn't supported)
  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setState(prev => ({ ...prev, userTranscript: text, status: 'responding' }));
    
    const response = await getBotResponse(text);
    responsesGivenRef.current += 1;
    
    setState(prev => ({ 
      ...prev, 
      botResponse: response,
      responsesGiven: responsesGivenRef.current,
    }));
    
    onBotMessage?.(response);
    
    await speak(response);
    
    // Check if we should continue or end
    if (responsesGivenRef.current >= maxResponsesRef.current) {
      setState(prev => ({ ...prev, status: 'ended' }));
    } else {
      setState(prev => ({ ...prev, status: 'listening', userTranscript: '' }));
    }
  }, [getBotResponse, onBotMessage, speak]);

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
    sendTextMessage,
    isActive: state.status !== 'idle' && state.status !== 'ended',
  };
};
