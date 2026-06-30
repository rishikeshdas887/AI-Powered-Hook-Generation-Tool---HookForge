-- Create saved_hooks table for storing user's favorite hooks
CREATE TABLE saved_hooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hook_text TEXT NOT NULL,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster user queries
CREATE INDEX idx_saved_hooks_user_id ON saved_hooks(user_id);
CREATE INDEX idx_saved_hooks_created_at ON saved_hooks(created_at DESC);

-- Enable RLS
ALTER TABLE saved_hooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own hooks
CREATE POLICY "select_own_hooks" ON saved_hooks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_hooks" ON saved_hooks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_hooks" ON saved_hooks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create user_profiles table for tracking usage
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  generations_count INTEGER DEFAULT 0 NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();