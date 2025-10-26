# HLT App - Deployment Guide

## Backend Deployment (Supabase Edge Functions)

The app requires a Supabase Edge Function to be deployed. Follow these steps:

### Prerequisites
- Supabase CLI installed ([Installation Guide](https://supabase.com/docs/guides/cli/getting-started))
- Supabase project created (project ID: `hbabranmwzppeuyzczvlv`)
- You must be added as a member/owner to the Supabase project

### Deploy the Edge Function

1. **Login to Supabase CLI:**
   ```bash
   supabase login
   ```

2. **Link your project:**
   ```bash
   supabase link --project-ref hbabranmwzppeuyzczvlv
   ```

3. **Deploy the server function:**
   ```bash
   supabase functions deploy make-server-8daf44f4
   ```

4. **Verify deployment:**
   ```bash
   curl https://hbabranmwzppeuyzczvlv.supabase.co/functions/v1/make-server-8daf44f4/health
   ```
   
   You should see: `{"status":"ok","timestamp":"..."}`

### Environment Variables

The edge function uses these environment variables (automatically set by Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### Troubleshooting CORS Errors

If you see CORS errors:

1. **Verify the function is deployed:**
   ```bash
   supabase functions list
   ```

2. **Check function logs:**
   ```bash
   supabase functions logs make-server-8daf44f4
   ```

3. **Redeploy if needed:**
   ```bash
   supabase functions deploy make-server-8daf44f4 --no-verify-jwt
   ```

### Testing After Deployment

Once deployed, test the endpoints:

- **Health Check:** `GET /make-server-8daf44f4/health`
- **Sign Up:** `POST /make-server-8daf44f4/signup`
- **Sign In:** `POST /make-server-8daf44f4/signin`

## Frontend Deployment

The frontend is already configured and deployed to Netlify at:
`https://help-learn-thank.netlify.app`

The frontend automatically uses the correct Supabase project ID and anon key from `/utils/supabase/info.tsx`.

## Database

The app uses Supabase's built-in KV store table (`kv_store_8daf44f4`) which is automatically created. No additional database setup is required.

## Common Issues

### "Failed to fetch" Error
- The backend Edge Function is not deployed
- Solution: Deploy using the steps above

### CORS Policy Error
- The Edge Function CORS headers are not set correctly
- Solution: Redeploy the function (the code already includes proper CORS handling)

### "Unauthorized" Error
- Access token expired or invalid
- Solution: Sign out and sign in again

### "Your account does not have the necessary privileges" Error
- Your account is not a member of the Supabase project
- Solution: The project owner needs to invite you to the project via Supabase Dashboard → Settings → Team
- Alternative: If you own the project, make sure you're logged in with the correct account

### Invalid Project Ref Format Error
- Make sure you're using the correct project ID: `hbabranmwzppeuyzczvlv`
- Check that there are no typos in the project reference

## Support

For more information about Supabase Edge Functions:
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/cli
