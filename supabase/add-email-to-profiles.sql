-- Add email column to profiles table
-- Run this in Supabase SQL Editor

-- Add the email column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create a function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the profile with the user's email
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically sync email when a user signs up or email changes
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Backfill existing users' emails
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id;

-- Verify the column was added and emails synced
SELECT id, full_name, email, role
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
