/**
 * AI Test Script for HLT App
 * This script tests all features of the Help, Learn, Thank application
 * Run with: deno run --allow-net test-ai.ts
 */

const API_BASE = 'https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiYWJyYW5td3pwcGV1eWN6dmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTQ1MzYsImV4cCI6MjA3Njk5MDUzNn0.EU0D0MXmlPTAws9bHoFuPF--QcA4IbWI1FDZC9vjmGY';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function log(message: string, type: 'info' | 'success' | 'error' | 'test' = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    error: '❌',
    test: '🧪'
  };
  console.log(`${icons[type]} ${message}`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    log(`PASS: ${message}`, 'success');
  } else {
    testsFailed++;
    log(`FAIL: ${message}`, 'error');
  }
}

async function apiCall(endpoint: string, options: any = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// Test data
const testUsername = `testuser_${Date.now()}`;
const testPassword = 'TestPassword123!';
let accessToken = '';
let userId = '';

// Test Suite
async function runTests() {
  console.log('\n🚀 Starting HLT App AI Test Suite\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Health Check
    log('\nTest 1: Health Check', 'test');
    const health = await apiCall('/health');
    assert(health.status === 200, 'Health endpoint returns 200');
    assert(health.data.status === 'ok', 'Health status is ok');
    assert(!!health.data.timestamp, 'Health response includes timestamp');
    
    // Test 2: Sign Up
    log('\nTest 2: User Sign Up', 'test');
    const signup = await apiCall('/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: testUsername,
        password: testPassword
      })
    });
    assert(signup.status === 200, 'Signup returns 200');
    assert(signup.data.success === true, 'Signup succeeds');
    assert(!!signup.data.userId, 'Signup returns userId');
    assert(signup.data.username === testUsername, 'Signup returns correct username');
    userId = signup.data.userId;
    
    // Test 3: Sign Up Duplicate User
    log('\nTest 3: Duplicate User Prevention', 'test');
    const duplicateSignup = await apiCall('/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: testUsername,
        password: testPassword
      })
    });
    assert(duplicateSignup.status === 400, 'Duplicate signup returns 400');
    assert(!!duplicateSignup.data.error, 'Duplicate signup returns error message');
    
    // Test 4: Sign In
    log('\nTest 4: User Sign In', 'test');
    const signin = await apiCall('/signin', {
      method: 'POST',
      body: JSON.stringify({
        username: testUsername,
        password: testPassword
      })
    });
    assert(signin.status === 200, 'Signin returns 200');
    assert(signin.data.success === true, 'Signin succeeds');
    assert(!!signin.data.accessToken, 'Signin returns access token');
    assert(!!signin.data.user, 'Signin returns user data');
    accessToken = signin.data.accessToken;
    
    // Test 5: Invalid Sign In
    log('\nTest 5: Invalid Credentials', 'test');
    const invalidSignin = await apiCall('/signin', {
      method: 'POST',
      body: JSON.stringify({
        username: testUsername,
        password: 'WrongPassword'
      })
    });
    assert(invalidSignin.status === 401, 'Invalid signin returns 401');
    assert(!!invalidSignin.data.error, 'Invalid signin returns error message');
    
    // Test 6: Session Validation
    log('\nTest 6: Session Validation', 'test');
    const session = await apiCall('/session', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    assert(session.status === 200, 'Session endpoint returns 200');
    assert(!!session.data.user, 'Session returns user data');
    assert(session.data.user.username === testUsername, 'Session returns correct user');
    
    // Test 7: Check-in Status (Before Check-in)
    log('\nTest 7: Check-in Status - Not Checked In', 'test');
    const statusBefore = await apiCall('/checkin-status', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    assert(statusBefore.status === 200, 'Check-in status returns 200');
    assert(statusBefore.data.hasCheckedIn === false, 'User has not checked in yet');
    assert(statusBefore.data.checkin === null, 'No check-in data exists');
    
    // Test 8: Submit Daily Check-in (All Three)
    log('\nTest 8: Submit Daily Check-in - All Three', 'test');
    const checkin1 = await apiCall('/checkin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        help: 'Helped my colleague with code review',
        learn: 'Learned about Deno and Supabase Edge Functions',
        thank: 'Thanked my team lead for guidance'
      })
    });
    assert(checkin1.status === 200, 'Check-in returns 200');
    assert(checkin1.data.success === true, 'Check-in succeeds');
    assert(checkin1.data.points === 3, 'Check-in awards 3 points for all three answers');
    assert(!!checkin1.data.checkin, 'Check-in returns checkin data');
    
    // Test 9: Check-in Status (After Check-in)
    log('\nTest 9: Check-in Status - Already Checked In', 'test');
    const statusAfter = await apiCall('/checkin-status', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    assert(statusAfter.status === 200, 'Check-in status returns 200');
    assert(statusAfter.data.hasCheckedIn === true, 'User has checked in');
    assert(!!statusAfter.data.checkin, 'Check-in data exists');
    assert(statusAfter.data.checkin.points === 3, 'Check-in has 3 points');
    
    // Test 10: Duplicate Check-in Prevention
    log('\nTest 10: Duplicate Check-in Prevention', 'test');
    const duplicateCheckin = await apiCall('/checkin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        help: 'Another help',
        learn: 'Another learn',
        thank: 'Another thank'
      })
    });
    assert(duplicateCheckin.status === 400, 'Duplicate check-in returns 400');
    assert(!!duplicateCheckin.data.error, 'Duplicate check-in returns error message');
    
    // Test 11: Edit Daily Check-in
    log('\nTest 11: Edit Daily Check-in', 'test');
    const editCheckin = await apiCall('/checkin', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        help: 'Updated: Helped with debugging',
        learn: null, // Unchecked learn
        thank: 'Updated: Thanked the entire team'
      })
    });
    assert(editCheckin.status === 200, 'Edit check-in returns 200');
    assert(editCheckin.data.success === true, 'Edit succeeds');
    assert(editCheckin.data.points === 2, 'Edited check-in has 2 points (removed learn)');
    assert(!!editCheckin.data.checkin, 'Edit returns updated checkin data');
    
    // Test 12: View Profile
    log('\nTest 12: View Profile', 'test');
    const profile = await apiCall('/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    assert(profile.status === 200, 'Profile endpoint returns 200');
    assert(!!profile.data.user, 'Profile returns user data');
    assert(!!profile.data.stats, 'Profile returns stats');
    assert(profile.data.stats.totalPoints === 2, 'Profile shows correct total points (2 after edit)');
    assert(profile.data.stats.totalCheckins === 1, 'Profile shows 1 check-in');
    
    // Test 13: View Leaderboard - Daily
    log('\nTest 13: View Leaderboard - Daily', 'test');
    const leaderboardDaily = await apiCall('/leaderboard?period=daily');
    assert(leaderboardDaily.status === 200, 'Leaderboard returns 200');
    assert(leaderboardDaily.data.period === 'daily', 'Leaderboard returns daily period');
    assert(Array.isArray(leaderboardDaily.data.leaderboard), 'Leaderboard returns array');
    const userOnLeaderboard = leaderboardDaily.data.leaderboard.find((u: any) => u.username === testUsername);
    assert(!!userOnLeaderboard, 'User appears on leaderboard');
    assert(userOnLeaderboard.points === 2, 'User has correct points on leaderboard');
    
    // Test 14: View Leaderboard - Weekly
    log('\nTest 14: View Leaderboard - Weekly', 'test');
    const leaderboardWeekly = await apiCall('/leaderboard?period=weekly');
    assert(leaderboardWeekly.status === 200, 'Weekly leaderboard returns 200');
    assert(leaderboardWeekly.data.period === 'weekly', 'Leaderboard returns weekly period');
    
    // Test 15: View Leaderboard - Monthly
    log('\nTest 15: View Leaderboard - Monthly', 'test');
    const leaderboardMonthly = await apiCall('/leaderboard?period=monthly');
    assert(leaderboardMonthly.status === 200, 'Monthly leaderboard returns 200');
    assert(leaderboardMonthly.data.period === 'monthly', 'Leaderboard returns monthly period');
    
    // Test 16: View Leaderboard - Yearly
    log('\nTest 16: View Leaderboard - Yearly', 'test');
    const leaderboardYearly = await apiCall('/leaderboard?period=yearly');
    assert(leaderboardYearly.status === 200, 'Yearly leaderboard returns 200');
    assert(leaderboardYearly.data.period === 'yearly', 'Leaderboard returns yearly period');
    
    // Test 17: Unauthorized Access
    log('\nTest 17: Unauthorized Access Protection', 'test');
    const unauthorizedCheckin = await apiCall('/checkin-status');
    assert(unauthorizedCheckin.status === 401, 'Endpoint requires authorization');
    
    // Test 18: Invalid Token
    log('\nTest 18: Invalid Token Protection', 'test');
    const invalidToken = await apiCall('/profile', {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    assert(invalidToken.status === 401, 'Invalid token returns 401');
    
    // Test 19: Session with Invalid Token
    log('\nTest 19: Session with Invalid Token', 'test');
    const invalidSession = await apiCall('/session', {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });
    assert(invalidSession.status === 200, 'Session endpoint returns 200 for invalid token');
    assert(invalidSession.data.user === null, 'Session returns null user for invalid token');
    
    // Test 20: Partial Check-in (Only 1 Answer)
    log('\nTest 20: Partial Check-in Test', 'test');
    const testUser2 = `testuser2_${Date.now()}`;
    const signup2 = await apiCall('/signup', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser2,
        password: testPassword
      })
    });
    const signin2 = await apiCall('/signin', {
      method: 'POST',
      body: JSON.stringify({
        username: testUser2,
        password: testPassword
      })
    });
    const token2 = signin2.data.accessToken;
    
    const partialCheckin = await apiCall('/checkin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token2}`
      },
      body: JSON.stringify({
        help: 'Only answered help',
        learn: null,
        thank: null
      })
    });
    assert(partialCheckin.status === 200, 'Partial check-in succeeds');
    assert(partialCheckin.data.points === 1, 'Partial check-in awards 1 point');
    
  } catch (error) {
    log(`Unexpected error during tests: ${error}`, 'error');
    testsFailed++;
  }
  
  // Print Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! The HLT app is working perfectly!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }
}

// Run the tests
runTests();
