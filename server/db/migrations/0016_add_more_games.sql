INSERT INTO games (key, name) VALUES
  ('rock_paper_scissors', 'Rock Paper Scissors'),
  ('connect_four', 'Connect Four')
ON CONFLICT (key) DO NOTHING;
