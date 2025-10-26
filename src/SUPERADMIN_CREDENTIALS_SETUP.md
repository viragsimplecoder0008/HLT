# SuperAdmin Credentials Setup Guide

## Quick Setup Steps

### 1. Set the SuperAdmin Password

A modal should have appeared asking you to set the `SUPERADMIN_PASSWORD` secret. 

**If you don't see the modal:**
- Go to your Supabase project dashboard
- Navigate to: Project Settings → Edge Functions → Secrets
- Add a new secret:
  - Name: `SUPERADMIN_PASSWORD`
  - Value: Your chosen secure password (e.g., `MySecurePass123!`)

### 2. Deploy the Edge Function

Run these commands in your terminal:

```bash
supabase link --project-ref <your-project-ref>
supabase functions deploy make-server-8daf44f4
```

**IMPORTANT:** The superadmin accounts are created automatically when the Edge Function starts up. This means you MUST deploy the function AFTER setting the `SUPERADMIN_PASSWORD` secret.

### 3. Sign In as SuperAdmin

1. Go to your app URL
2. On the login screen, enter:
   - **Username:** `viraj` (or `admin`)
   - **Password:** The password you set in step 1
3. Click **Sign In**
4. You'll see a **Role Selection** screen with two options:
   - **SuperAdmin** (yellow button with shield icon) - Full system access
   - **User** (blue button) - Regular user access
5. Select **SuperAdmin**
6. You'll now see an **Admin** tab in the bottom navigation

## How It Works

### Superadmin Accounts

Two superadmin accounts are automatically created:
- `viraj@hlt.app` (username: `viraj`)
- `admin@hlt.app` (username: `admin`)

Both use the password you set in `SUPERADMIN_PASSWORD`.

### Role Selection

Superadmin accounts have access to TWO roles:
- **User Role** - Access to all normal features (Home, Groups, Leaderboard, Profile)
- **SuperAdmin Role** - Access to normal features PLUS the Admin dashboard

When you sign in, you can choose which role you want to use. This is why you see the role selection screen.

### Admin Dashboard Features

When signed in as SuperAdmin, you can:
- **View all users** in the system
- **Create/Edit/Delete users** 
- **See unified leaderboard** showing {UserName} | {GroupName} | Points
- **Manage all groups** and memberships
- **View system statistics**

## Troubleshooting

### "Invalid credentials" error
- Make sure you set the `SUPERADMIN_PASSWORD` secret BEFORE deploying
- Redeploy the Edge Function after setting the secret
- Use the exact password you set (passwords are case-sensitive)

### "I don't see the role selection screen"
- This means the backend didn't recognize you as a superadmin
- Check that the Edge Function deployed successfully
- Check the Edge Function logs: `supabase functions logs make-server-8daf44f4`
- Look for messages like "SuperAdmin viraj initialized successfully"

### "I signed in but don't see the Admin tab"
- Make sure you selected **SuperAdmin** role (not User role)
- Try signing out and signing in again
- Select SuperAdmin on the role selection screen

### "Backend not deployed" warning
- You need to deploy the Edge Function first
- Run: `supabase functions deploy make-server-8daf44f4`
- Make sure you're linked to your Supabase project

## Changing the SuperAdmin Password

To change the superadmin password:

1. Update the `SUPERADMIN_PASSWORD` secret in Supabase dashboard
2. Sign in to your app as superadmin
3. Go to the Admin tab
4. Find your user in the user list
5. Click Edit and change the password
6. OR manually update it via Supabase Auth dashboard

## Security Notes

✅ **Good practices:**
- The password is stored securely in Supabase secrets (not hardcoded)
- SuperAdmin access is controlled via the `roles` array
- All admin operations require authentication

⚠️ **Important:**
- Change the default password immediately
- Don't share superadmin credentials
- Regularly audit user access in the Admin dashboard
