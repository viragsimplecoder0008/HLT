# 🚀 Deployment Checklist

## Current Status

You've just added **Groups** and **SuperAdmin** features to your HLT app. Here's what you need to deploy:

---

## ✅ Deployment Steps

### Step 1: Deploy the Edge Function (REQUIRED)

The backend has new endpoints for Groups and SuperAdmin. You **must** deploy the Edge Function:

```bash
supabase functions deploy make-server-8daf44f4
```

**What this does:**
- Deploys all group endpoints (`/groups`, `/invites`, etc.)
- Deploys all superadmin endpoints (`/superadmin/*`)
- Auto-creates superadmin accounts (viraj@hlt.app, admin@hlt.app)
- Initializes the backend with new functionality

**Expected output:**
```
Deploying function make-server-8daf44f4...
Deployed function make-server-8daf44f4 to https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4
```

---

### Step 2: Deploy the Frontend

Commit and push your changes:

```bash
git add .
git commit -m "Add Groups and SuperAdmin features"
git push origin main
```

**What this does:**
- Netlify automatically detects the push
- Builds the updated app
- Deploys to https://help-learn-thank.netlify.app

**Expected time:** 2-3 minutes

---

### Step 3: Verify Deployment

#### Test Groups Feature

1. Go to https://help-learn-thank.netlify.app
2. Sign in with your account
3. Click **Groups** tab
4. Try creating a group
5. If you see the group created successfully ✅ - Backend is deployed!
6. If you see 404 errors ❌ - Backend not deployed yet (go back to Step 1)

#### Test SuperAdmin Feature

1. Sign in with username: `viraj`, password: `SuperAdmin123!`
2. You should see a **Role Selection** screen
3. Choose **SuperAdmin**
4. Click the **Admin** tab
5. You should see the SuperAdmin dashboard
6. If you see data ✅ - SuperAdmin is working!
7. If you see errors ❌ - Check backend deployment

---

## 🐛 Troubleshooting

### Error: "404 Not Found" on Groups endpoints

**Cause:** Edge Function not deployed yet

**Solution:**
```bash
supabase functions deploy make-server-8daf44f4
```

### Error: "403 Forbidden" on SuperAdmin endpoints

**Cause:** User doesn't have superadmin privileges

**Solution:** 
- Sign in with `viraj` or `admin` username
- Select "SuperAdmin" role when prompted
- If still not working, redeploy Edge Function

### Error: "Role selection not appearing"

**Cause:** User doesn't have multiple roles

**Solution:**
- SuperAdmin feature only shows role selection for users with `roles: ['user', 'superadmin']`
- Regular users won't see role selection (this is expected)
- Only viraj@hlt.app and admin@hlt.app have multiple roles

### Error: "Can't create groups"

**Checklist:**
1. ✅ Edge Function deployed?
2. ✅ Signed in with valid account?
3. ✅ Check browser console for errors
4. ✅ Check Edge Function logs: `supabase functions logs make-server-8daf44f4`

---

## 📋 Post-Deployment Tasks

### 1. Change SuperAdmin Passwords ⚠️

**IMPORTANT:** The default passwords are public. Change them immediately!

```bash
# Sign in as viraj
# Go to Profile → Change password (when feature is added)
# Or use Supabase dashboard to reset password
```

Default credentials:
- Username: `viraj` | Password: `SuperAdmin123!`
- Username: `admin` | Password: `SuperAdmin123!`

### 2. Test All Features

- [ ] Daily check-in works
- [ ] Create a group
- [ ] Invite a user to group
- [ ] Accept invite (as another user)
- [ ] View group leaderboard
- [ ] Edit group (as admin)
- [ ] Remove member (as admin)
- [ ] Ban user (as admin)
- [ ] SuperAdmin dashboard loads
- [ ] SuperAdmin unified leaderboard shows data
- [ ] SuperAdmin can delete users/groups

### 3. Create Test Users

Create a few test users to populate the leaderboards:

```bash
# User 1
curl -X POST https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"username":"testuser1","password":"password123"}'

# User 2
curl -X POST https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"username":"testuser2","password":"password123"}'
```

---

## 🔍 Checking Logs

### Edge Function Logs

```bash
supabase functions logs make-server-8daf44f4 --tail
```

Look for:
- `SuperAdmin viraj initialized successfully`
- `SuperAdmin admin initialized successfully`
- Group creation logs
- Any errors

### Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for:
   - API request logs
   - Error messages
   - 404 or 403 errors

---

## ✨ What's New

### New Features Added

1. **Groups System**
   - Create groups
   - Invite members
   - Group leaderboards
   - Admin controls (edit, remove, ban)

2. **SuperAdmin Dashboard**
   - Unified leaderboard (all users + groups)
   - User management (view, delete)
   - Group management (view, delete)
   - Check-in monitoring
   - System statistics

3. **Role Selection**
   - Multiple roles per user
   - Choose role on login
   - Different UI for different roles

### New Endpoints

**Groups:**
- `POST /groups` - Create group
- `GET /groups` - Get user's groups
- `GET /groups/:id` - Get group details
- `PUT /groups/:id` - Update group
- `POST /groups/:id/invite` - Invite user
- `GET /invites` - Get pending invites
- `POST /invites/:id/respond` - Accept/reject invite
- `DELETE /groups/:id/members/:userId` - Remove member
- `POST /groups/:id/ban/:userId` - Ban user
- `GET /groups/:id/leaderboard` - Group leaderboard

**SuperAdmin:**
- `GET /superadmin/unified-leaderboard` - All users + groups
- `GET /superadmin/users` - All users
- `GET /superadmin/groups` - All groups
- `GET /superadmin/checkins` - All check-ins
- `DELETE /superadmin/users/:id` - Delete user
- `PUT /superadmin/users/:id` - Update user
- `DELETE /superadmin/groups/:id` - Delete group

---

## 📊 Expected Behavior

### After Successful Deployment

1. **Login Screen**
   - Works as before for regular users
   - Shows role selection for superadmins

2. **Navigation**
   - Regular users: 4 tabs (Home, Groups, Leaderboard, Profile)
   - SuperAdmins: 5 tabs (Home, Groups, Leaderboard, Profile, Admin)

3. **Groups Tab**
   - Shows pending invites at top
   - Create New Group button
   - List of user's groups
   - Group details with members and leaderboard

4. **Admin Tab** (SuperAdmin only)
   - System statistics
   - Unified leaderboard table
   - User management
   - Group management
   - Check-in monitoring

---

## 🎯 Quick Test Script

Run this to verify everything works:

```bash
# 1. Deploy backend
supabase functions deploy make-server-8daf44f4

# 2. Wait for deployment (30 seconds)
sleep 30

# 3. Test health endpoint
curl https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/health

# Expected output: {"ok":true}

# 4. Push to git
git add .
git commit -m "Deploy Groups and SuperAdmin features"
git push origin main

# 5. Visit app
# https://help-learn-thank.netlify.app
```

---

## 🔐 Security Notes

1. **SuperAdmin Passwords** - Change default passwords immediately
2. **Role Verification** - All admin endpoints verify role server-side
3. **Protected Routes** - Frontend hides admin UI from non-admins
4. **Cannot Delete Self** - SuperAdmins can't delete other superadmins
5. **Audit Logs** - Check Edge Function logs for admin actions

---

## 📱 Mobile Testing

Test on mobile devices:

1. Open https://help-learn-thank.netlify.app on phone
2. Sign in
3. Test navigation (bottom tabs)
4. Create a group
5. Invite someone
6. Check responsiveness

---

## ✅ Final Checklist

Before considering deployment complete:

- [ ] Edge Function deployed successfully
- [ ] Frontend deployed on Netlify
- [ ] Can create groups
- [ ] Can invite users
- [ ] Can accept invites
- [ ] Group leaderboards work
- [ ] SuperAdmin can sign in
- [ ] SuperAdmin dashboard loads
- [ ] SuperAdmin can see unified leaderboard
- [ ] SuperAdmin can delete users/groups
- [ ] Changed default superadmin passwords
- [ ] Tested on mobile device
- [ ] No console errors
- [ ] All features working

---

## 🎉 You're Done!

Once all checklist items are complete:

1. Your app is fully deployed ✅
2. All features are working ✅
3. Groups and SuperAdmin are live ✅

**Next steps:**
- Share the app with users
- Monitor usage
- Gather feedback
- Plan next features

---

**Need help?** Check the documentation:
- `/GROUPS_FEATURE_SUMMARY.md` - Groups details
- `/SUPERADMIN_SETUP.md` - SuperAdmin setup
- `/COMPLETE_FEATURE_SUMMARY.md` - All features
