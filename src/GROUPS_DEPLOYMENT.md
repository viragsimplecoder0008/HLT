# Groups Feature Deployment Guide

## 🎉 New Feature: Groups!

The Groups feature has been added to HLT! Users can now:
- ✅ Create groups
- ✅ Invite other users to join
- ✅ Accept/reject invites
- ✅ View group leaderboards (daily, weekly, monthly, yearly)
- ✅ Admin controls:
  - Edit group name and description
  - Invite users
  - Remove members
  - Ban users from group
  - Group creator cannot be removed or banned

## 🚀 Deployment Steps

### Step 1: Deploy Updated Edge Function

The backend has been updated with new group endpoints. Deploy it:

```bash
cd /path/to/your/project
supabase functions deploy make-server-8daf44f4
```

### Step 2: Deploy Frontend to Netlify

Commit and push your changes:

```bash
git add .
git commit -m "Add Groups feature with admin controls"
git push origin main
```

Netlify will automatically deploy the updated frontend.

### Step 3: Test the Groups Feature

1. Visit https://help-learn-thank.netlify.app
2. Log in with your account
3. Click the **Groups** tab in the bottom navigation
4. Click **Create New Group**
5. Fill in group name and description
6. Click **Invite** to invite other users by username
7. Other users will see pending invites at the top of their Groups page
8. They can accept or decline invites
9. View group members and leaderboard in the group details

## 📋 New Backend Endpoints

The following endpoints have been added:

### Group Management
- `POST /groups` - Create a new group
- `GET /groups` - Get user's groups
- `GET /groups/:groupId` - Get group details
- `PUT /groups/:groupId` - Update group metadata (admin only)

### Invitations
- `POST /groups/:groupId/invite` - Invite user to group (admin only)
- `GET /invites` - Get user's pending invites
- `POST /invites/:inviteId/respond` - Accept/reject invite

### Member Management
- `DELETE /groups/:groupId/members/:userId` - Remove member (admin only)
- `POST /groups/:groupId/ban/:userId` - Ban user (admin only)
- `POST /groups/:groupId/unban/:userId` - Unban user (admin only)

### Leaderboards
- `GET /groups/:groupId/leaderboard?period=daily` - Get group leaderboard

## 🔒 Permissions System

### Group Creator
- The user who creates the group is automatically the admin
- Creator **cannot** be removed or banned
- Creator has all admin privileges

### Admin Privileges
- Invite users to the group
- Edit group name and description
- Remove members (except creator)
- Ban users (except creator)
- Unban users
- View all group details

### Regular Members
- View group details
- View members list
- View group leaderboard
- Leave group (coming soon)

## 🎨 UI Features

### Groups Tab
- Shows pending invites at the top
- **Create New Group** button
- List of user's groups with selector
- Group details card with tabs for Members and Leaderboard

### Admin Controls (visible to admins only)
- **Edit** button - Edit group name and description
- **Invite** button - Invite users by username
- **Remove** button - Remove members from group
- **Ban** button - Ban users from group

### Group Leaderboard
- Toggle between daily, weekly, monthly, yearly
- Shows top 3 with special highlighting
- Trophy icons for medal positions
- Only shows group members

## 📊 Data Structure

### Group Object
```typescript
{
  id: string,
  name: string,
  description: string,
  createdBy: string,
  createdAt: string,
  admins: string[],
  members: string[],
  bannedUsers: string[]
}
```

### Invite Object
```typescript
{
  id: string,
  groupId: string,
  groupName: string,
  invitedBy: string,
  invitedByUsername: string,
  invitedUserId: string,
  invitedUsername: string,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: string
}
```

## 🧪 Testing

Test the groups feature:

```bash
# Create test users
curl -X POST https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"password123"}'

# Sign in
curl -X POST https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"password123"}'

# Create a group (use access token from signin)
curl -X POST https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Test Group","description":"A test group"}'
```

## 💡 Future Enhancements

Potential features to add:
- Leave group functionality
- Make other members admins
- Group chat/comments
- Group challenges
- Group achievements
- Private/public groups
- Search for public groups

---

Enjoy the new Groups feature! 🎉
