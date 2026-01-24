-- Create table to store user conversation topics per channel
CREATE TABLE public.user_conversation_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  topics TEXT[] NOT NULL DEFAULT '{}',
  last_messages JSONB NOT NULL DEFAULT '[]',
  mood TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_name)
);

-- Enable RLS
ALTER TABLE public.user_conversation_topics ENABLE ROW LEVEL SECURITY;

-- Users can view/manage their own conversation history
CREATE POLICY "Users can view own conversation topics"
ON public.user_conversation_topics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation topics"
ON public.user_conversation_topics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation topics"
ON public.user_conversation_topics FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can manage for bots
CREATE POLICY "Service role can manage conversation topics"
ON public.user_conversation_topics FOR ALL
USING (true)
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_user_conversation_topics_user_channel 
ON public.user_conversation_topics(user_id, channel_name);

-- Trigger to update updated_at
CREATE TRIGGER update_user_conversation_topics_updated_at
BEFORE UPDATE ON public.user_conversation_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();