-- Create support tickets table for help requests
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support messages table for chat
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  sender_username TEXT NOT NULL,
  content TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_tickets
CREATE POLICY "Users can view own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all tickets"
ON public.support_tickets FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

CREATE POLICY "Staff can update all tickets"
ON public.support_tickets FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- RLS policies for support_messages
CREATE POLICY "Users can view messages on own tickets"
ON public.support_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.support_tickets
  WHERE support_tickets.id = support_messages.ticket_id
  AND support_tickets.user_id = auth.uid()
));

CREATE POLICY "Users can send messages on own tickets"
ON public.support_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.support_tickets
  WHERE support_tickets.id = support_messages.ticket_id
  AND support_tickets.user_id = auth.uid()
));

CREATE POLICY "Staff can view all messages"
ON public.support_messages FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

CREATE POLICY "Staff can send messages"
ON public.support_messages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;