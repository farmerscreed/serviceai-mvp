-- ============================================================================
-- ADD EMAIL TO USER PROFILES
-- Migration 018: Store email in user_profiles for easier access
-- ============================================================================

-- Add email column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Update existing user profiles with email from auth.users
-- This is a one-time sync
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        WHERE EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = au.id)
    LOOP
        UPDATE public.user_profiles
        SET email = user_record.email
        WHERE id = user_record.id AND email IS NULL;
    END LOOP;
END$$;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, preferred_language)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update email when user email changes in auth.users
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_profiles
  SET email = new.email
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email updates
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_update();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 018 completed successfully!';
    RAISE NOTICE 'Added email column to user_profiles';
    RAISE NOTICE 'Synced existing emails from auth.users';
    RAISE NOTICE 'Updated handle_new_user trigger to include email';
END$$;

