# 👑 SuperAdmin Feature - Complete Setup Guide

## Overview

The HLT app now includes a **SuperAdmin role** with complete system access, CRUD operations, and a unified leaderboard view. SuperAdmins can have multiple roles and choose which role to use when signing in.

---

## 🎯 Key Features

### SuperAdmin Capabilities
- ✅ **Unified Leaderboard** - View all users with their groups and points in one table
- ✅ **User Management** - View, edit, and delete users
- ✅ **Group Management** - View and delete groups
- ✅ **Check-in Monitoring** - View all user check-ins
- ✅ **System Statistics** - See totals for users, groups, check-ins
- ✅ **Search & Filter** - Search across all data
- ✅ **CRUD Operations** - Create, Read, Update, Delete access

### Role Selection
- ✅ **Multiple Roles** - SuperAdmins can have both 'user' and 'superadmin' roles
- ✅ **Role Chooser** - On login, select which role to use
- ✅ **Different UIs** - User role shows normal app, SuperAdmin role shows admin dashboard

---

## 🚀 Deployment Steps

### Step 1: Deploy Updated Edge Function

The backend includes superadmin initialization and new endpoints:

```bash
supabase functions deploy make-server-8daf44f4
```

### Step 2: SuperAdmin Auto-Creation

The Edge Function will automatically create superadmin accounts on first deployment:

**Pre-configured SuperAdmins:**
- `viraj@hlt.app` (username: `viraj`)
- `admin@hlt.app` (username: `admin`)

**Default Password:** `SuperAdmin123!`

⚠️ **IMPORTANT:** Change these passwords immediately after first login!

### Step 3: Deploy Frontend

```bash
git add .
git commit -m "Add SuperAdmin role with CRUD operations and role selection"
git push origin main
```

### Step 4: Test SuperAdmin Access

1. Go to https://help-learn-thank.netlify.app
2. Sign in with username: `viraj` and password: `SuperAdmin123!`
3. You'll see a **Role Selection** screen
4. Choose **SuperAdmin** role
5. You'll see a 5th tab "Admin" in the bottom navigation
6. Click Admin to access the SuperAdmin Dashboard

---

## 📱 User Interface

### Role Selection Screen

When a user with multiple roles signs in, they see:

```
┌─────────────────────────────────────┐
│    Select Your Role                 │
├─────────────────────────────────────┤
│  [🛡️]  SuperAdmin                  │
│        Full system access           │
├─────────────────────────────────────┤
│  [👤]  User                         │
│        Regular user access          │
└─────────────────────────────────────┘
```

### SuperAdmin Dashboard

**Header with Statistics:**
- Total Users
- Total Groups
- Total Check-ins
- Leaderboard Entries

**Tabs:**
1. **Unified Leaderboard** - All users with groups and points
2. **Users** - User management
3. **Groups** - Group management
4. **Check-ins** - Check-in monitoring

### Unified Leaderboard View

| Username | Group Name | Points | Day | Week | Month | Year |
|----------|------------|--------|-----|------|-------|------|
| john     | Team Alpha | 150    | 3   | 15   | 45    | 150  |
| sarah    | Fitness    | 120    | 2   | 12   | 38    | 120  |
| mike     | No Group   | 90     | 3   | 9    | 27    | 90   |

---

## 🔧 Backend Implementation

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/superadmin/unified-leaderboard` | GET | Get all users with groups and points |
| `/superadmin/users` | GET | Get all users |
| `/superadmin/groups` | GET | Get all groups |
| `/superadmin/checkins` | GET | Get all check-ins |
| `/superadmin/users/:userId` | DELETE | Delete a user |
| `/superadmin/users/:userId` | PUT | Update user data |
| `/superadmin/groups/:groupId` | DELETE | Delete a group |

### Security

All SuperAdmin endpoints:
- ✅ Require authentication
- ✅ Check for `isSuperAdmin: true` flag
- ✅ Return 403 Forbidden for non-admins
- ✅ Prevent deleting other superadmins
- ✅ Prevent removing superadmin status

### Auto-Initialization

On server startup, the Edge Function:
1. Checks if superadmin users exist
2. Creates them if they don't exist
3. Assigns multiple roles: `['user', 'superadmin']`
4. Sets `isSuperAdmin: true` flag
5. Logs initialization status

---

## 🎨 Frontend Components

### New Components
- **`SuperAdmin.tsx`** - Complete admin dashboard
  - Unified leaderboard table
  - User management with delete
  - Group management with delete
  - Check-in monitoring
  - Search and filter

### Updated Components
- **`AuthScreen.tsx`** - Role selection after login
- **`App.tsx`** - SuperAdmin tab and routing

### Conditional UI

**Navigation:**
- Normal users see 4 tabs: Home, Groups, Leaderboard, Profile
- SuperAdmins see 5 tabs: Home, Groups, Leaderboard, Profile, **Admin**

**Admin Tab:**
- Only visible when `user.selectedRole === 'superadmin'`
- Golden color scheme to distinguish from regular tabs

---

## 🔐 Adding More SuperAdmins

### Method 1: Through Code (Before Deployment)

Edit `/supabase/functions/make-server-8daf44f4/index.ts`:

```typescript
const SUPERADMIN_IDS = [
  'viraj@hlt.app', 
  'admin@hlt.app',
  'newadmin@hlt.app'  // Add more here
];
```

Then redeploy:
```bash
supabase functions deploy make-server-8daf44f4
```

### Method 2: Through Database (After Deployment)

Using Supabase dashboard or API, update a user:

```typescript
// Set user as superadmin
await kv.set(`user:USER_ID_HERE`, {
  ...existingUserData,
  roles: ['user', 'superadmin'],
  isSuperAdmin: true
});
```

### Method 3: Through SuperAdmin Dashboard (Future)

Create a "Promote to SuperAdmin" feature in the SuperAdmin dashboard.

---

## 📊 Data Structure

### User Object with Roles

```typescript
{
  id: string,
  username: string,
  createdAt: string,
  totalPoints: number,
  dayPoints: number,
  weekPoints: number,
  monthPoints: number,
  yearPoints: number,
  lastResetDay: string,
  lastResetWeek: string,
  lastResetMonth: string,
  lastResetYear: string,
  // SuperAdmin specific fields
  roles?: ['user', 'superadmin'],
  isSuperAdmin?: boolean
}
```

### Signin Response with Role Selection

```typescript
// When user has multiple roles
{
  success: true,
  needsRoleSelection: true,
  availableRoles: ['user', 'superadmin'],
  accessToken: string,
  user: {...}
}

// When role is selected or user has single role
{
  success: true,
  accessToken: string,
  user: {...},
  selectedRole: 'superadmin'
}
```

---

## 🧪 Testing SuperAdmin

### Test Flow

1. **Sign in as SuperAdmin**
   ```
   Username: viraj
   Password: SuperAdmin123!
   ```

2. **Select SuperAdmin Role**
   - Click "SuperAdmin" option

3. **Access Admin Dashboard**
   - Click "Admin" tab in navigation

4. **View Unified Leaderboard**
   - See all users with their groups and points
   - Search for specific users or groups

5. **Manage Users**
   - View all users
   - Delete non-admin users
   - See user statistics

6. **Manage Groups**
   - View all groups
   - Delete groups
   - See group membership

7. **Monitor Check-ins**
   - View all check-ins across the system
   - See what users are answering

8. **Switch to User Role**
   - Sign out
   - Sign in again
   - Choose "User" role
   - Use app normally without admin access

---

## 🔒 Security Best Practices

### Immediate Actions After Deployment

1. **Change Default Passwords**
   ```
   Sign in as viraj → Change password
   Sign in as admin → Change password
   ```

2. **Restrict SuperAdmin IDs**
   - Only add trusted email addresses to `SUPERADMIN_IDS`
   - Use strong passwords
   - Don't share superadmin credentials

3. **Monitor Admin Activity**
   - Check Edge Function logs regularly
   - Review deleted users/groups
   - Track system changes

### Protection Mechanisms

- ✅ SuperAdmins cannot be deleted by other admins
- ✅ SuperAdmin status cannot be removed via API
- ✅ All admin actions require valid authentication
- ✅ Frontend hides admin UI from regular users
- ✅ Backend validates admin status server-side

---

## 💡 Future Enhancements

Potential features to add:
- **Activity Log** - Track all admin actions
- **Promote Users** - Make regular users into admins
- **Bulk Operations** - Delete multiple items at once
- **Data Export** - Export leaderboard to CSV
- **Analytics Dashboard** - Charts and graphs
- **User Impersonation** - View app as another user
- **Announcement System** - Send messages to all users
- **Feature Flags** - Enable/disable features system-wide

---

## 🆘 Troubleshooting

### Issue: Can't See Role Selection
**Solution:** User doesn't have multiple roles. Check user data has `roles: ['user', 'superadmin']`

### Issue: 403 Forbidden on Admin Endpoints
**Solution:** User doesn't have `isSuperAdmin: true` flag set

### Issue: Admin Tab Not Showing
**Solution:** Make sure you selected "SuperAdmin" role during login

### Issue: SuperAdmin Not Created
**Solution:** Check Edge Function logs. May need to manually create via Supabase dashboard

### Issue: Can't Delete Users
**Solution:** Can't delete superadmins. Can only delete regular users.

---

## 📖 Usage Guide

### For SuperAdmins

**Daily Tasks:**
1. Monitor unified leaderboard for anomalies
2. Check new user signups
3. Review group activity
4. Handle user reports (delete spam accounts)

**Weekly Tasks:**
1. Review system statistics
2. Check for inactive groups
3. Monitor check-in patterns
4. Clean up test accounts

**Monthly Tasks:**
1. Export leaderboard data
2. Analyze user engagement
3. Plan feature updates
4. Review security

### For Developers

**Deploying Updates:**
```bash
# Backend changes
supabase functions deploy make-server-8daf44f4

# Frontend changes
git push origin main
```

**Checking Logs:**
```bash
supabase functions logs make-server-8daf44f4 --tail
```

**Adding Features:**
1. Add endpoint in `index.ts`
2. Add UI in `SuperAdmin.tsx`
3. Test thoroughly
4. Deploy

---

**The SuperAdmin system is now live!** 🎉

Default SuperAdmin credentials:
- Username: `viraj`
- Password: `SuperAdmin123!` (PLEASE CHANGE THIS!)
