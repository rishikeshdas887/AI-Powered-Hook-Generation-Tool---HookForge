-- Store OAuth provider tokens (Google, etc.) for API access
CREATE TABLE user_oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  provider_token TEXT,
  provider_refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_tokens_user ON user_oauth_tokens(user_id);

ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_oauth_tokens" ON user_oauth_tokens FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_oauth_tokens" ON user_oauth_tokens FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_oauth_tokens" ON user_oauth_tokens FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_oauth_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_oauth_token_timestamp ON user_oauth_tokens;
CREATE TRIGGER update_oauth_token_timestamp BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_oauth_timestamp();

GRANT SELECT, INSERT, UPDATE ON user_oauth_tokens TO authenticated;
