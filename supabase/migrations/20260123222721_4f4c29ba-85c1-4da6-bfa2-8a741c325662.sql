-- Create dating profiles table for extended dating info
CREATE TABLE IF NOT EXISTS public.dating_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  age integer,
  location text,
  looking_for text,
  interests text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create dating swipes table
CREATE TABLE IF NOT EXISTS public.dating_swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swiped_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('left', 'right')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, swiped_id)
);

-- Create dating matches table
CREATE TABLE IF NOT EXISTS public.dating_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id)
);

-- Enable RLS
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

-- Dating profiles policies
CREATE POLICY "Users can view all dating profiles"
ON public.dating_profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own dating profile"
ON public.dating_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dating profile"
ON public.dating_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Dating swipes policies
CREATE POLICY "Users can view own swipes"
ON public.dating_swipes FOR SELECT
USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create own swipes"
ON public.dating_swipes FOR INSERT
WITH CHECK (auth.uid() = swiper_id);

-- Dating matches policies
CREATE POLICY "Users can view own matches"
ON public.dating_matches FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Authenticated users can create matches"
ON public.dating_matches FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add trigger for updated_at on dating_profiles
CREATE TRIGGER update_dating_profiles_updated_at
  BEFORE UPDATE ON public.dating_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();