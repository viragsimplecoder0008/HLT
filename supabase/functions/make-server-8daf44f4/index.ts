import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

app.use('*', logger(console.log));

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

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateRanges() {
  const now = new Date();
  const today = formatDate(now);
  
  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  const weekStartStr = formatDate(weekStart);
  
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = formatDate(monthStart);
  
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearStartStr = formatDate(yearStart);
  
  return { today, weekStartStr, monthStartStr, yearStartStr };
}

function resetPeriodPoints(userData: any) {
  const { today, weekStartStr, monthStartStr, yearStartStr } = getDateRanges();
  let updated = false;
  
  if (userData.lastResetDay !== today) {
    userData.dayPoints = 0;
    userData.lastResetDay = today;
    updated = true;
  }
  
  if (userData.lastResetWeek !== weekStartStr) {
    userData.weekPoints = 0;
    userData.lastResetWeek = weekStartStr;
    updated = true;
  }
  
  if (userData.lastResetMonth !== monthStartStr) {
    userData.monthPoints = 0;
    userData.lastResetMonth = monthStartStr;
    updated = true;
  }
  
  if (userData.lastResetYear !== yearStartStr) {
    userData.yearPoints = 0;
    userData.lastResetYear = yearStartStr;
    updated = true;
  }
  
  return { userData, updated };
}

app.get("/make-server-8daf44f4/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.options("/make-server-8daf44f4/*", (c) => {
  return c.json({ ok: true });
});

app.post("/make-server-8daf44f4/signup", async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }
    
    const existingUsers = await kv.getByPrefix(`user_by_username:${username}`);
    if (existingUsers && existingUsers.length > 0) {
      return c.json({ error: 'Username already exists' }, 400);
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username}@hlt.app`,
      password: password,
      user_metadata: { username },
      email_confirm: true
    });
    
    if (error) {
      console.log('Supabase auth error during signup:', error);
      return c.json({ error: error.message }, 400);
    }
    
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

app.post("/make-server-8daf44f4/signin", async (c) => {
  try {
    const { username, password } = await c.req.json();
    
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
    
    const userData = await kv.get(`user:${data.user.id}`);
    
    return c.json({
      success: true,
      accessToken: data.session.access_token,
      user: userData
    });
  } catch (error) {
    console.log('Error during signin:', error);
    return c.json({ error: 'Signin failed' }, 500);
  }
});

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

app.post("/make-server-8daf44f4/checkin", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { help, learn, thank } = await c.req.json();
    const today = formatDate(new Date());
    
    const existingCheckin = await kv.get(`checkin:${user.id}:${today}`);
    if (existingCheckin) {
      return c.json({ error: 'You have already checked in today' }, 400);
    }
    
    let points = 0;
    if (help && help !== '') points++;
    if (learn && learn !== '') points++;
    if (thank && thank !== '') points++;
    
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
    
    let userData = await kv.get(`user:${user.id}`);
    
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

app.get("/make-server-8daf44f4/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    let userData = await kv.get(`user:${user.id}`);
    
    const resetResult = resetPeriodPoints(userData);
    if (resetResult.updated) {
      userData = resetResult.userData;
      await kv.set(`user:${user.id}`, userData);
    }
    
    const allCheckins = await kv.getByPrefix(`checkin:${user.id}:`);
    
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

app.get("/make-server-8daf44f4/leaderboard", async (c) => {
  try {
    const period = c.req.query('period') || 'daily';
    
    const allUsers = await kv.getByPrefix('user:');
    
    let leaderboardData = [];
    
    for (let userData of allUsers) {
      if (!userData.id) continue;
      
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
    
    leaderboardData.sort((a, b) => b.points - a.points);
    
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

app.put("/make-server-8daf44f4/checkin", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const user = await getCurrentUser(accessToken);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { help, learn, thank } = await c.req.json();
    const today = formatDate(new Date());
    
    const existingCheckin = await kv.get(`checkin:${user.id}:${today}`);
    if (!existingCheckin) {
      return c.json({ error: 'No check-in found for today' }, 400);
    }
    
    const oldPoints = existingCheckin.points || 0;
    
    let newPoints = 0;
    if (help && help !== '') newPoints++;
    if (learn && learn !== '') newPoints++;
    if (thank && thank !== '') newPoints++;
    
    const pointsDiff = newPoints - oldPoints;
    
    const updatedCheckinData = {
      ...existingCheckin,
      help: help || null,
      learn: learn || null,
      thank: thank || null,
      points: newPoints,
      lastUpdated: new Date().toISOString()
    };
    
    await kv.set(`checkin:${user.id}:${today}`, updatedCheckinData);
    
    if (pointsDiff !== 0) {
      let userData = await kv.get(`user:${user.id}`);
      
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

Deno.serve(app.fetch);
