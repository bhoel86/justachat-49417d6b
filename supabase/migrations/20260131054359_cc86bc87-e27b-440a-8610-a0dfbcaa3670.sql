-- Create site_settings table for global configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read site settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Only owners can update site settings
CREATE POLICY "Owners can manage site settings"
ON public.site_settings FOR ALL
USING (is_owner(auth.uid()));

-- Insert default theme
INSERT INTO public.site_settings (key, value) VALUES ('theme', 'jac');

-- Enable realtime for instant theme updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;