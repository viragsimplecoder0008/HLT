import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods - must be broad for preflight
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400,
    credentials: true,
  }),
);

// Helper function to get current user from access token
async function getCurrentUser(accessToken: string | undefined) {
  if (!accessToken) return null;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;
  
  return user;
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to get date ranges
function getDateRanges() {
  const now = new Date();
  const today = formatDate(now);
  
  // Week start (Monday)
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  const weekStartStr = formatDate(weekStart);
  
  // Month start
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = formatDate(monthStart);
  
  // Year start
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearStartStr = formatDate(yearStart);
  
  return { today, weekStartStr, monthStartStr, yearStartStr };
}

// Helper function to reset period points if needed
function resetPeriodPoints(userData: any) {
  const { today, weekStartStr, monthStartStr, yearStartStr } = getDateRanges();
  let updated = false;
  
  // Reset daily points if new day
  if (userData.lastResetDay !== today) {
    userData.dayPoints = 0;
    userData.lastResetDay = today;
    updated = true;
  }
  
  // Reset weekly points if new week
  if (userData.lastResetWeek !== weekStartStr) {
    userData.weekPoints = 0;
    userData.lastResetWeek = weekStartStr;
    updated = true;
  }
  
  // Reset monthly points if new month
  if (userData.lastResetMonth !== monthStartStr) {
    userData.monthPoints = 0;
    userData.lastResetMonth = monthStartStr;
    updated = true;
  }
  
  // Reset yearly points if new year
  if (userData.lastResetYear !== yearStartStr) {
    userData.yearPoints = 0;
    userData.lastResetYear = yearStartStr;
    updated = true;
  }
  
  return { userData, updated };
}

// Health check endpoint
app.get("/make-server-8daf44f4/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Explicit OPTIONS handler for all routes (helps with CORS preflight)
app.options("/make-server-8daf44f4/*", (c) => {
  return c.json({ ok: true });
});

// Sign up endpoint
app.post("/make-server-8daf44f4/signup", async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }
    
    // Check if username already exists
    const existingUsers = await kv.getByPrefix(`user_by_username:${username}`);
    if (existingUsers && existingUsers.length > 0) {
      return c.json({ error: 'Username already exists' }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Create auth user with username as email (username@hlt.app)
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username}@hlt.app`,
      password: password,
      user_metadata: { username },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log('Supabase auth error during signup:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Store user data with period-specific points
    const now = new Date();
    const today = formatDate(now);
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      username,
      createdAt: new Date().toISOString(),
      totalPoints: 0,
      dayPoints: 0,
      weekPoints: 0,
      monthPoints: 0,
      yearPoints: 0,
      lastResetDay: today,
      lastResetWeek: today,
      lastResetMonth: today,
      lastResetYear: today
    });
    
    // Store username mapping for lookup
    await kv.set(`user_by_username:${username}`, data.user.id);
    
    return c.json({ 
      success: true,
      userId: data.user.id,
      username 
    });
  } catch (error) {
    console.log('Error during signup:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Sign in endpoint
app.post("/make-server-8daf44f4/signin", async (c) => {
  try {
    const { username, password, role } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@hlt.app`,
      password: password,
    });
    
    if (error) {
      console.log('Supabase auth error during signin:', error);
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Get user data
    const userData = await kv.get(`user:${data.user.id}`);
    
    // Check if user is a superadmin (Viraj@hlt.app)
    const isSuperAdmin = data.user.email === 'Viraj@hlt.app';
    
    // If superadmin and no role selected yet, return available roles
    if (isSuperAdmin && !role) {
      return c.json({
        needsRoleSelection: true,
        availableRoles: ['superadmin', 'user'],
        accessToken: data.session.access_token,
        user: userData
      });
    }
    
    // Return with selected role
    const selectedRole = isSuperAdmin && role === 'superadmin' ? 'superadmin' : 'user';
    
    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: userData,
      selectedRole: selectedRole
    });
  } catch (error) {
    console.log('Error during signin:', error);
    return c.json({ error: 'Signin failed' }, 500);
  }
});

// Get session endpoint
app.get("/make-server-8daf44f4/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ user: null });
    }
    
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ user: null });
    }
    
    let userData = await kv.get(`user:${user.id}`);
    
    // Reset period points if needed
    const resetResult = resetPeriodPoints(userData);
    if (resetResult.updated) {
      userData = resetResult.userData;
      await kv.set(`user:${user.id}`, userData);
    }
    
    return c.json({ user: userData });
  } catch (error) {
    console.log('Error getting session:', error);
    return c.json({ user: null });
  }
});

// Submit daily check-in
app.post("/make-server-8daf44f4/checkin", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { help, learn, thank } = await c.req.json();
    const today = formatDate(new Date());
    
    // Check if user already checked in today
    const existingCheckin = await kv.get(`checkin:${user.id}:${today}`);
    if (existingCheckin) {
      return c.json({ error: 'You have already checked in today' }, 400);
    }
    
    // Calculate points
    let points = 0;
    if (help && help !== '') points++;
    if (learn && learn !== '') points++;
    if (thank && thank !== '') points++;
    
    // Store check-in
    const checkinData = {
      userId: user.id,
      date: today,
      help: help || null,
      learn: learn || null,
      thank: thank || null,
      points,
      timestamp: new Date().toISOString()
    };
    
    await kv.set(`checkin:${user.id}:${today}`, checkinData);
    
    // Update user total points and period points
    let userData = await kv.get(`user:${user.id}`);
    
    // Reset period points if needed
    const resetResult = resetPeriodPoints(userData);
    userData = resetResult.userData;
    
    const updatedUserData = {
      ...userData,
      totalPoints: (userData.totalPoints || 0) + points,
      dayPoints: (userData.dayPoints || 0) + points,
      weekPoints: (userData.weekPoints || 0) + points,
      monthPoints: (userData.monthPoints || 0) + points,
      yearPoints: (userData.yearPoints || 0) + points,
      lastCheckin: today
    };
    await kv.set(`user:${user.id}`, updatedUserData);
    
    return c.json({
      success: true,
      points,
      totalPoints: updatedUserData.totalPoints,
      checkin: checkinData
    });
  } catch (error) {
    console.log('Error submitting check-in:', error);
    return c.json({ error: 'Failed to submit check-in' }, 500);
  }
});

// Get user profile and stats
app.get("/make-server-8daf44f4/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    let userData = await kv.get(`user:${user.id}`);
    
    // Reset period points if needed
    const resetResult = resetPeriodPoints(userData);
    if (resetResult.updated) {
      userData = resetResult.userData;
      await kv.set(`user:${user.id}`, userData);
    }
    
    // Get all check-ins for this user
    const allCheckins = await kv.getByPrefix(`checkin:${user.id}:`);
    
    // Calculate stats
    const totalHelps = allCheckins.filter(c => c.help).length;
    const totalLearns = allCheckins.filter(c => c.learn).length;
    const totalThanks = allCheckins.filter(c => c.thank).length;
    const totalCheckins = allCheckins.length;
    
    return c.json({
      user: userData,
      stats: {
        totalPoints: userData.totalPoints || 0,
        totalCheckins,
        totalHelps,
        totalLearns,
        totalThanks,
        lastCheckin: userData.lastCheckin
      }
    });
  } catch (error) {
    console.log('Error getting profile:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Get leaderboard
app.get("/make-server-8daf44f4/leaderboard", async (c) => {
  try {
    const period = c.req.query('period') || 'daily'; // daily, weekly, monthly, yearly
    
    // Get all users
    const allUsers = await kv.getByPrefix('user:');
    
    let leaderboardData = [];
    
    for (let userData of allUsers) {
      if (!userData.id) continue;
      
      // Reset period points if needed
      const resetResult = resetPeriodPoints(userData);
      if (resetResult.updated) {
        userData = resetResult.userData;
        await kv.set(`user:${userData.id}`, userData);
      }
      
      let periodPoints = 0;
      
      switch (period) {
        case 'daily':
          periodPoints = userData.dayPoints || 0;
          break;
        case 'weekly':
          periodPoints = userData.weekPoints || 0;
          break;
        case 'monthly':
          periodPoints = userData.monthPoints || 0;
          break;
        case 'yearly':
          periodPoints = userData.yearPoints || 0;
          break;
      }
      
      leaderboardData.push({
        userId: userData.id,
        username: userData.username,
        points: periodPoints
      });
    }
    
    // Sort by points descending
    leaderboardData.sort((a, b) => b.points - a.points);
    
    // Add ranks
    leaderboardData = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    return c.json({
      period,
      leaderboard: leaderboardData
    });
  } catch (error) {
    console.log('Error getting leaderboard:', error);
    return c.json({ error: 'Failed to get leaderboard' }, 500);
  }
});

// Check if user checked in today
app.get("/make-server-8daf44f4/checkin-status", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const today = formatDate(new Date());
    const checkin = await kv.get(`checkin:${user.id}:${today}`);
    
    return c.json({
      hasCheckedIn: !!checkin,
      checkin: checkin || null
    });
  } catch (error) {
    console.log('Error checking checkin status:', error);
    return c.json({ error: 'Failed to check status' }, 500);
  }
});

// Edit daily check-in
app.put("/make-server-8daf44f4/checkin", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { help, learn, thank } = await c.req.json();
    const today = formatDate(new Date());
    
    // Get existing check-in
    const existingCheckin = await kv.get(`checkin:${user.id}:${today}`);
    if (!existingCheckin) {
      return c.json({ error: 'No check-in found for today' }, 400);
    }
    
    // Calculate old and new points
    const oldPoints = existingCheckin.points || 0;
    
    let newPoints = 0;
    if (help && help !== '') newPoints++;
    if (learn && learn !== '') newPoints++;
    if (thank && thank !== '') newPoints++;
    
    const pointsDiff = newPoints - oldPoints;
    
    // Update check-in
    const updatedCheckinData = {
      ...existingCheckin,
      help: help || null,
      learn: learn || null,
      thank: thank || null,
      points: newPoints,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(`checkin:${user.id}:${today}`, updatedCheckinData);
    
    // Update user points if there's a difference
    if (pointsDiff !== 0) {
      let userData = await kv.get(`user:${user.id}`);
      
      // Reset period points if needed
      const resetResult = resetPeriodPoints(userData);
      userData = resetResult.userData;
      
      const updatedUserData = {
        ...userData,
        totalPoints: (userData.totalPoints || 0) + pointsDiff,
        dayPoints: (userData.dayPoints || 0) + pointsDiff,
        weekPoints: (userData.weekPoints || 0) + pointsDiff,
        monthPoints: (userData.monthPoints || 0) + pointsDiff,
        yearPoints: (userData.yearPoints || 0) + pointsDiff,
      };
      await kv.set(`user:${user.id}`, updatedUserData);
    }
    
    return c.json({
      success: true,
      points: newPoints,
      checkin: updatedCheckinData
    });
  } catch (error) {
    console.log('Error editing check-in:', error);
    return c.json({ error: 'Failed to edit check-in' }, 500);
  }
});

// ===========================
// GROUPS ENDPOINTS
// ===========================

// Generate a unique group ID
function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Generate a unique invite ID
function generateInviteId(): string {
  return `invite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Create a new group
app.post("/make-server-8daf44f4/groups", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { name, description } = await c.req.json();
    
    if (!name || !name.trim()) {
      return c.json({ error: 'Group name is required' }, 400);
    }
    
    const groupId = generateGroupId();
    const groupData = {
      id: groupId,
      name: name.trim(),
      description: description?.trim() || '',
      adminId: user.id,
      createdAt: new Date().toISOString(),
      memberIds: [user.id]
    };
    
    await kv.set(`group:${groupId}`, groupData);
    
    // Add to user's groups list
    const userGroups = await kv.get(`user_groups:${user.id}`) || [];
    userGroups.push(groupId);
    await kv.set(`user_groups:${user.id}`, userGroups);
    
    return c.json({
      success: true,
      group: groupData
    });
  } catch (error) {
    console.log('Error creating group:', error);
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Get user's groups
app.get("/make-server-8daf44f4/groups", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userGroupIds = await kv.get(`user_groups:${user.id}`) || [];
    const groups = [];
    
    for (const groupId of userGroupIds) {
      const groupData = await kv.get(`group:${groupId}`);
      if (groupData) {
        groups.push({
          id: groupData.id,
          name: groupData.name,
          description: groupData.description,
          isAdmin: groupData.adminId === user.id,
          memberCount: groupData.memberIds?.length || 0
        });
      }
    }
    
    return c.json({ groups });
  } catch (error) {
    console.log('Error getting groups:', error);
    return c.json({ error: 'Failed to get groups' }, 500);
  }
});

// Get group details
app.get("/make-server-8daf44f4/groups/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is a member
    if (!groupData.memberIds?.includes(user.id)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get member details
    const members = [];
    for (const memberId of groupData.memberIds || []) {
      const memberData = await kv.get(`user:${memberId}`);
      if (memberData) {
        members.push({
          id: memberData.id,
          username: memberData.username,
          totalPoints: memberData.totalPoints || 0,
          isAdmin: memberId === groupData.adminId
        });
      }
    }
    
    return c.json({
      group: groupData,
      members,
      isAdmin: groupData.adminId === user.id
    });
  } catch (error) {
    console.log('Error getting group details:', error);
    return c.json({ error: 'Failed to get group details' }, 500);
  }
});

// Update group
app.put("/make-server-8daf44f4/groups/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (groupData.adminId !== user.id) {
      return c.json({ error: 'Only group admin can update group' }, 403);
    }
    
    const { name, description } = await c.req.json();
    
    const updatedGroup = {
      ...groupData,
      name: name?.trim() || groupData.name,
      description: description?.trim() || groupData.description,
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`group:${groupId}`, updatedGroup);
    
    return c.json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.log('Error updating group:', error);
    return c.json({ error: 'Failed to update group' }, 500);
  }
});

// Delete group
app.delete("/make-server-8daf44f4/groups/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (groupData.adminId !== user.id) {
      return c.json({ error: 'Only group admin can delete group' }, 403);
    }
    
    // Remove group from all members' group lists
    for (const memberId of groupData.memberIds || []) {
      const userGroups = await kv.get(`user_groups:${memberId}`) || [];
      const updatedGroups = userGroups.filter((id: string) => id !== groupId);
      await kv.set(`user_groups:${memberId}`, updatedGroups);
    }
    
    // Delete the group
    await kv.del(`group:${groupId}`);
    
    // Delete any pending invites for this group
    const allInvites = await kv.getByPrefix('invite:');
    for (const invite of allInvites) {
      if (invite.groupId === groupId) {
        await kv.del(`invite:${invite.id}`);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting group:', error);
    return c.json({ error: 'Failed to delete group' }, 500);
  }
});

// Invite user to group
app.post("/make-server-8daf44f4/groups/:id/invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const { username } = await c.req.json();
    
    if (!username || !username.trim()) {
      return c.json({ error: 'Username is required' }, 400);
    }
    
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (groupData.adminId !== user.id) {
      return c.json({ error: 'Only group admin can invite users' }, 403);
    }
    
    // Find user by username
    const inviteeId = await kv.get(`user_by_username:${username.trim()}`);
    
    if (!inviteeId) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if user is already a member
    if (groupData.memberIds?.includes(inviteeId)) {
      return c.json({ error: 'User is already a member' }, 400);
    }
    
    // Check if invite already exists
    const existingInvites = await kv.getByPrefix('invite:');
    const duplicateInvite = existingInvites.find(
      (inv: any) => inv.groupId === groupId && inv.inviteeId === inviteeId && inv.status === 'pending'
    );
    
    if (duplicateInvite) {
      return c.json({ error: 'Invite already sent' }, 400);
    }
    
    const inviteId = generateInviteId();
    const inviteData = {
      id: inviteId,
      groupId,
      groupName: groupData.name,
      inviterId: user.id,
      inviterUsername: (await kv.get(`user:${user.id}`))?.username || 'Unknown',
      inviteeId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`invite:${inviteId}`, inviteData);
    
    return c.json({
      success: true,
      invite: inviteData
    });
  } catch (error) {
    console.log('Error inviting user:', error);
    return c.json({ error: 'Failed to invite user' }, 500);
  }
});

// Get user's invites
app.get("/make-server-8daf44f4/invites", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const allInvites = await kv.getByPrefix('invite:');
    const userInvites = allInvites.filter(
      (invite: any) => invite.inviteeId === user.id && invite.status === 'pending'
    );
    
    return c.json({ invites: userInvites });
  } catch (error) {
    console.log('Error getting invites:', error);
    return c.json({ error: 'Failed to get invites' }, 500);
  }
});

// Accept invite
app.post("/make-server-8daf44f4/invites/:id/accept", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const inviteId = c.req.param('id');
    const inviteData = await kv.get(`invite:${inviteId}`);
    
    if (!inviteData) {
      return c.json({ error: 'Invite not found' }, 404);
    }
    
    if (inviteData.inviteeId !== user.id) {
      return c.json({ error: 'Not your invite' }, 403);
    }
    
    if (inviteData.status !== 'pending') {
      return c.json({ error: 'Invite already processed' }, 400);
    }
    
    const groupData = await kv.get(`group:${inviteData.groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Add user to group
    if (!groupData.memberIds) {
      groupData.memberIds = [];
    }
    if (!groupData.memberIds.includes(user.id)) {
      groupData.memberIds.push(user.id);
    }
    await kv.set(`group:${inviteData.groupId}`, groupData);
    
    // Add group to user's groups
    const userGroups = await kv.get(`user_groups:${user.id}`) || [];
    if (!userGroups.includes(inviteData.groupId)) {
      userGroups.push(inviteData.groupId);
    }
    await kv.set(`user_groups:${user.id}`, userGroups);
    
    // Update invite status
    inviteData.status = 'accepted';
    inviteData.respondedAt = new Date().toISOString();
    await kv.set(`invite:${inviteId}`, inviteData);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error accepting invite:', error);
    return c.json({ error: 'Failed to accept invite' }, 500);
  }
});

// Decline invite
app.post("/make-server-8daf44f4/invites/:id/decline", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const inviteId = c.req.param('id');
    const inviteData = await kv.get(`invite:${inviteId}`);
    
    if (!inviteData) {
      return c.json({ error: 'Invite not found' }, 404);
    }
    
    if (inviteData.inviteeId !== user.id) {
      return c.json({ error: 'Not your invite' }, 403);
    }
    
    if (inviteData.status !== 'pending') {
      return c.json({ error: 'Invite already processed' }, 400);
    }
    
    // Update invite status
    inviteData.status = 'declined';
    inviteData.respondedAt = new Date().toISOString();
    await kv.set(`invite:${inviteId}`, inviteData);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error declining invite:', error);
    return c.json({ error: 'Failed to decline invite' }, 500);
  }
});

// Remove member from group
app.delete("/make-server-8daf44f4/groups/:id/members/:memberId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const memberId = c.req.param('memberId');
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (groupData.adminId !== user.id) {
      return c.json({ error: 'Only group admin can remove members' }, 403);
    }
    
    // Can't remove admin
    if (memberId === groupData.adminId) {
      return c.json({ error: 'Cannot remove group admin' }, 400);
    }
    
    // Remove from group members
    groupData.memberIds = (groupData.memberIds || []).filter((id: string) => id !== memberId);
    await kv.set(`group:${groupId}`, groupData);
    
    // Remove from user's groups
    const userGroups = await kv.get(`user_groups:${memberId}`) || [];
    const updatedGroups = userGroups.filter((id: string) => id !== groupId);
    await kv.set(`user_groups:${memberId}`, updatedGroups);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Leave group
app.post("/make-server-8daf44f4/groups/:id/leave", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Admin can't leave (must delete group or transfer ownership)
    if (groupData.adminId === user.id) {
      return c.json({ error: 'Group admin must delete group to leave' }, 400);
    }
    
    // Remove from group members
    groupData.memberIds = (groupData.memberIds || []).filter((id: string) => id !== user.id);
    await kv.set(`group:${groupId}`, groupData);
    
    // Remove from user's groups
    const userGroups = await kv.get(`user_groups:${user.id}`) || [];
    const updatedGroups = userGroups.filter((id: string) => id !== groupId);
    await kv.set(`user_groups:${user.id}`, updatedGroups);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error leaving group:', error);
    return c.json({ error: 'Failed to leave group' }, 500);
  }
});

// Get group leaderboard
app.get("/make-server-8daf44f4/groups/:id/leaderboard", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('id');
    const period = c.req.query('period') || 'daily';
    
    const groupData = await kv.get(`group:${groupId}`);
    
    if (!groupData) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is a member
    if (!groupData.memberIds?.includes(user.id)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    const leaderboardData = [];
    
    for (const memberId of groupData.memberIds || []) {
      let memberData = await kv.get(`user:${memberId}`);
      if (!memberData) continue;
      
      // Reset period points if needed
      const resetResult = resetPeriodPoints(memberData);
      if (resetResult.updated) {
        memberData = resetResult.userData;
        await kv.set(`user:${memberId}`, memberData);
      }
      
      let periodPoints = 0;
      
      switch (period) {
        case 'daily':
          periodPoints = memberData.dayPoints || 0;
          break;
        case 'weekly':
          periodPoints = memberData.weekPoints || 0;
          break;
        case 'monthly':
          periodPoints = memberData.monthPoints || 0;
          break;
        case 'yearly':
          periodPoints = memberData.yearPoints || 0;
          break;
      }
      
      leaderboardData.push({
        userId: memberData.id,
        username: memberData.username,
        points: periodPoints
      });
    }
    
    // Sort by points descending
    leaderboardData.sort((a, b) => b.points - a.points);
    
    // Add ranks
    const rankedLeaderboard = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    return c.json({
      period,
      leaderboard: rankedLeaderboard
    });
  } catch (error) {
    console.log('Error getting group leaderboard:', error);
    return c.json({ error: 'Failed to get group leaderboard' }, 500);
  }
});

Deno.serve(app.fetch);