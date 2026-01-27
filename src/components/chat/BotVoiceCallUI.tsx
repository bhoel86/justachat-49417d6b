import { Phone, PhoneOff, Mic, Volume2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBotVoiceCall } from '@/hooks/useBotVoiceCall';

interface BotVoiceCallUIProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
  botName: string;
  onBotMessage?: (message: string) => void;
  userName?: string;
}

// Audio level ring component
const AudioLevelRing = ({ level, color, size = 96 }: { level: number; color: string; size?: number }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - level);
  
  return (
    <svg 
      className="absolute inset-0 -rotate-90" 
      width={size} 
      height={size}
    >
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/20"
      />
      {/* Active level ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        style={{ transition: 'stroke-dashoffset 0.05s ease-out' }}
      />
    </svg>
  );
};

const BotVoiceCallUI = ({ isOpen, onClose, botId, botName, onBotMessage, userName = 'You' }: BotVoiceCallUIProps) => {
  const voiceCall = useBotVoiceCall({ 
    botId, 
    botName, 
    onBotMessage 
  });

  if (!isOpen) return null;

  const handleEndCall = () => {
    voiceCall.endCall();
    onClose();
  };

  const getStatusText = () => {
    switch (voiceCall.status) {
      case 'connecting': return 'Connecting...';
      case 'greeting': return `${botName} is saying hello...`;
      case 'listening': return 'Listening to you...';
      case 'responding': return `${botName} is responding...`;
      case 'ended': return 'Call ended';
      default: return 'Ready to call';
    }
  };

  const getStatusColor = () => {
    switch (voiceCall.status) {
      case 'listening': return 'text-green-500';
      case 'responding': return 'text-cyan-500';
      case 'greeting': return 'text-cyan-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-card to-background border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-b from-primary/10 to-transparent">
          <p className={`text-sm ${getStatusColor()}`}>{getStatusText()}</p>
          
          {/* Response counter */}
          {voiceCall.responsesGiven > 0 && voiceCall.status !== 'ended' && (
            <p className="text-xs text-muted-foreground mt-1">
              Response {voiceCall.responsesGiven} of 3
            </p>
          )}
        </div>

        {/* Call Participants */}
        <div className="px-6 py-8 flex items-center justify-center gap-12">
          {/* User (You) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
              <AudioLevelRing 
                level={voiceCall.userAudioLevel} 
                color={voiceCall.status === 'listening' ? '#22c55e' : '#6b7280'} 
                size={80}
              />
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center ${
                voiceCall.status === 'listening' && voiceCall.userAudioLevel > 0.1 ? 'ring-2 ring-green-500/50' : ''
              }`}>
                <User className="h-8 w-8 text-foreground/70" />
              </div>
              {voiceCall.status === 'listening' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Mic className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-foreground">{userName}</span>
            {voiceCall.status === 'listening' && (
              <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-75"
                  style={{ width: `${voiceCall.userAudioLevel * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Bot */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
              <AudioLevelRing 
                level={voiceCall.botAudioLevel} 
                color={voiceCall.status === 'responding' || voiceCall.status === 'greeting' ? '#06b6d4' : '#6b7280'} 
                size={80}
              />
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-3xl ${
                (voiceCall.status === 'responding' || voiceCall.status === 'greeting') && voiceCall.botAudioLevel > 0.1 ? 'ring-2 ring-cyan-500/50' : ''
              }`}>
                🤖
              </div>
              {(voiceCall.status === 'responding' || voiceCall.status === 'greeting') && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                  <Volume2 className="h-3 w-3 text-white animate-pulse" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-foreground">{botName}</span>
            {(voiceCall.status === 'responding' || voiceCall.status === 'greeting') && (
              <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-75"
                  style={{ width: `${voiceCall.botAudioLevel * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Transcript Display */}
        <div className="px-6 py-4 min-h-[100px] space-y-3 border-t border-border/50">
          {voiceCall.userTranscript && (
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-xl rounded-br-sm px-3 py-2 max-w-[85%]">
                <p className="text-sm">{voiceCall.userTranscript}</p>
              </div>
            </div>
          )}
          
          {voiceCall.botResponse && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-xl rounded-bl-sm px-3 py-2 max-w-[85%]">
                <p className="text-xs font-medium text-cyan-500 mb-1">{botName}</p>
                <p className="text-sm">{voiceCall.botResponse}</p>
              </div>
            </div>
          )}
          
          {voiceCall.status === 'listening' && !voiceCall.userTranscript && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Speak now...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-border flex justify-center gap-4">
          {voiceCall.status === 'idle' ? (
            <Button
              onClick={voiceCall.startCall}
              className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white"
            >
              <Phone className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              onClick={handleEndCall}
              className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          )}
        </div>

        {voiceCall.status === 'ended' && (
          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-muted-foreground">Call ended</p>
            <Button
              onClick={handleEndCall}
              variant="outline"
              className="mt-3"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotVoiceCallUI;
