import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

// Superadmin configuration
const SUPERADMIN_IDS = ['viraj@hlt.app', 'admin@hlt.app']; // Multiple superadmin IDs

// Initialize superadmin on startup
async function initializeSuperAdmin() {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    for (const email of SUPERADMIN_IDS) {
      const username = email.split('@')[0];
      
      // Check if superadmin already exists
      const existingUserId = await kv.get(`user_by_username:${username}`);
      if (existingUserId) {
        console.log(`SuperAdmin ${username} already exists`);
        continue;
      }
      
      // Create superadmin auth user
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'SuperAdmin123!', // Default password - should be changed
        user_metadata: { username },
        email_confirm: true
      });
      
      if (error) {
        console.log(`Error creating superadmin ${username}:`, error);
        continue;
      }
      
      // Store superadmin data with special role
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
        lastResetYear: today,
        roles: ['user', 'superadmin'], // Multiple roles
        isSuperAdmin: true
      });
      
      await kv.set(`user_by_username:${username}`, data.user.id);
      console.log(`SuperAdmin ${username} initialized successfully`);
    }
  } catch (error) {
    console.error('Error initializing superadmin:', error);
  }
}

// Initialize superadmin on server start
initializeSuperAdmin();

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
    
    // Check if user has multiple roles
    const availableRoles = userData?.roles || ['user'];
    
    // If role is specified, validate it
    let selectedRole = role || 'user';
    if (role && !availableRoles.includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    // If user has multiple roles and no role specified, return role selection needed
    if (availableRoles.length > 1 && !role) {
      return c.json({
        success: true,
        needsRoleSelection: true,
        availableRoles,
        accessToken: data.session.access_token,
        user: userData
      });
    }
    
    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: userData,
      selectedRole
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

// Create a group
app.post("/make-server-8daf44f4/groups", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { name, description } = await c.req.json();
    
    if (!name) {
      return c.json({ error: 'Group name is required' }, 400);
    }
    
    const groupId = crypto.randomUUID();
    const groupData = {
      id: groupId,
      name,
      description: description || '',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      admins: [user.id],
      members: [user.id],
      bannedUsers: []
    };
    
    await kv.set(`group:${groupId}`, groupData);
    await kv.set(`user_groups:${user.id}:${groupId}`, groupId);
    
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
    
    const userGroupIds = await kv.getByPrefix(`user_groups:${user.id}:`);
    const groups = [];
    
    for (const groupId of userGroupIds) {
      const group = await kv.get(`group:${groupId}`);
      if (group) {
        groups.push(group);
      }
    }
    
    return c.json({ groups });
  } catch (error) {
    console.log('Error getting groups:', error);
    return c.json({ error: 'Failed to get groups' }, 500);
  }
});

// Get group details
app.get("/make-server-8daf44f4/groups/:groupId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is a member
    if (!group.members.includes(user.id)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    // Get member details
    const memberDetails = [];
    for (const memberId of group.members) {
      const memberData = await kv.get(`user:${memberId}`);
      if (memberData) {
        memberDetails.push({
          id: memberId,
          username: memberData.username,
          totalPoints: memberData.totalPoints || 0
        });
      }
    }
    
    return c.json({
      group,
      members: memberDetails,
      isAdmin: group.admins.includes(user.id)
    });
  } catch (error) {
    console.log('Error getting group details:', error);
    return c.json({ error: 'Failed to get group details' }, 500);
  }
});

// Invite user to group
app.post("/make-server-8daf44f4/groups/:groupId/invite", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const { username } = await c.req.json();
    
    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }
    
    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (!group.admins.includes(user.id)) {
      return c.json({ error: 'Only admins can invite users' }, 403);
    }
    
    // Find invited user
    const invitedUserId = await kv.get(`user_by_username:${username}`);
    if (!invitedUserId) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if user is already a member
    if (group.members.includes(invitedUserId)) {
      return c.json({ error: 'User is already a member' }, 400);
    }
    
    // Check if user is banned
    if (group.bannedUsers.includes(invitedUserId)) {
      return c.json({ error: 'User is banned from this group' }, 400);
    }
    
    // Check if invite already exists
    const existingInvite = await kv.get(`invite:${groupId}:${invitedUserId}`);
    if (existingInvite && existingInvite.status === 'pending') {
      return c.json({ error: 'Invite already sent' }, 400);
    }
    
    const inviteData = {
      id: crypto.randomUUID(),
      groupId,
      groupName: group.name,
      invitedBy: user.id,
      invitedByUsername: (await kv.get(`user:${user.id}`)).username,
      invitedUserId,
      invitedUsername: username,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`invite:${groupId}:${invitedUserId}`, inviteData);
    await kv.set(`user_invites:${invitedUserId}:${inviteData.id}`, inviteData);
    
    return c.json({
      success: true,
      invite: inviteData
    });
  } catch (error) {
    console.log('Error inviting user:', error);
    return c.json({ error: 'Failed to invite user' }, 500);
  }
});

// Get user's pending invites
app.get("/make-server-8daf44f4/invites", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const invites = await kv.getByPrefix(`user_invites:${user.id}:`);
    const pendingInvites = invites.filter((invite: any) => invite.status === 'pending');
    
    return c.json({ invites: pendingInvites });
  } catch (error) {
    console.log('Error getting invites:', error);
    return c.json({ error: 'Failed to get invites' }, 500);
  }
});

// Accept/reject invite
app.post("/make-server-8daf44f4/invites/:inviteId/respond", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const inviteId = c.req.param('inviteId');
    const { action } = await c.req.json(); // 'accept' or 'reject'
    
    const invite = await kv.get(`user_invites:${user.id}:${inviteId}`);
    if (!invite) {
      return c.json({ error: 'Invite not found' }, 404);
    }
    
    if (invite.status !== 'pending') {
      return c.json({ error: 'Invite already responded to' }, 400);
    }
    
    if (action === 'accept') {
      const group = await kv.get(`group:${invite.groupId}`);
      if (!group) {
        return c.json({ error: 'Group not found' }, 404);
      }
      
      // Add user to group
      group.members.push(user.id);
      await kv.set(`group:${invite.groupId}`, group);
      await kv.set(`user_groups:${user.id}:${invite.groupId}`, invite.groupId);
      
      invite.status = 'accepted';
    } else if (action === 'reject') {
      invite.status = 'rejected';
    } else {
      return c.json({ error: 'Invalid action' }, 400);
    }
    
    await kv.set(`user_invites:${user.id}:${inviteId}`, invite);
    await kv.set(`invite:${invite.groupId}:${user.id}`, invite);
    
    return c.json({
      success: true,
      invite
    });
  } catch (error) {
    console.log('Error responding to invite:', error);
    return c.json({ error: 'Failed to respond to invite' }, 500);
  }
});

// Remove member from group (admin only)
app.delete("/make-server-8daf44f4/groups/:groupId/members/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const userIdToRemove = c.req.param('userId');
    
    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (!group.admins.includes(user.id)) {
      return c.json({ error: 'Only admins can remove members' }, 403);
    }
    
    // Can't remove the creator
    if (userIdToRemove === group.createdBy) {
      return c.json({ error: 'Cannot remove group creator' }, 400);
    }
    
    // Remove from members
    group.members = group.members.filter((id: string) => id !== userIdToRemove);
    group.admins = group.admins.filter((id: string) => id !== userIdToRemove);
    
    await kv.set(`group:${groupId}`, group);
    await kv.del(`user_groups:${userIdToRemove}:${groupId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error removing member:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Ban user from group (admin only)
app.post("/make-server-8daf44f4/groups/:groupId/ban/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const userIdToBan = c.req.param('userId');
    
    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (!group.admins.includes(user.id)) {
      return c.json({ error: 'Only admins can ban users' }, 403);
    }
    
    // Can't ban the creator
    if (userIdToBan === group.createdBy) {
      return c.json({ error: 'Cannot ban group creator' }, 400);
    }
    
    // Remove from members and add to banned
    group.members = group.members.filter((id: string) => id !== userIdToBan);
    group.admins = group.admins.filter((id: string) => id !== userIdToBan);
    
    if (!group.bannedUsers.includes(userIdToBan)) {
      group.bannedUsers.push(userIdToBan);
    }
    
    await kv.set(`group:${groupId}`, group);
    await kv.del(`user_groups:${userIdToBan}:${groupId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error banning user:', error);
    return c.json({ error: 'Failed to ban user' }, 500);
  }
});

// Unban user from group (admin only)
app.post("/make-server-8daf44f4/groups/:groupId/unban/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const userIdToUnban = c.req.param('userId');
    
    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (!group.admins.includes(user.id)) {
      return c.json({ error: 'Only admins can unban users' }, 403);
    }
    
    group.bannedUsers = group.bannedUsers.filter((id: string) => id !== userIdToUnban);
    await kv.set(`group:${groupId}`, group);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error unbanning user:', error);
    return c.json({ error: 'Failed to unban user' }, 500);
  }
});

// Update group metadata (admin only)
app.put("/make-server-8daf44f4/groups/:groupId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const { name, description } = await c.req.json();
    
    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is admin
    if (!group.admins.includes(user.id)) {
      return c.json({ error: 'Only admins can edit group' }, 403);
    }
    
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    
    await kv.set(`group:${groupId}`, group);
    
    return c.json({
      success: true,
      group
    });
  } catch (error) {
    console.log('Error updating group:', error);
    return c.json({ error: 'Failed to update group' }, 500);
  }
});

// Get group leaderboard
app.get("/make-server-8daf44f4/groups/:groupId/leaderboard", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const groupId = c.req.param('groupId');
    const period = c.req.query('period') || 'daily';
    
    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Check if user is a member
    if (!group.members.includes(user.id)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }
    
    const leaderboardData = [];
    
    for (const memberId of group.members) {
      const userData = await kv.get(`user:${memberId}`);
      if (!userData) continue;
      
      // Reset period points if needed
      const resetResult = resetPeriodPoints(userData);
      if (resetResult.updated) {
        await kv.set(`user:${memberId}`, resetResult.userData);
      }
      
      let periodPoints = 0;
      switch (period) {
        case 'daily':
          periodPoints = resetResult.userData.dayPoints || 0;
          break;
        case 'weekly':
          periodPoints = resetResult.userData.weekPoints || 0;
          break;
        case 'monthly':
          periodPoints = resetResult.userData.monthPoints || 0;
          break;
        case 'yearly':
          periodPoints = resetResult.userData.yearPoints || 0;
          break;
      }
      
      leaderboardData.push({
        userId: memberId,
        username: userData.username,
        points: periodPoints
      });
    }
    
    // Sort by points
    leaderboardData.sort((a, b) => b.points - a.points);
    
    // Add ranks
    const rankedData = leaderboardData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    return c.json({
      period,
      leaderboard: rankedData
    });
  } catch (error) {
    console.log('Error getting group leaderboard:', error);
    return c.json({ error: 'Failed to get group leaderboard' }, 500);
  }
});

// Helper function to check if user is superadmin
async function isSuperAdmin(userId: string): Promise<boolean> {
  const userData = await kv.get(`user:${userId}`);
  return userData?.isSuperAdmin === true;
}

// ========== SUPERADMIN ENDPOINTS ==========

// Get unified leaderboard (SuperAdmin only)
app.get("/make-server-8daf44f4/superadmin/unified-leaderboard", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    // Get all users
    const allUserIds = await kv.getByPrefix('user:');
    const unifiedData = [];
    
    for (const userId of allUserIds) {
      const userData = await kv.get(`user:${userId}`);
      if (!userData) continue;
      
      // Reset period points if needed
      const resetResult = resetPeriodPoints(userData);
      if (resetResult.updated) {
        await kv.set(`user:${userId}`, resetResult.userData);
      }
      
      // Get user's groups
      const userGroupIds = await kv.getByPrefix(`user_groups:${userId}:`);
      
      if (userGroupIds.length === 0) {
        // User not in any group
        unifiedData.push({
          username: userData.username,
          groupName: 'No Group',
          points: resetResult.userData.totalPoints || 0,
          dayPoints: resetResult.userData.dayPoints || 0,
          weekPoints: resetResult.userData.weekPoints || 0,
          monthPoints: resetResult.userData.monthPoints || 0,
          yearPoints: resetResult.userData.yearPoints || 0,
        });
      } else {
        // User in groups
        for (const groupId of userGroupIds) {
          const group = await kv.get(`group:${groupId}`);
          unifiedData.push({
            username: userData.username,
            groupName: group?.name || 'Unknown Group',
            points: resetResult.userData.totalPoints || 0,
            dayPoints: resetResult.userData.dayPoints || 0,
            weekPoints: resetResult.userData.weekPoints || 0,
            monthPoints: resetResult.userData.monthPoints || 0,
            yearPoints: resetResult.userData.yearPoints || 0,
          });
        }
      }
    }
    
    // Sort by total points descending
    unifiedData.sort((a, b) => b.points - a.points);
    
    return c.json({ 
      leaderboard: unifiedData,
      totalUsers: allUserIds.length,
      totalEntries: unifiedData.length
    });
  } catch (error) {
    console.log('Error getting unified leaderboard:', error);
    return c.json({ error: 'Failed to get unified leaderboard' }, 500);
  }
});

// Get all users (SuperAdmin only)
app.get("/make-server-8daf44f4/superadmin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    const allUserIds = await kv.getByPrefix('user:');
    const users = [];
    
    for (const userId of allUserIds) {
      const userData = await kv.get(`user:${userId}`);
      if (userData) {
        users.push(userData);
      }
    }
    
    return c.json({ users });
  } catch (error) {
    console.log('Error getting users:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Get all groups (SuperAdmin only)
app.get("/make-server-8daf44f4/superadmin/groups", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    const allGroupIds = await kv.getByPrefix('group:');
    const groups = [];
    
    for (const groupId of allGroupIds) {
      const groupData = await kv.get(`group:${groupId}`);
      if (groupData) {
        groups.push(groupData);
      }
    }
    
    return c.json({ groups });
  } catch (error) {
    console.log('Error getting groups:', error);
    return c.json({ error: 'Failed to get groups' }, 500);
  }
});

// Delete user (SuperAdmin only)
app.delete("/make-server-8daf44f4/superadmin/users/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    const userIdToDelete = c.req.param('userId');
    
    // Prevent deleting superadmins
    const targetUser = await kv.get(`user:${userIdToDelete}`);
    if (targetUser?.isSuperAdmin) {
      return c.json({ error: 'Cannot delete superadmin users' }, 403);
    }
    
    // Delete user data
    await kv.del(`user:${userIdToDelete}`);
    
    // Delete username mapping
    if (targetUser?.username) {
      await kv.del(`user_by_username:${targetUser.username}`);
    }
    
    // Remove from groups
    const userGroupIds = await kv.getByPrefix(`user_groups:${userIdToDelete}:`);
    for (const groupId of userGroupIds) {
      const group = await kv.get(`group:${groupId}`);
      if (group) {
        group.members = group.members.filter((id: string) => id !== userIdToDelete);
        group.admins = group.admins.filter((id: string) => id !== userIdToDelete);
        await kv.set(`group:${groupId}`, group);
      }
      await kv.del(`user_groups:${userIdToDelete}:${groupId}`);
    }
    
    // Delete from Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    await supabase.auth.admin.deleteUser(userIdToDelete);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Delete group (SuperAdmin only)
app.delete("/make-server-8daf44f4/superadmin/groups/:groupId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }
    
    // Remove group from all members
    for (const memberId of group.members) {
      await kv.del(`user_groups:${memberId}:${groupId}`);
    }
    
    // Delete all invites for this group
    const allInvites = await kv.getByPrefix(`invite:${groupId}:`);
    for (const invite of allInvites) {
      if (invite.invitedUserId) {
        await kv.del(`user_invites:${invite.invitedUserId}:${invite.id}`);
      }
    }
    
    // Delete group
    await kv.del(`group:${groupId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting group:', error);
    return c.json({ error: 'Failed to delete group' }, 500);
  }
});

// Update user (SuperAdmin only)
app.put("/make-server-8daf44f4/superadmin/users/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    const userId = c.req.param('userId');
    const updates = await c.req.json();
    
    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Prevent modifying superadmin status
    if (userData.isSuperAdmin && !updates.isSuperAdmin) {
      return c.json({ error: 'Cannot remove superadmin status' }, 403);
    }
    
    // Update user data
    const updatedUser = {
      ...userData,
      ...updates,
      id: userId, // Prevent ID change
    };
    
    await kv.set(`user:${userId}`, updatedUser);
    
    return c.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.log('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Get all check-ins (SuperAdmin only)
app.get("/make-server-8daf44f4/superadmin/checkins", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const isAdmin = await isSuperAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - SuperAdmin access required' }, 403);
    }
    
    const allCheckins = await kv.getByPrefix('checkin:');
    const checkins = [];
    
    for (const checkin of allCheckins) {
      const userData = await kv.get(`user:${checkin.userId}`);
      checkins.push({
        ...checkin,
        username: userData?.username || 'Unknown'
      });
    }
    
    return c.json({ checkins });
  } catch (error) {
    console.log('Error getting checkins:', error);
    return c.json({ error: 'Failed to get checkins' }, 500);
  }
});

Deno.serve(app.fetch);
