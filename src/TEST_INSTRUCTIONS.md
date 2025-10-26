# HLT App - AI Testing Guide

## 🧪 Running the AI Test Suite

The AI test script (`test-ai.ts`) comprehensively tests all features of the HLT application.

### Prerequisites

You need [Deno](https://deno.land/) installed to run the tests.

Install Deno:
```bash
# macOS/Linux
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

### Running the Tests

From the project root directory, run:

```bash
deno run --allow-net test-ai.ts
```

### What the Tests Cover

The AI test suite validates **20 comprehensive test cases**:

#### Authentication Tests
1. ✅ Health Check - Verifies Edge Function is running
2. ✅ User Sign Up - Creates a new test user
3. ✅ Duplicate User Prevention - Ensures usernames are unique
4. ✅ User Sign In - Tests login functionality
5. ✅ Invalid Credentials - Tests error handling for wrong passwords
6. ✅ Session Validation - Verifies token-based authentication

#### Check-in Tests
7. ✅ Check-in Status (Before) - Confirms no check-in exists initially
8. ✅ Submit Daily Check-in - Tests full check-in with all three answers
9. ✅ Check-in Status (After) - Confirms check-in was saved
10. ✅ Duplicate Check-in Prevention - Ensures one check-in per day
11. ✅ Edit Daily Check-in - Tests editing functionality
12. ✅ Partial Check-in - Tests check-in with only one answer

#### Profile & Leaderboard Tests
13. ✅ View Profile - Tests profile endpoint and stats calculation
14. ✅ View Leaderboard (Daily) - Tests daily leaderboard
15. ✅ View Leaderboard (Weekly) - Tests weekly leaderboard
16. ✅ View Leaderboard (Monthly) - Tests monthly leaderboard
17. ✅ View Leaderboard (Yearly) - Tests yearly leaderboard

#### Security Tests
18. ✅ Unauthorized Access - Tests protected endpoints without token
19. ✅ Invalid Token - Tests with malformed authentication
20. ✅ Session with Invalid Token - Tests session handling for invalid tokens

### Expected Output

```
🚀 Starting HLT App AI Test Suite

==================================================
🧪 Test 1: Health Check
✅ PASS: Health endpoint returns 200
✅ PASS: Health status is ok
✅ PASS: Health response includes timestamp

🧪 Test 2: User Sign Up
✅ PASS: Signup returns 200
✅ PASS: Signup succeeds
...

==================================================

📊 Test Summary:
✅ Passed: 47
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 All tests passed! The HLT app is working perfectly!
```

### Troubleshooting

If tests fail:

1. **Check Edge Function is deployed:**
   ```bash
   supabase functions deploy make-server-8daf44f4
   ```

2. **Verify backend health:**
   ```bash
   curl https://hbabranmwzppeuyczvlv.supabase.co/functions/v1/make-server-8daf44f4/health
   ```

3. **Check Edge Function logs:**
   ```bash
   supabase functions logs make-server-8daf44f4
   ```

### Test Data Cleanup

The test script creates temporary users with usernames like `testuser_1234567890`. These users are automatically stored in your Supabase database. If you want to clean them up later, you can do so through the Supabase dashboard.

---

## 🚀 Manual Testing

You can also manually test the app at: https://help-learn-thank.netlify.app

1. Sign up with a new username
2. Answer the daily questions
3. Check the leaderboard
4. View your profile and stats
5. Edit your daily entry
6. Sign out and sign back in

Enjoy testing! 🎉
