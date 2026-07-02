-- Remove payment-related columns from user_profiles table
-- Since we're removing monetization, these are no longer needed

-- Remove is_pro column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_pro;

-- Remove stripe_customer_id column
ALTER TABLE user_profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- Note: We keep generations_count for tracking usage stats
-- This helps users see how many hooks they've created