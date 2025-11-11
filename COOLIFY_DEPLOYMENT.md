# Deploy Hola Tattoo Bot to Hetzner via Coolify

## Prerequisites

- Hetzner server with Coolify installed
- GitHub repository access
- Domain configured (e.g., bot.withflare.so)

## Deployment Steps

### 1. Create New Application in Coolify

1. Log into Coolify: `https://coolify.withflare.so` (or your Coolify URL)
2. Click **+ New Resource** → **Application**
3. Select **Public Repository**
4. Enter repository URL: `https://github.com/Eluskie/holatattoo`
5. Select branch: `main`

### 2. Configure Build Settings

**Build Pack:** Dockerfile

**Dockerfile Location:** `./Dockerfile` (root level)

**Build Context:** `.` (root)

**Port:** `3001`

### 3. Set Environment Variables

Add these environment variables in Coolify:

```bash
# Server
PORT=3001
NODE_ENV=production

# Database (Supabase with connection pooler)
DATABASE_URL=postgresql://postgres.bxgnfpxmyshqzcziflym:sBY5EoYR5VlIhjU5@aws-1-eu-north-1.pooler.supabase.com:5432/postgres

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=AC42c9ce3c36af584a5925c9f12fccff8b
TWILIO_AUTH_TOKEN=0130989916e8dc9c055cd6ebf38a17a3
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI
OPENAI_API_KEY=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

# JWT (optional)
JWT_SECRET=hola-tattoo-secret-key-2025
```

### 4. Configure Domain

**Domain:** `agent.withflare.so` (or your preferred subdomain)

**Enable HTTPS:** Yes (Coolify auto-provisions Let's Encrypt)

### 5. Deploy

1. Click **Deploy**
2. Monitor build logs
3. Wait for deployment to complete
4. Check health endpoint: `https://agent.withflare.so/health`

### 6. Update Twilio Webhook

Once deployed, update Twilio webhook URL:

1. Go to Twilio Console: https://console.twilio.com
2. Navigate to **Messaging** → **Settings** → **WhatsApp Sandbox** (or your number)
3. Update webhook URL to: `https://agent.withflare.so/webhook/twilio/whatsapp`
4. Method: **POST**
5. Save

### 7. Verify Deployment

Test the health endpoint:
```bash
curl https://agent.withflare.so/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T...",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### 8. Test WhatsApp Flow

Send a message to your Twilio WhatsApp number to test the complete flow.

## Auto-Deploy from GitHub

Coolify can auto-deploy on git push:

1. In Coolify, go to your application settings
2. Enable **Auto Deploy**
3. Select branch: `main`
4. Now every push to `main` will trigger a new deployment

## Troubleshooting

### Build Fails

- Check Coolify build logs
- Verify Dockerfile path is correct
- Ensure all dependencies are in package.json

### Container Won't Start

- Check container logs in Coolify
- Verify environment variables are set
- Check DATABASE_URL is accessible

### WhatsApp Messages Not Received

- Verify Twilio webhook URL is correct
- Check bot is accessible: `curl https://agent.withflare.so/health`
- Review bot logs in Coolify

### Database Connection Issues

- Verify DATABASE_URL uses connection pooler
- Check Supabase connection pooler is enabled
- Test connection: `curl https://agent.withflare.so/health`

## Benefits of Coolify Deployment

✅ **No Cold Starts** - Always running, instant WhatsApp responses
✅ **Auto HTTPS** - Let's Encrypt certificates managed automatically
✅ **Auto Deploy** - Push to GitHub → automatic deployment
✅ **Easy Logs** - View logs directly in Coolify UI
✅ **Same Server as n8n** - Lower latency, easier management
✅ **Free** - Only pay for Hetzner server

## Monitoring

**Health Check:** `https://agent.withflare.so/health`

**Logs:** Available in Coolify dashboard under your application

**Metrics:** Coolify shows CPU, memory, network usage

---

**Status:** Ready to deploy ✅
**Last Updated:** 2025-11-11
