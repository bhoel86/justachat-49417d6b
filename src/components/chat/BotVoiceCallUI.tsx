import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBotVoiceCall } from '@/hooks/useBotVoiceCall';

interface BotVoiceCallUIProps {
  isOpen: boolean;
  onClose: () => void;
  botId: string;
  botName: string;
  onBotMessage?: (message: string) => void;
}

const BotVoiceCallUI = ({ isOpen, onClose, botId, botName, onBotMessage }: BotVoiceCallUIProps) => {
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
      <div className="bg-gradient-to-b from-card to-background border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center bg-gradient-to-b from-primary/10 to-transparent">
          {/* Bot Avatar */}
          <div className="relative mx-auto w-24 h-24 mb-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/30 to-primary/30 flex items-center justify-center text-4xl ${
              voiceCall.status === 'listening' ? 'ring-4 ring-green-500/50 animate-pulse' :
              voiceCall.status === 'responding' || voiceCall.status === 'greeting' ? 'ring-4 ring-cyan-500/50' : ''
            }`}>
              🤖
            </div>
            {voiceCall.status === 'listening' && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <Mic className="h-4 w-4 text-white" />
              </div>
            )}
            {(voiceCall.status === 'responding' || voiceCall.status === 'greeting') && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                <Volume2 className="h-4 w-4 text-white animate-pulse" />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-foreground">{botName}</h2>
          <p className={`text-sm mt-1 ${getStatusColor()}`}>{getStatusText()}</p>
          
          {/* Response counter */}
          {voiceCall.responsesGiven > 0 && voiceCall.status !== 'ended' && (
            <p className="text-xs text-muted-foreground mt-2">
              Response {voiceCall.responsesGiven} of 3
            </p>
          )}
        </div>

        {/* Transcript Display */}
        <div className="px-6 py-4 min-h-[120px] space-y-3">
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
