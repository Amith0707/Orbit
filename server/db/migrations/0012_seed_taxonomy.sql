-- Baseline taxonomy so registration/profile forms and AI matching have real data to work with immediately.
INSERT INTO departments (name) VALUES
  ('Engineering'), ('Product'), ('Design'), ('Marketing'), ('Sales'),
  ('People Operations'), ('Finance'), ('Customer Success'), ('Data & Analytics'), ('Leadership')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tags (kind, name) VALUES
  ('interest', 'Football'), ('interest', 'Basketball'), ('interest', 'Cricket'), ('interest', 'Travel'),
  ('interest', 'Movies & TV'), ('interest', 'Music'), ('interest', 'Gaming'), ('interest', 'Photography'),
  ('interest', 'Reading'), ('interest', 'Startups & Tech'), ('interest', 'Investing'), ('interest', 'Sustainability'),
  ('hobby', 'Cooking'), ('hobby', 'Hiking'), ('hobby', 'Chess'), ('hobby', 'Painting'),
  ('hobby', 'Running'), ('hobby', 'Yoga'), ('hobby', 'Gardening'), ('hobby', 'Board Games'),
  ('hobby', 'Cycling'), ('hobby', 'Playing Guitar'), ('hobby', 'Baking'), ('hobby', 'Video Editing'),
  ('skill', 'Public Speaking'), ('skill', 'Writing'), ('skill', 'Data Analysis'), ('skill', 'Leadership'),
  ('skill', 'Product Strategy'), ('skill', 'UI Design'), ('skill', 'Negotiation'), ('skill', 'Mentoring')
ON CONFLICT (kind, name) DO NOTHING;
