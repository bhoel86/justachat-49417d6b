-- Create table to track donation notification clicks (one per user)
CREATE TABLE public.donation_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  username text
);

-- Enable RLS
ALTER TABLE public.donation_clicks ENABLE ROW LEVEL SECURITY;

-- Users can see their own click status
CREATE POLICY "Users can view own donation click"
ON public.donation_clicks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own click (once)
CREATE POLICY "Users can insert own donation click"
ON public.donation_clicks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all clicks
CREATE POLICY "Admins can view all donation clicks"
ON public.donation_clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));