-- Create table for storing encrypted private messages
CREATE TABLE public.private_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  encrypted_content text NOT NULL,
  iv text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages (sent or received)
CREATE POLICY "Users can view own messages"
ON public.private_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.private_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can delete their own sent messages
CREATE POLICY "Users can delete own sent messages"
ON public.private_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- Admins and owners can view all messages for moderation
CREATE POLICY "Admins can view all messages"
ON public.private_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- Admins can delete any message
CREATE POLICY "Admins can delete any message"
ON public.private_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX idx_private_messages_recipient ON public.private_messages(recipient_id);
CREATE INDEX idx_private_messages_created_at ON public.private_messages(created_at DESC);

-- Enable realtime for private messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;