-- Create donation_settings table to track donation progress
CREATE TABLE public.donation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_amount numeric(10,2) NOT NULL DEFAULT 0,
  goal_amount numeric(10,2) NOT NULL DEFAULT 500,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view donation progress (public display)
CREATE POLICY "Anyone can view donation settings"
ON public.donation_settings
FOR SELECT
USING (true);

-- Only owners and admins can update donation settings
CREATE POLICY "Owners and admins can update donation settings"
ON public.donation_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_owner(auth.uid()));

-- Only owners can insert (for initial setup)
CREATE POLICY "Owners can insert donation settings"
ON public.donation_settings
FOR INSERT
WITH CHECK (is_owner(auth.uid()));

-- Insert initial row
INSERT INTO public.donation_settings (current_amount, goal_amount) VALUES (0, 500);