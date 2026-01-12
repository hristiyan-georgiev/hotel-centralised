# Initial System Setup Guide

## Overview
This guide will help you set up your first admin account and configure the handover system for initial use.

## Prerequisites
- Supabase project created and configured
- Database migrations run (all SQL scripts in `/scripts` folder)

## Supabase Authentication Configuration

Before creating users, you need to configure Supabase to disable email confirmations:

### Disable Email Confirmations
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Under **Email Settings**, find **"Enable email confirmations"**
4. **Disable** this toggle (turn it OFF)
5. Click **Save**

This ensures that newly created accounts are immediately active and don't require email verification.

### Optional: Disable Email Templates
Since you're not using emails, you can also disable email templates:
1. Go to **Authentication** > **Email Templates**
2. You can leave them as-is or customize if needed in the future

## Database Setup

### Step 1: Run Migration Scripts (in order)
Execute these SQL scripts in your Supabase SQL Editor:

1. **001_create_tables.sql** - Creates core tables (departments, profiles, categories, handover_notes)
2. **002_create_profile_trigger.sql** - Sets up automatic profile creation on user signup
3. **003_create_resources.sql** - Creates resources table
4. **004_add_user_active_status.sql** - Adds username, is_active, and requires_password_change fields

**Note:** Username lookup is handled securely via a server-side API route (`/api/auth/lookup-username`), so no additional RLS policy changes are needed.

### Step 2: Create Initial Admin Account

Since the system uses username-based authentication, you need to create your first admin account directly in Supabase:

#### Option A: Using Supabase Dashboard
1. Go to **Authentication > Users** in your Supabase dashboard
2. Click **Add user** > **Create new user**
3. Set email to: `admin@handover.local` (or any .local email format)
4. Set password: Choose a secure password
5. Confirm email: Enable this option
6. Click **Create user**

#### Option B: Using SQL
```sql
-- This creates the auth user first
-- Replace 'your-secure-password' with your actual password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@handover.local',
  crypt('your-secure-password', gen_salt('bf')),
  NOW(),
  '{"full_name": "System Administrator", "username": "admin", "role": "admin", "requires_password_change": false}'::jsonb,
  NOW(),
  NOW()
);
```

### Step 3: Update the Profile (if needed)
After creating the user, the profile should be auto-created by the trigger. Verify and update if necessary:

```sql
-- Check the profile was created
SELECT * FROM profiles WHERE username = 'admin';

-- If needed, manually update the profile
UPDATE profiles
SET 
  username = 'admin',
  role = 'admin',
  is_active = true,
  requires_password_change = false
WHERE email = 'admin@handover.local';
```

### Step 4: Create Departments
Create your first department for organizing staff:

```sql
INSERT INTO departments (name, description)
VALUES 
  ('Front Desk', 'Reception and guest services'),
  ('Housekeeping', 'Room cleaning and maintenance'),
  ('Management', 'Administrative and management staff');
```

## First Login

1. Navigate to `/login` page
2. Use username: `admin`
3. Use the password you set during account creation
4. You'll be redirected to the admin dashboard

## Creating Additional Users

Once logged in as admin:

1. Go to **Manage Users** from the admin dashboard
2. Click **New User**
3. Fill in the form:
   - **Full Name**: Employee's full name
   - **Username**: Unique username (lowercase, alphanumeric only)
   - **Temporary Password**: Auto-generated (you can regenerate or copy it)
   - **Role**: Staff or Admin
   - **Department**: Assign to appropriate department

4. Click **Create User**
5. **IMPORTANT**: Copy the username and temporary password to share with the employee
6. The employee will be required to change their password on first login

## Username-Based Authentication

The system uses **usernames** instead of emails for login:
- Users log in with their username and password
- Emails are stored internally but not used for authentication
- Each username must be unique across the system

## Security Features

### Active/Inactive Accounts
- Admins can mark accounts as **Inactive** when employees leave
- Inactive users cannot log in to the system
- Their data is preserved for record-keeping

### Account Deletion Protection
Users cannot be deleted if they have:
- Handover notes
- Complaints (created, assigned, or resolved)
- Notifications

Instead, mark them as **Inactive** to preserve data integrity.

### First-Time Password Change
- All newly created users must change their password on first login
- This ensures only the employee knows their password
- The temporary password should be communicated securely

## Troubleshooting

### Cannot login with admin account
- Verify the username is set correctly in the database
- Check that `is_active = true` in the profiles table
- Ensure `requires_password_change = false` for the admin account

### User stuck on password change page
- Check that the user's `requires_password_change` flag is set correctly
- Verify they completed the password change form

### Username already exists error
- Usernames must be unique across all users
- Choose a different username
- Check for inactive users with the same username

## Next Steps

After initial setup:
1. Create departments for your organization
2. Create user accounts for all staff members
3. Set up categories for handover notes
4. Add resources/guides for staff reference
5. Configure notification preferences

## Support

For issues or questions, refer to the main project documentation or contact your system administrator.
