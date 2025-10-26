# HLT - Help, Learn, Thank

A mobile-first daily habit tracking app that encourages positive behaviors through three simple questions:
- Did you help somebody?
- Did you learn something?  
- Did you thank somebody?

## 🚀 Quick Start - Deploy Backend

**The app requires deploying a Supabase Edge Function before it will work.**

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

Or follow the [official guide](https://supabase.com/docs/guides/cli/getting-started).

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref hbabranmwzppeuyzczvlv
```

When prompted, enter your database password (the one you set when creating the project).

### 4. Deploy the Edge Function

```bash
supabase functions deploy make-server-8daf44f4
```

### 5. Verify Deployment

```bash
curl https://hbabranmwzppeuyzczvlv.supabase.co/functions/v1/make-server-8daf44f4/health
```

You should see: `{"status":"ok","timestamp":"..."}`

## ✅ That's It!

Once deployed, refresh the app and you'll be able to:
- Create an account
- Sign in
- Submit daily check-ins
- View leaderboards
- Track your progress

## 🎨 Features

- **Glassmorphism Design** - Beautiful Apple-inspired glass aesthetic
- **Dark Mode Only** - Optimized for dark environments
- **Daily Check-ins** - Track Help, Learn, Thank activities
- **Points System** - Earn points for each completed activity
- **Leaderboards** - Daily, weekly, monthly, and yearly rankings
- **Progress Tracking** - View your stats and achievements
- **Edit Entries** - Modify today's check-in anytime

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Glassmorphism
- **UI Components**: shadcn/ui
- **Backend**: Supabase Edge Functions (Hono + Deno)
- **Database**: Supabase KV Store
- **Auth**: Supabase Auth (username-based)

## 📝 Troubleshooting

### "Failed to fetch" error
- The backend Edge Function hasn't been deployed
- Solution: Follow the deployment steps above

### "Unauthorized" error  
- Your access token expired
- Solution: Sign out and sign in again

### Supabase CLI permission errors
- Make sure you're logged into the correct Supabase account
- Verify you have access to the project

## 📄 License

MIT
