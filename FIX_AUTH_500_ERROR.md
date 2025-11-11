# Fix Authentication 500 Error

## 🔴 Problem
Authentication is failing with:
```
POST https://agent.withflare.so/api/users/create 500 (Internal Server Error)
```

## 🎯 Root Cause
The `/api/users/create` endpoint cannot connect to the database. This is typically caused by:
1. Missing `DATABASE_URL` environment variable
2. Database migrations not applied to production
3. Prisma client cannot connect to the database

## ✅ Solution Steps

### Step 1: Verify Environment Variables in Coolify

1. Log into Coolify
2. Go to your **dashboard application** (NOT bot-engine)
3. Click **Environment Variables**
4. Verify these variables are set:

```bash
# CRITICAL: Database connection (must use connection pooler)
DATABASE_URL=postgresql://postgres.bxgnfpxmyshqzcziflym:sBY5EoYR5VlIhjU5@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bxgnfpxmyshqzcziflym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z25mcHhteXNocXpjemk1bHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjQ1MTgsImV4cCI6MjA0NjQwMDUxOH0.K2zCBd4f1fWQZUJe9z6o2B5Lz3Y9Xk1Jm4Nn8Wq7Rp0

# App URL
NEXT_PUBLIC_APP_URL=https://agent.withflare.so

# Node
NODE_ENV=production
```

**If `DATABASE_URL` is missing or incorrect:**
- Add it
- Click **Save**
- **Restart the application**

### Step 2: Commit and Push Updated Dockerfile

The updated Dockerfile now automatically runs database migrations on startup.

```bash
# Commit the changes
git add Dockerfile.dashboard apps/dashboard/docker-entrypoint.sh
git commit -m "fix: Add automatic database migration on dashboard startup"
git push origin main
```

### Step 3: Redeploy in Coolify

1. Go to your dashboard application in Coolify
2. Click **Deploy** (or it will auto-deploy if you have auto-deploy enabled)
3. Wait for the build to complete
4. Check the logs during startup - you should see:
   ```
   Running database migrations...
   ✓ Database migrations applied
   Starting Next.js server...
   ```

### Step 4: Verify Database Tables Exist

You can verify the database tables were created by checking Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `bxgnfpxmyshqzcziflym`
3. Go to **Table Editor**
4. You should see these tables:
   - `users`
   - `studios`
   - `bot_configs`
   - `conversations`

**If tables are missing:**
Run migrations manually:
```bash
# From your local machine (this will apply to production DB)
cd /Users/eluskie/github-stuff/hola-tattoo
export DATABASE_URL="postgresql://postgres.bxgnfpxmyshqzcziflym:sBY5EoYR5VlIhjU5@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
```

### Step 5: Update Supabase Auth Configuration

Make sure your Supabase redirect URLs are configured:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set:
   - **Site URL:** `https://agent.withflare.so`
   - **Redirect URLs:** Add these:
     ```
     https://agent.withflare.so/api/auth/callback
     http://localhost:3000/api/auth/callback
     ```

### Step 6: Test Authentication

1. Visit `https://agent.withflare.so`
2. Click **Sign Up**
3. Fill in:
   - Name
   - Email
   - Password
4. Click **Sign up**
5. You should see: "Account created! Please check your email to verify."

**If you still get a 500 error:**
- Check Coolify logs for the dashboard application
- Look for database connection errors
- Verify `DATABASE_URL` is correct

## 🔍 Debugging Tips

### Check Application Logs
In Coolify:
1. Go to your dashboard application
2. Click **Logs**
3. Look for errors related to:
   - `DATABASE_URL`
   - `prisma`
   - `/api/users/create`

### Test Database Connection
You can add a test endpoint to verify database connectivity.

Create `apps/dashboard/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@hola-tattoo/database'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ 
      status: 'healthy',
      database: 'connected' 
    })
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message 
    }, { status: 500 })
  }
}
```

Then visit: `https://agent.withflare.so/api/health`

### Common Error Messages

**"Can't reach database server"**
- `DATABASE_URL` is incorrect
- Database is not accessible from your server
- Check if you're using the connection pooler URL (should contain `pooler.supabase.com`)

**"Prepared statement already exists"**
- You're not using the connection pooler
- Change URL from `db.` to `pooler.` in the hostname

**"P2002: Unique constraint failed"**
- User already exists in database
- This is OK - it means database is working
- Try signing in instead of signing up

## 📋 Checklist

Before asking for help, verify:

- [ ] `DATABASE_URL` is set in Coolify
- [ ] Environment variables are saved
- [ ] Application has been redeployed after setting env vars
- [ ] Database migrations have run (check logs)
- [ ] Supabase redirect URLs are configured
- [ ] Tables exist in Supabase (users, studios, etc.)
- [ ] Application logs don't show database connection errors

## 🆘 Still Not Working?

Share these details:
1. Coolify application logs (last 50 lines)
2. Error message in browser console
3. Result of visiting `https://agent.withflare.so/api/health` (if you added the health endpoint)
4. Screenshot of Coolify environment variables (redact sensitive values)

