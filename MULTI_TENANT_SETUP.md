# Multi-Tenant Setup Guide

## Overview

Your Hola Tattoo platform is now a **multi-tenant SaaS** where:
- Each user creates an account with Supabase Auth
- Each user can have their own studio(s) and WhatsApp bot(s)
- Each user sees only their own conversations and data
- One `bot-engine` handles all users' bots (efficient!)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   SUPABASE AUTH                      │
│           (Handles user authentication)              │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Dashboard (Next.js) │
        │   - User login/signup │
        │   - Shows user data   │
        │   - Multi-tenant      │
        └──────────┬────────────┘
                   │
        ┌──────────▼──────────┐
        │   Database (Prisma)  │
        │   User → Studio      │
        │   Studio → Convos    │
        └──────────┬────────────┘
                   │
        ┌──────────▼──────────┐
        │  Bot Engine (Express)│
        │  All users' bots     │
        │  Routes by Studio    │
        └──────────────────────┘
```

## Database Schema

```
User (Supabase Auth ID)
  ├── Studio 1
  │   ├── BotConfig
  │   └── Conversations
  ├── Studio 2 (future)
  │   └── ...
  └── ...
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **API**
4. Copy:
   - Project URL
   - `anon` public key

### 2. Configure Supabase Auth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation email, reset password, etc.

4. **Important**: Configure Site URL and Redirect URLs:
   - Go to **Authentication** → **URL Configuration**
   - Set Site URL: `https://your-dashboard-domain.com` (or `http://localhost:3000` for dev)
   - Add Redirect URLs:
     - `https://your-dashboard-domain.com/api/auth/callback`
     - `http://localhost:3000/api/auth/callback` (for dev)

### 3. Set Environment Variables

#### Dashboard (`apps/dashboard/.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database (same as bot-engine)
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Bot Engine (`apps/bot-engine/.env`)

```bash
# No changes needed - already configured
PORT=3001
DATABASE_URL=...
TWILIO_...
ANTHROPIC_API_KEY=...
```

### 4. Run Database Migration

```bash
cd packages/database
npm run migrate
```

This creates the `users` table and adds `userId` to `studios`.

### 5. Test Locally

```bash
# Terminal 1: Start dashboard
cd apps/dashboard
npm run dev

# Terminal 2: Start bot-engine
cd apps/bot-engine
npm run dev
```

Visit `http://localhost:3000`:
1. Sign up for an account
2. Complete onboarding (create studio)
3. Configure your bot
4. Test WhatsApp messages

## Deployment

### Option 1: Vercel (Dashboard) + Coolify (Bot Engine)

**Dashboard to Vercel:**

```bash
cd apps/dashboard
vercel

# Add environment variables in Vercel dashboard:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - DATABASE_URL
# - NEXT_PUBLIC_APP_URL
```

**Bot Engine to Coolify:**

Already deployed! No changes needed. The bot-engine automatically handles multiple users by looking up studios by phone number.

### Option 2: Both on Coolify

Deploy dashboard the same way as bot-engine:

1. Create new app in Coolify
2. Connect GitHub repo
3. Set Dockerfile: `apps/dashboard/Dockerfile` (create if needed)
4. Set environment variables
5. Deploy

## User Flow

### New User Journey

1. **Visit homepage** → Sees marketing page
2. **Click "Sign Up"** → Creates account with Supabase
3. **Email verification** → Confirms email (if enabled)
4. **Redirected to dashboard** → Sees onboarding prompt
5. **Onboarding** → Creates first studio + bot config
6. **Dashboard** → Sees conversations (empty at first)

### Returning User

1. **Visit homepage** → Auto-redirects to dashboard (if logged in)
2. **Dashboard** → Shows their conversations and stats

### Bot Interaction

1. **User sends WhatsApp** → Bot engine receives webhook
2. **Bot looks up studio** → By WhatsApp number
3. **Saves conversation** → Associated with that studio
4. **Dashboard shows it** → User sees their conversation

## Security Features

✅ **Authentication** - Supabase Auth handles login/signup securely
✅ **Row-Level Security** - Each API route checks user ID
✅ **Session Management** - Automatic refresh tokens
✅ **Protected Routes** - Middleware checks auth on all pages
✅ **Data Isolation** - Users can only see their own data

## Testing Multi-Tenancy

1. Create 2 accounts (use different emails)
2. Create a studio in each account
3. Send WhatsApp messages to each studio's number
4. Verify each user only sees their own conversations

## Scaling Considerations

### Current Setup (Good for 0-1000 users)

- Single bot-engine instance
- Supabase database (connection pooling)
- Vercel serverless functions

### Future Scaling (1000+ users)

- **Bot Engine**: Add load balancer + multiple instances
- **Database**: Upgrade Supabase plan or migrate to dedicated Postgres
- **Caching**: Add Redis for conversation state
- **File Storage**: Add Supabase Storage for images
- **Queue**: Add job queue for webhook retries

## Troubleshooting

### "Unauthorized" errors

- Check Supabase keys in `.env.local`
- Verify middleware is running
- Check browser cookies (session)

### Users can see others' data

- Database migration didn't run properly
- Check API routes have `where: { userId: user.id }`

### Bot not associating conversations

- Check studio has correct `whatsappNumber` in database
- Verify Twilio webhook is pointing to bot-engine
- Check bot-engine logs for errors

### Email not sending

- Enable email provider in Supabase
- Check email templates are configured
- Verify SMTP settings (if using custom SMTP)

## Next Steps

- [ ] Set up Supabase email templates
- [ ] Deploy dashboard to Vercel
- [ ] Test with real users
- [ ] Set up analytics (PostHog, Mixpanel, etc.)
- [ ] Add billing (Stripe) for premium features
- [ ] Add team features (multiple users per studio)

## Support

For issues or questions, check:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- Project README.md files

---

**Status:** ✅ Ready for production testing
**Last Updated:** 2025-11-11

