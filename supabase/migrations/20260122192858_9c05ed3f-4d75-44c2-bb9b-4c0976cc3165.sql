-- Seed default channels for the lobby
INSERT INTO public.channels (name, description, is_private, created_by) VALUES
  ('general', 'General chat for everyone', false, NULL),
  ('adults-21-plus', 'Adult conversations (21+ only)', false, NULL),
  ('music', 'Discuss music, share songs, and discover new artists', false, NULL),
  ('help', 'Get help with the chat or general questions', false, NULL),
  ('games', 'Gaming discussions, find players, and share tips', false, NULL),
  ('politics', 'Political discussions and current events', false, NULL),
  ('movies-tv', 'Movies, TV shows, and entertainment chat', false, NULL),
  ('sports', 'Sports talk, game updates, and fan discussions', false, NULL),
  ('technology', 'Tech news, gadgets, and coding discussions', false, NULL),
  ('dating', 'Meet new people and make connections', false, NULL),
  ('lounge', 'Casual hangout and chill conversations', false, NULL),
  ('trivia', 'Play trivia games and test your knowledge', false, NULL)
ON CONFLICT DO NOTHING;