# Deployment Guide

Guide for deploying the Hola Tattoo platform to production.

## Architecture Overview

- **Dashboard (Next.js)**: Vercel
- **Bot Engine (Express)**: Railway or Render
- **Database**: Railway PostgreSQL or Neon
- **Widget**: CDN (Cloudflare or similar)

## Prerequisites

- GitHub repository
- Vercel account
- Railway or Render account
- Custom domain (optional but recommended)

## Database Deployment

### Option 1: Railway PostgreSQL

1. Sign up at https://railway.app
2. Create new project → PostgreSQL
3. Copy connection string
4. Use for both bot-engine and dashboard

### Option 2: Neon (Serverless Postgres)

1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string
4. Add to environment variables

### Run Migrations

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://..."

# Run migrations
cd packages/database
npm run migrate:deploy

# Seed production data (optional)
npm run seed
```

## Bot Engine Deployment (Railway)

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd apps/bot-engine
railway init
```

### 2. Configure Environment Variables

In Railway dashboard, add:

```
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+...
ANTHROPIC_API_KEY=...
JWT_SECRET=...
```

### 3. Deploy

```bash
railway up
```

### 4. Configure Twilio Webhook

1. Get your Railway deployment URL
2. Go to Twilio Console
3. Set webhook to: `https://your-railway-domain.up.railway.app/webhook/twilio/whatsapp`

## Bot Engine Deployment (Render)

### 1. Create Web Service

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Name: `hola-tattoo-bot-engine`
   - Environment: `Node`
   - Build Command: `cd apps/bot-engine && npm install && npm run build`
   - Start Command: `cd apps/bot-engine && npm start`
   - Instance Type: Starter ($7/month)

### 2. Environment Variables

Add in Render dashboard:
```
NODE_ENV=production
DATABASE_URL=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...
ANTHROPIC_API_KEY=...
JWT_SECRET=...
```

### 3. Deploy

Render will auto-deploy on git push.

## Dashboard Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
cd apps/dashboard
vercel
```

### 3. Configure Environment Variables

In Vercel dashboard, add:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
NEXT_PUBLIC_BOT_ENGINE_URL=https://your-bot-engine-url.com
```

### 4. Custom Domain (Optional)

1. Go to Vercel dashboard → Settings → Domains
2. Add your domain
3. Configure DNS records

## Widget Deployment

### Option 1: Vercel Static Files

```bash
# Build widget
cd packages/widget
npm run build

# Copy to dashboard public folder
cp dist/widget.js ../apps/dashboard/public/

# Deploy dashboard (widget will be available at /widget.js)
```

### Option 2: CDN (Cloudflare)

1. Build widget: `npm run build`
2. Upload `dist/widget.js` to Cloudflare Pages or R2
3. Update widget code with CDN URL

## Post-Deployment Checklist

### Security

- [ ] Enable HTTPS on all services
- [ ] Set strong JWT_SECRET
- [ ] Configure CORS properly
- [ ] Enable rate limiting (optional)
- [ ] Set up monitoring (Sentry, LogRocket, etc.)

### Clerk Configuration

- [ ] Update authorized domains
- [ ] Configure email templates
- [ ] Set up SSO (optional)
- [ ] Enable MFA (optional)

### Twilio Configuration

- [ ] Apply for WhatsApp Business API (if not using sandbox)
- [ ] Configure business profile
- [ ] Set message templates
- [ ] Enable delivery reports

### Testing

- [ ] Test complete conversation flow
- [ ] Verify webhook deliveries
- [ ] Test widget on production website
- [ ] Monitor error logs

### Monitoring

Set up monitoring for:
- API errors
- Database connections
- Webhook failures
- Conversation completion rates

### Recommended Tools

- **Error Tracking**: Sentry
- **Analytics**: Mixpanel or PostHog
- **Uptime Monitoring**: UptimeRobot
- **Log Management**: Railway logs or Datadog

## Scaling Considerations

### Database

- Enable connection pooling (PgBouncer)
- Set up read replicas for high traffic
- Regular backups

### Bot Engine

- Horizontal scaling (multiple instances)
- Redis for session management
- Queue system for webhooks (Bull or BullMQ)

### Rate Limiting

```typescript
// Add to bot-engine
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/webhook', limiter);
```

## Backup Strategy

### Database Backups

Railway/Neon provide automatic backups. For manual backups:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Code Backups

Ensure all code is in GitHub with regular commits.

## Rollback Procedure

### Vercel (Dashboard)

```bash
vercel rollback
```

### Railway (Bot Engine)

Use Railway dashboard to rollback to previous deployment.

## Environment-Specific Configuration

### Production

```env
NODE_ENV=production
LOG_LEVEL=error
RATE_LIMIT_ENABLED=true
```

### Staging

```env
NODE_ENV=staging
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=false
```

## Cost Estimation (Monthly)

- **Vercel (Dashboard)**: Free (Hobby) or $20 (Pro)
- **Railway (Bot Engine + DB)**: ~$20-50
- **Clerk**: Free (10k MAU) or $25+ (Pro)
- **Twilio WhatsApp**: ~$0.005 per message
- **Anthropic API**: ~$0.003 per 1k tokens

**Total**: ~$45-95/month for MVP

## Support

For deployment issues:
- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Twilio: https://support.twilio.com
