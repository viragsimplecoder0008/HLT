# 🚀 HLT App - Quick Start Guide

## 1️⃣ Deploy Backend (REQUIRED)

```bash
# Step 1: Login
supabase login

# Step 2: Deploy
supabase functions deploy make-server-8daf44f4 --project-ref hbabranmwzppeuyzczvlv
```

## 2️⃣ Verify Deployment

```bash
# Should return: {"status":"ok","timestamp":"..."}
curl https://hbabranmwzppeuyzczvlv.supabase.co/functions/v1/make-server-8daf44f4/health
```

## 3️⃣ Test the App

Visit: **https://hlt.onrender.com**

### Create Account
- Username: `testuser`
- Password: `yourpassword`
- Click "Sign Up"

### Complete Daily Check-In
1. Answer "Did you help somebody?" → Get 1 point
2. Answer "Did you learn something?" → Get 1 point  
3. Answer "Did you thank somebody?" → Get 1 point
4. See confetti! 🎉

### Create a Group
1. Click "Groups" tab
2. Click "Create Group"
3. Enter name and description
4. Invite members by username

### SuperAdmin Access
- Username: `Viraj`
- Password: `[SUPERADMIN_PASSWORD]`
- Select "SuperAdmin" role on login

---

## 📚 Full Documentation

- **Deployment:** See `/DEPLOYMENT.md`
- **Features:** See `/COMPLETE_FEATURE_SUMMARY.md`
- **Verification:** See `/FINAL_VERIFICATION.md`
- **Status:** See `/DEPLOYMENT_STATUS.md`

---

## 🐛 Common Issues

### "Backend not available"
→ Deploy the function using command above

### "404 on /groups"
→ Redeploy the function (routes were just fixed)

### "CORS error"
→ Function includes CORS headers, just redeploy

---

## ✅ Success Checklist

- [ ] Backend deployed
- [ ] Health check passes
- [ ] Can create account
- [ ] Can complete check-in
- [ ] Can create group
- [ ] Can see leaderboards
- [ ] SuperAdmin login works

---

**Ready to go! 🎉**
