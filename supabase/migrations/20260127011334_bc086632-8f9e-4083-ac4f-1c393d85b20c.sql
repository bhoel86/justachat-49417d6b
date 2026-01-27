-- Create user reports table
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Users can submit reports
CREATE POLICY "Users can submit reports"
ON public.user_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
ON public.user_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Admins and owners can view all reports
CREATE POLICY "Staff can view all reports"
ON public.user_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Admins and owners can update reports (review status)
CREATE POLICY "Staff can update reports"
ON public.user_reports
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator') OR is_owner(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_user_reports_status ON public.user_reports(status);
CREATE INDEX idx_user_reports_reported_user ON public.user_reports(reported_user_id);