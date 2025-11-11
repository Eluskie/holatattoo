# Deploy Dashboard to Coolify

## 🎯 Goal

Deploy the Next.js dashboard as a **separate application** alongside your bot-engine.

---

## 📋 Prerequisites

- ✅ Bot engine already deployed
- ✅ Coolify access
- ✅ GitHub repo connected
- ✅ Supabase project created

---

## Step 1: Create Dockerfile for Dashboard

First, let's create a production Dockerfile for the dashboard:

### Create `apps/dashboard/Dockerfile`

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/database/package.json ./packages/database/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages first
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/shared-types

# Build dashboard
RUN npm run build --workspace=apps/dashboard

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/dashboard/server.js"]
```

### Update `apps/dashboard/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Remove old config
  },
  serverExternalPackages: ['@prisma/client', '@hola-tattoo/database'],
}

module.exports = nextConfig
```

---

## Step 2: Create New Application in Coolify

### 2.1 Log into Coolify

Visit: Your Coolify dashboard

### 2.2 Create New Application

1. Click **+ New Resource**
2. Select **Application**
3. Choose **Public Repository** (or your connected GitHub)
4. Enter repository URL: `https://github.com/Eluskie/holatattoo`
5. Branch: `main`

### 2.3 Configure Build Settings

**Application Name:** `hola-tattoo-dashboard`

**Build Pack:** `Dockerfile`

**Dockerfile Location:** `apps/dashboard/Dockerfile`

**Build Context:** `.` (root of repo)

**Port:** `3000`

### 2.4 Set Environment Variables

Add these in Coolify:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bxgnfpxmyshqzcziflym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TrzuVRcFKDkz6zbFeS5y-A_1elBer0a

# Database
DATABASE_URL=postgresql://postgres.bxgnfpxmyshqzcziflym:sBY5EoYR5VlIhjU5@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# App URL (will be your Coolify URL or custom domain)
NEXT_PUBLIC_APP_URL=https://dashboard.withflare.so

# Node
NODE_ENV=production
```

### 2.5 Configure Domain

**Domain:** `dashboard.withflare.so`

Or use Coolify's auto-generated domain first for testing.

---

## Step 3: Deploy

1. Click **Deploy**
2. Monitor build logs
3. Wait 5-10 minutes for build
4. Once deployed, visit your domain!

---

## Step 4: Configure DNS (If using custom domain)

In your DNS provider:

```
Type: A Record
Name: dashboard
Value: [Your Hetzner Server IP]
TTL: 3600
```

---

## Step 5: Update Supabase Redirect URLs

In Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   - `https://dashboard.withflare.so/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for local dev)
3. Set Site URL: `https://dashboard.withflare.so`

---

## 🎯 Final Architecture

After deployment, you'll have:

```
┌─────────────────────────────────────────┐
│  Dashboard (Next.js)                    │
│  URL: https://dashboard.withflare.so    │
│  - User-facing website                  │
│  - Login, signup, dashboard             │
└─────────────────────────────────────────┘
                   │
                   │ Reads/writes
                   ↓
┌─────────────────────────────────────────┐
│  Database (Supabase)                    │
│  - Users, Studios, Conversations        │
└─────────────────────────────────────────┘
                   ↑
                   │ Saves conversations
                   │
┌─────────────────────────────────────────┐
│  Bot Engine (Express)                   │
│  URL: https://agent.withflare.so        │
│  - WhatsApp webhook handler             │
│  - AI processing                        │
└─────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Build Fails

**Error:** "Cannot find module '@hola-tattoo/database'"

**Solution:** Make sure build steps include building packages first:
```dockerfile
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/shared-types
```

### Environment Variables Not Working

**Check:**
1. All env vars are set in Coolify
2. Restart the application after changing env vars
3. Check logs for "undefined" errors

### Supabase Auth Not Working

**Check:**
1. Redirect URLs are configured in Supabase
2. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
3. Site URL matches your domain

---

## 🎉 Testing

Once deployed, test:

1. ✅ Visit `https://dashboard.withflare.so`
2. ✅ Click "Sign Up" → Create account
3. ✅ Complete onboarding
4. ✅ See dashboard
5. ✅ Send WhatsApp message → See conversation in dashboard

---

**Need help?** Check Coolify logs under your dashboard application!

