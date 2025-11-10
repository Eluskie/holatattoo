# Production Deployment Guide - Hola Tattoo

**Last Updated:** 2025-11-09
**Estimated Time:** 4-8 hours
**Monthly Budget:** $10-50 for MVP

This guide walks you through deploying the Hola Tattoo SaaS platform from development to production, using free/affordable services optimized for an MVP.

---

## 📋 Pre-Deployment Checklist

Before starting:
- [ ] Code tested and working in development
- [ ] All environment variables documented in `.env.example` files
- [ ] GitHub repository ready with latest code
- [ ] Twilio account created (can start with sandbox)
- [ ] OpenAI API key obtained
- [ ] Domain name ready (optional but recommended, ~$10/year)

---

## 1. Prepare Your Code for Production

### Build and Optimize

**Root Directory:**
```bash
# Add build script to root package.json
"scripts": {
  "build": "npm run build --workspace=apps/dashboard && npm run build --workspace=apps/bot-engine"
}

# Run build to test
npm run build
```

**Dashboard (Next.js):**
- Verify `next.config.js` has production settings
- Check image optimization is configured
- Ensure environment-specific configs are set

**Bot-Engine (Express):**
```bash
cd apps/bot-engine

# Install production middleware
npm install helmet compression

# Add to index.ts:
import helmet from 'helmet';
import compression from 'compression';

app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
```

**Widget:**
```bash
cd packages/widget

# Install minifier
npm install -D uglify-js

# Minify widget.js (keep <10kb)
npx uglifyjs src/widget.js -o dist/widget.min.js -c -m
```

### Version Control
```bash
# Ensure everything is committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Lint and Test
```bash
# Run linter
npm run lint

# Run any tests you have
npm test
```

---

## 2. Set Up Production Database (Supabase)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Choose a region close to your users (e.g., US East)
4. Wait for provisioning (~2 minutes)

### Get Connection String
```bash
# In Supabase dashboard:
# Settings > Database > Connection string > Nodejs

# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

### Migrate Schema
```bash
cd packages/database

# Update .env with production DATABASE_URL
echo "DATABASE_URL=postgresql://postgres:..." > .env

# Run migrations
npm run migrate:deploy

# Or add script to package.json:
"scripts": {
  "migrate:deploy": "prisma migrate deploy"
}
```

### Seed Initial Data
```bash
# Seed production database with initial studio/config
npm run seed

# Verify in Supabase dashboard > Table Editor
```

### Security Setup

**Enable Row-Level Security (RLS):**
```sql
-- In Supabase SQL Editor

-- Studios table
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studios are viewable by authenticated users"
ON studios FOR SELECT
TO authenticated
USING (true);

-- Conversations table (tenant isolation)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their studio's conversations"
ON conversations FOR SELECT
TO authenticated
USING (studio_id IN (
  SELECT id FROM studios WHERE user_id = auth.uid()
));
```

---

## 3. Deploy Backend (Bot-Engine)

### Choose Hosting: Vercel (Recommended)

**Why Vercel:**
- Free tier includes serverless functions
- Auto-deploys from GitHub
- Built-in HTTPS and CDN
- Zero-config for Node.js/Express

**Setup:**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import `hola-tattoo` repository
4. Configure project:
   - **Root Directory:** `apps/bot-engine`
   - **Framework Preset:** Other (Node.js)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Environment Variables

In Vercel dashboard, add these:

```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI
OPENAI_API_KEY=sk-proj-...

# App
NODE_ENV=production
PORT=3000
```

### Configure Webhook Endpoint

**Add Health Check:**
```typescript
// In apps/bot-engine/src/index.ts
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

**Get Deployment URL:**
After deploying, Vercel gives you: `https://your-bot-engine.vercel.app`

**Test Endpoint:**
```bash
curl https://your-bot-engine.vercel.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Alternative: Render.com

If you prefer persistent servers:
1. Go to [render.com](https://render.com)
2. New > Web Service
3. Connect GitHub repo
4. Configure:
   - **Root Directory:** `apps/bot-engine`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add environment variables
6. Deploy (takes 3-5 minutes)

---

## 4. Deploy Frontend (Dashboard)

### Vercel Deployment

**Setup:**
1. In Vercel dashboard: New Project
2. Import same `hola-tattoo` repository
3. Configure:
   - **Root Directory:** `apps/dashboard`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-dashboard.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Or if using NextAuth with Google OAuth:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=https://your-dashboard.vercel.app/api/auth/callback/google
```

### Generate NextAuth Secret
```bash
# Run in terminal:
openssl rand -base64 32

# Add output to NEXTAUTH_SECRET in Vercel
```

### Authentication Setup

**If using Clerk:**
1. Go to [clerk.com](https://clerk.com)
2. Create application
3. Switch to Production mode
4. Add production domain: `your-dashboard.vercel.app`
5. Copy production keys to Vercel env vars

**If using NextAuth:**
1. Configure OAuth providers with production callback URLs
2. Google: Add `https://your-dashboard.vercel.app/api/auth/callback/google` to authorized redirects
3. Update provider configs in `apps/dashboard/src/app/api/auth/[...nextauth]/route.ts`

### Custom Domain

**Add domain in Vercel:**
1. Domains tab > Add domain
2. Buy domain (e.g., holatattoo.com from Vercel or Namecheap)
3. Vercel auto-configures DNS
4. SSL certificate provisioned automatically (~1 minute)

**Update environment:**
```bash
# Update NEXTAUTH_URL in Vercel:
NEXTAUTH_URL=https://holatattoo.com
```

### Test Deployment
```bash
# Visit deployed URL
open https://your-dashboard.vercel.app

# Test:
1. Sign up as studio owner
2. Create bot configuration
3. View conversations (should be empty)
```

---

## 5. Configure Twilio for Production WhatsApp

### Exit Sandbox Mode

**In Twilio Console:**
1. Go to [console.twilio.com](https://console.twilio.com)
2. Messaging > WhatsApp > Senders
3. Click **Request Access** for production
4. Fill out business information:
   - Business name
   - Website
   - Business description
   - Use case
5. Submit for approval (~1-2 business days)

### Buy/Verify Phone Number

**While waiting for WhatsApp approval:**
```bash
# In Twilio Console:
1. Phone Numbers > Buy a Number
2. Search for country/region
3. Select number with SMS capability
4. Purchase (~$1/month)
```

**Get Production Credentials:**
```bash
# In Twilio Console > Account Info:
ACCOUNT_SID: AC...
AUTH_TOKEN: ...
WHATSAPP_NUMBER: whatsapp:+1234567890 (after approval)
```

### Configure Production Webhook

**In Twilio Console:**
1. Messaging > WhatsApp > Senders
2. Select your number
3. Set webhook URL: `https://your-bot-engine.vercel.app/webhook/twilio/whatsapp`
4. Method: POST
5. Save

**Update bot-engine `.env`:**
```bash
# In Vercel environment variables:
TWILIO_ACCOUNT_SID=AC... (production SID)
TWILIO_AUTH_TOKEN=... (production token)
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### Compliance Requirements

**Opt-In Flow:**
```typescript
// Add to conversationService.ts
if (isNewConversation) {
  return {
    messages: [
      "Hola! Per començar, confirma que vols rebre missatges de l'estudi.",
      "Respon START per subscriure't."
    ]
  };
}
```

**Opt-Out Handling:**
```typescript
if (userMessage.toLowerCase() === 'stop') {
  // Mark conversation as opted-out
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'opted_out' }
  });

  return {
    messages: ["Has estat eliminat de la llista. Envia START per tornar."]
  };
}
```

### OpenAI Production Key

**In OpenAI Dashboard:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. API Keys > Create new key
3. Set usage limits (e.g., $50/month)
4. Add to Vercel: `OPENAI_API_KEY=sk-proj-...`

**Monitor Usage:**
- Set up billing alerts in OpenAI dashboard
- Expected cost: ~$0.002 per conversation (GPT-3.5-turbo)

---

## 6. Website Integration (Simple WhatsApp Button)

### Generate Per-Studio Links

**In Dashboard:**
```typescript
// Add to apps/dashboard/src/app/dashboard/widget/page.tsx

export default function WidgetPage() {
  const studio = useStudio(); // Get current studio

  const whatsappLink = `https://wa.me/${studio.whatsappNumber.replace('whatsapp:', '')}?text=${encodeURIComponent('Hola! Vull informació sobre tatuatges.')}`;

  return (
    <div>
      <h2>WhatsApp Button Integration</h2>
      <p>Copy this HTML and paste it into your website:</p>

      <pre>
{`<a href="${whatsappLink}" target="_blank" rel="noopener">
  <button style="
    background-color: #25D366;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
  ">
    💬 Chat on WhatsApp
  </button>
</a>`}
      </pre>
    </div>
  );
}
```

### Button Styles (Provide Multiple Options)

**Option 1: Floating Button (Bottom Right)**
```html
<style>
  .whatsapp-float {
    position: fixed;
    width: 60px;
    height: 60px;
    bottom: 40px;
    right: 40px;
    background-color: #25D366;
    color: white;
    border-radius: 50px;
    text-align: center;
    font-size: 30px;
    box-shadow: 2px 2px 3px #999;
    z-index: 100;
    transition: all 0.3s ease;
  }
  .whatsapp-float:hover {
    transform: scale(1.1);
  }
</style>

<a href="https://wa.me/1234567890?text=..." target="_blank" class="whatsapp-float">
  💬
</a>
```

**Option 2: Inline Button (Contact Page)**
```html
<a href="https://wa.me/1234567890?text=..." target="_blank">
  <button style="
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: white;
    padding: 16px 32px;
    border: none;
    border-radius: 50px;
    font-size: 18px;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
    transition: all 0.3s ease;
  " onmouseover="this.style.transform='translateY(-2px)'"
     onmouseout="this.style.transform='translateY(0)'">
    💬 Reserva la teva cita
  </button>
</a>
```

### UTM Tracking (Optional)

**Add tracking parameters:**
```javascript
const whatsappLink = `https://wa.me/${number}?text=${encodeURIComponent(message)}&utm_source=website&utm_medium=button&utm_campaign=tattoo_booking`;
```

**Parse in bot-engine:**
```typescript
// In conversationService.ts
const utmSource = extractUTMFromMessage(message.Body);
await prisma.conversation.create({
  data: {
    ...conversationData,
    source: utmSource || 'whatsapp'
  }
});
```

### Full Widget (Future)

If studios want the full embedded widget later:

**Deploy to CDN:**
```bash
# Build widget
cd packages/widget
npm run build

# Upload dist/widget.min.js to Vercel static files
# Or use CDN like Cloudflare Pages

# Provide embed code:
<script src="https://cdn.holatattoo.com/widget.min.js"></script>
<script>
  HolaTattooWidget.init({
    studioId: 'YOUR_STUDIO_ID',
    position: 'bottom-right'
  });
</script>
```

---

## 7. Security and Monitoring

### Secrets Management

**Never commit secrets to Git!**

✅ Use environment variables in Vercel/Render
✅ Use `.env.example` templates
✅ Add `.env` to `.gitignore`

```bash
# Check .gitignore includes:
.env
.env.local
.env.production
```

### HTTPS Everywhere

**Vercel enforces HTTPS automatically** for all deployments.

**Verify:**
```bash
curl -I https://your-bot-engine.vercel.app/health
# Should show: HTTP/2 200
```

### Error Tracking with Sentry

**Install Sentry (Free Tier):**
```bash
# In both bot-engine and dashboard:
npm install @sentry/node @sentry/nextjs
```

**Configure bot-engine:**
```typescript
// apps/bot-engine/src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Add error handler
app.use(Sentry.Handlers.errorHandler());
```

**Configure dashboard:**
```bash
# Run setup wizard:
npx @sentry/wizard -i nextjs

# Follow prompts to configure
```

**Get DSN:**
1. Go to [sentry.io](https://sentry.io)
2. Create project > Node.js / Next.js
3. Copy DSN: `https://[KEY]@[ORG].ingest.sentry.io/[PROJECT]`
4. Add to Vercel: `SENTRY_DSN=https://...`

### Logging

**Structured logging with Winston:**
```bash
npm install winston
```

```typescript
// apps/bot-engine/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Use throughout app:
logger.info('Processing message', { conversationId, userId });
logger.error('Failed to send message', { error });
```

**View logs:**
- Vercel: Deployment > Functions > Logs tab
- Render: Logs tab in dashboard

### Rate Limiting

**Prevent abuse with express-rate-limit:**
```bash
npm install express-rate-limit
```

```typescript
// apps/bot-engine/src/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/webhook', limiter);
```

### Database Backups

**Supabase auto-backups:**
- Free plan: Daily backups, 7-day retention
- Pro plan: Point-in-time recovery

**Manual backup:**
```bash
# Create dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Schedule with cron (optional)
0 2 * * * pg_dump $DATABASE_URL > /backups/backup-$(date +\%Y\%m\%d).sql
```

---

## 8. Testing and Launch

### End-to-End Testing

**Test entire flow:**

1. **Dashboard:** Sign up as studio owner
   ```
   https://your-dashboard.vercel.app
   ```

2. **Configure Bot:**
   - Set studio WhatsApp number
   - Configure webhook URL (your endpoint)
   - Save configuration

3. **Website Button:** Click the generated WhatsApp button
   - Should open WhatsApp with pre-filled message
   - Send message to bot

4. **Bot Conversation:**
   - Bot asks conversational questions
   - Provide answers naturally
   - Bot extracts data with AI
   - Get price estimate
   - Receive recap

5. **Webhook:** Check that qualified lead hits studio's webhook
   ```bash
   # Check logs in Vercel:
   "✅ Lead sent to webhook: https://studio-webhook.com"
   ```

6. **Database:** Verify conversation saved
   ```bash
   # In Supabase dashboard > Table Editor > conversations
   # Should show conversation with status: 'qualified'
   ```

### Performance Testing

**Load test with Artillery:**
```bash
npm install -g artillery

# Create test script (test.yml):
config:
  target: 'https://your-bot-engine.vercel.app'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
scenarios:
  - flow:
      - post:
          url: "/webhook/twilio/whatsapp"
          json:
            MessageSid: "test"
            From: "whatsapp:+1234567890"
            Body: "Hola"

# Run test:
artillery run test.yml
```

**Expected results:**
- p95 latency: <2s
- Success rate: >99%

### Custom Domain Setup

**Add domain to Vercel:**
1. Go to project settings > Domains
2. Add domain: `holatattoo.com`
3. Configure DNS (Vercel provides instructions)
4. Wait for SSL certificate (~5 minutes)

**Update all references:**
```bash
# In Vercel environment variables:
NEXTAUTH_URL=https://holatattoo.com

# In Clerk/OAuth providers:
# Update callback URLs to new domain
```

### Pre-Launch Checklist

- [ ] All environment variables set in production
- [ ] Database migrations run successfully
- [ ] Bot responds correctly in WhatsApp
- [ ] Price estimation working
- [ ] Medical/complex request detection working
- [ ] Webhook receives qualified leads
- [ ] Dashboard authentication working
- [ ] Error tracking configured (Sentry)
- [ ] Rate limiting enabled
- [ ] HTTPS enforced everywhere
- [ ] Custom domain configured (if applicable)
- [ ] Twilio production WhatsApp approved
- [ ] OpenAI usage limits set
- [ ] End-to-end test passed

### Launch!

1. **Announce:** Notify your first tattoo studio
2. **Monitor:** Watch logs/errors closely for first 24 hours
3. **Support:** Be ready to respond to issues quickly

**Share links:**
```
Dashboard: https://holatattoo.com
WhatsApp: https://wa.me/1234567890?text=Hola
```

---

## 9. Post-Launch Operations

### Monitoring Costs

**Monthly estimates for 100 conversations:**

| Service | Cost | Notes |
|---------|------|-------|
| Twilio WhatsApp | ~$3 | $0.005/message × ~600 messages |
| OpenAI GPT-3.5 | ~$0.50 | $0.002/1K tokens × ~250K tokens |
| Supabase | FREE | Within free tier (500MB, 2GB bandwidth) |
| Vercel (Frontend) | FREE | Within hobby plan |
| Vercel (Backend) | FREE | Within hobby plan (100GB-hrs) |
| Domain | $1/month | ~$12/year |
| **Total** | **~$5-10/month** | |

**Scale pricing (1000 conversations/month):**
- Twilio: ~$30
- OpenAI: ~$5
- Supabase: $25 (Pro plan for more storage)
- Vercel: $20 (Pro plan for more resources)
- **Total: ~$80-100/month**

### Monitoring Dashboards

**Set up monitoring:**

1. **Vercel Analytics:**
   - Enable in project settings
   - Track: Page views, Web Vitals, Function invocations

2. **Supabase Metrics:**
   - Database size
   - Active connections
   - Query performance

3. **Twilio Usage:**
   - Messages sent/received
   - Cost per day
   - Error rates

4. **OpenAI Usage:**
   - Tokens used
   - Cost per day
   - Set billing alerts at $50/month

### Scaling Considerations

**When you hit 1000+ conversations/month:**

1. **Upgrade Supabase:**
   ```bash
   # Pro plan: $25/month
   - 8GB database
   - 50GB bandwidth
   - Connection pooling
   ```

2. **Optimize OpenAI:**
   ```typescript
   // Cache common responses
   // Reduce max_tokens (currently 200)
   // Use function calling for data extraction
   ```

3. **Add Redis caching:**
   ```bash
   # Install Upstash Redis (free tier: 10K commands/day)
   npm install @upstash/redis

   # Cache studio configs, bot configs
   ```

4. **Database indexing:**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_conversations_studio ON conversations(studio_id);
   CREATE INDEX idx_conversations_status ON conversations(status);
   CREATE INDEX idx_conversations_phone ON conversations(user_phone);
   ```

### Multi-Tenant Payments (Future)

**Add Stripe for SaaS billing:**
```bash
npm install stripe @stripe/stripe-js
```

**Pricing tiers:**
- Starter: $29/month (100 conversations)
- Growth: $99/month (500 conversations)
- Pro: $299/month (2000 conversations)

---

## 10. Troubleshooting

### Common Issues

**Bot not responding:**
1. Check Vercel logs for errors
2. Verify webhook URL in Twilio matches deployment
3. Test health endpoint: `curl https://your-bot-engine.vercel.app/health`
4. Check environment variables are set

**Database connection errors:**
1. Verify DATABASE_URL is correct (copy from Supabase)
2. Check IP whitelist in Supabase (should allow all by default)
3. Test connection: `psql $DATABASE_URL`

**OpenAI errors:**
1. Check API key is valid
2. Verify billing is set up in OpenAI
3. Check usage limits aren't exceeded
4. Look for rate limit errors in logs

**Webhook not receiving leads:**
1. Check studio has webhookUrl configured in database
2. Verify webhook endpoint is accessible (curl it)
3. Check logs for webhook send attempts
4. Test with webhook.site for debugging

**Twilio sandbox vs production:**
- Sandbox: Limited to approved numbers, free
- Production: Needs approval, costs $0.005/msg
- Don't forget to update TWILIO_WHATSAPP_NUMBER after approval!

### Support Resources

- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **Supabase:** [supabase.com/docs](https://supabase.com/docs)
- **Twilio:** [support.twilio.com](https://support.twilio.com)
- **OpenAI:** [help.openai.com](https://help.openai.com)

### Emergency Rollback

**If production breaks:**
```bash
# In Vercel dashboard:
1. Go to Deployments tab
2. Find last working deployment
3. Click "..." > Promote to Production
4. Site rolls back in ~30 seconds
```

---

## 🎉 Success!

Your Hola Tattoo bot is now in production!

**Next steps:**
1. Onboard first tattoo studio
2. Monitor conversations and leads
3. Gather feedback for improvements
4. Scale when ready

**Key metrics to track:**
- Conversations started
- Completion rate (qualified leads / started)
- Average questions per conversation
- Response time
- Cost per lead

Good luck with your launch! 🚀
