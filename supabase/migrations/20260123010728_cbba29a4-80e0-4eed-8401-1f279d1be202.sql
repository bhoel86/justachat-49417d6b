-- Create trivia_scores table to track user points
CREATE TABLE public.trivia_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  total_answers INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view scores (for leaderboard)
CREATE POLICY "Anyone can view trivia scores"
ON public.trivia_scores
FOR SELECT
USING (true);

-- Users can insert their own score
CREATE POLICY "Users can insert own score"
ON public.trivia_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own score
CREATE POLICY "Users can update own score"
ON public.trivia_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_trivia_scores_updated_at
BEFORE UPDATE ON public.trivia_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for trivia_scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.trivia_scores;