-- Add is_active column to profiles table to track active/inactive users
-- This allows marking users as inactive when they quit without deleting their data
-- Also add username field and requires_password_change for first-time login flow

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Update email to be nullable since we're using username-based auth
ALTER TABLE public.profiles 
ALTER COLUMN email DROP NOT NULL;

-- Add constraint to prevent deletion of users with associated data
-- This is handled in application logic for better error messages
