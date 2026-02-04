-- Create chat-images bucket for storing chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-images', 'chat-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to chat images
CREATE POLICY "chat_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "chat_images_user_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role full access
CREATE POLICY "chat_images_service_role_all"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'chat-images')
WITH CHECK (bucket_id = 'chat-images');