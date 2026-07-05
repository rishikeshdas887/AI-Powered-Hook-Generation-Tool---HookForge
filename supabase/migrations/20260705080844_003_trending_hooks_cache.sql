-- Trending Hooks Cache Table
CREATE TABLE trending_hooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  hook_text TEXT NOT NULL,
  source_platform TEXT NOT NULL DEFAULT 'tiktok',
  search_keywords TEXT[] DEFAULT '{}',
  engagement_score INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX idx_trending_hooks_category ON trending_hooks(category);
CREATE INDEX idx_trending_hooks_active ON trending_hooks(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_trending_hooks_expires ON trending_hooks(expires_at);

ALTER TABLE trending_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_trending_hooks" ON trending_hooks FOR SELECT
  TO anon, authenticated USING (is_active = TRUE AND expires_at > NOW());

CREATE POLICY "insert_trending_hooks" ON trending_hooks FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_trending_hooks" ON trending_hooks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION refresh_trending_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trending_timestamp ON trending_hooks;
CREATE TRIGGER update_trending_timestamp BEFORE UPDATE ON trending_hooks
  FOR EACH ROW EXECUTE FUNCTION refresh_trending_timestamp();

GRANT SELECT ON trending_hooks TO anon, authenticated;
GRANT INSERT, UPDATE ON trending_hooks TO authenticated;

-- Daily trending categories for cache
INSERT INTO trending_hooks (category, hook_text, source_platform, search_keywords, engagement_score) VALUES
('entrepreneurship', 'The morning habit that took me from broke to $10K/month in 90 days no one talks about this', 'tiktok', ARRAY['entrepreneur', 'morning routine', 'success', 'business'], 85),
('entrepreneurship', 'Stop overcomplicating your business here is the only 3 things you actually need to make money online', 'youtube', ARRAY['business', 'make money', 'entrepreneur', 'simple'], 78),
('entrepreneurship', 'I built a 6-figure business working 4 hours a day let me show you the exact schedule', 'linkedin', ARRAY['business', 'productivity', 'entrepreneur', 'schedule'], 82),
('entrepreneurship', 'The email template that got me a meeting with a Fortune 500 CEO you can copy this word for word', 'linkedin', ARRAY['email', 'CEO', 'entrepreneur', 'business'], 75),
('productivity', 'The productivity hack that took me from 3 tasks to 30 tasks per day and it takes 60 seconds', 'tiktok', ARRAY['productivity', 'tasks', 'efficiency', 'habits'], 88),
('productivity', 'I tried waking up at 4am for 30 days here is what nobody warns you about', 'youtube', ARRAY['productivity', 'waking up early', 'morning routine', 'habits'], 90),
('productivity', 'The 3 apps that replaced my entire productivity workflow and they are all free', 'instagram', ARRAY['productivity', 'apps', 'tools', 'free'], 72),
('productivity', 'Stop using to-do lists they are ruining your productivity here is what to do instead', 'tiktok', ARRAY['productivity', 'to-do list', 'tasks', 'habits'], 86),
('side-hustle', 'The side hustle that made me $5000 last month and you can start it with $0 today', 'youtube', ARRAY['side hustle', 'making money', 'income', 'online'], 84),
('side-hustle', 'Nobody talks about this side hustle but it is generating $200/day for complete beginners', 'tiktok', ARRAY['side hustle', 'income', 'beginner', 'money'], 80),
('side-hustle', '3 side hustles that actually pay in 2024 no 2 are not dropshipping', 'instagram', ARRAY['side hustle', 'dropshipping', 'income', '2024'], 77),
('side-hustle', 'I quit my job after this side hustle replaced my salary here is exactly how I did it', 'youtube', ARRAY['side hustle', 'quit job', 'income', 'success story'], 82),
('fitness', 'The single exercise that transformed my body in 30 days and you can do it at home', 'tiktok', ARRAY['fitness', 'exercise', 'transformation', 'home workout'], 85),
('fitness', 'I trained like an athlete for 30 days here is what changed not what you think', 'youtube', ARRAY['fitness', 'athlete', 'training', 'transformation'], 79),
('fitness', 'The 5 foods I stopped eating and my body changed completely in 60 days', 'instagram', ARRAY['fitness', 'nutrition', 'weight loss', 'foods'], 81),
('fitness', 'Trainers do not want you to know this but it takes 20 minutes not 2 hours', 'tiktok', ARRAY['fitness', 'gym', 'workout', 'trainers'], 88),
('marketing', 'The viral hook formula that got me 10 million views let me break it down for you', 'youtube', ARRAY['marketing', 'viral', 'views', 'content'], 83),
('marketing', 'I stopped posting for 30 days and this happened to my engagement algorithm update maybe', 'instagram', ARRAY['marketing', 'engagement', 'algorithm', 'social media'], 76),
('marketing', 'The 3 words that increased my click-through rate by 340 percent overnight', 'tiktok', ARRAY['marketing', 'CTR', 'clicks', 'conversion'], 87),
('marketing', 'Stop asking for engagement in your posts here is the psychology behind what actually works', 'tiktok', ARRAY['marketing', 'engagement', 'psychology', 'content'], 82),
('finance', 'The budgeting method that helped me save $10000 in 6 months without feeling broke', 'youtube', ARRAY['finance', 'budgeting', 'saving money', 'budget'], 79),
('finance', 'The money mistake that keeps 90% of people broke and how to fix it today', 'tiktok', ARRAY['finance', 'money', 'broke', 'wealth'], 85),
('finance', 'I switched banks and now I earn 200 dollars per month doing absolutely nothing', 'instagram', ARRAY['finance', 'banking', 'passive income', 'interest'], 74),
('finance', 'The negotiation script that got me a 15k raise copy this word for word', 'linkedin', ARRAY['finance', 'negotiation', 'salary', 'raise'], 88);
