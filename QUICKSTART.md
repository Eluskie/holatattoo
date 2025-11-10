# Quick Start Guide

Get your WhatsApp bot up and running in 10 minutes.

## Prerequisites Check

Make sure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ PostgreSQL installed and running
- ✅ Git installed

## 1. Install Dependencies (2 minutes)

```bash
# From project root
npm install
```

This installs all dependencies for all workspaces at once.

## 2. Setup Database (2 minutes)

```bash
# Create database
createdb hola_tattoo

# Or using psql
psql postgres -c "CREATE DATABASE hola_tattoo;"

# Navigate to database package
cd packages/database

# Copy environment file
cp .env.example .env

# Edit .env with your database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/hola_tattoo?schema=public"

# Generate Prisma client and run migrations
npm run generate
npm run migrate
npm run seed
```

## 3. Setup Bot Engine (2 minutes)

```bash
cd ../../apps/bot-engine

# Copy environment file
cp .env.example .env

# Edit .env - You need:
# - DATABASE_URL (same as above)
# - ANTHROPIC_API_KEY (get from https://console.anthropic.com)
# - TWILIO credentials (can use sandbox for testing)
```

**Quick Twilio Setup for Testing:**
1. Go to https://console.twilio.com
2. Navigate to Messaging → Try it out → Send a WhatsApp message
3. Join sandbox by sending the code to the number shown
4. Copy your Account SID, Auth Token, and Sandbox number
5. Paste into `.env`

**Get Anthropic API Key:**
1. Go to https://console.anthropic.com
2. Create an account
3. Generate an API key
4. Paste into `.env`

## 4. Setup Dashboard (2 minutes)

```bash
cd ../dashboard

# Copy environment file
cp .env.example .env.local

# Edit .env.local - You need:
# - DATABASE_URL (same as above)
# - Clerk credentials (see below)
```

**Quick Clerk Setup:**
1. Go to https://clerk.com and sign up
2. Create a new application
3. Choose "Email" authentication
4. Copy "Publishable key" and "Secret key"
5. Paste into `.env.local`

## 5. Build Widget (1 minute)

```bash
cd ../../packages/widget
npm run build
```

## 6. Start Everything (1 minute)

Open 2 terminal windows:

**Terminal 1 - Bot Engine:**
```bash
cd apps/bot-engine
npm run dev
```

**Terminal 2 - Dashboard:**
```bash
cd apps/dashboard
npm run dev
```

## 7. Test It Out!

### Test Dashboard
1. Open http://localhost:3000
2. Click "Get Started"
3. Sign up with your email
4. Complete the onboarding flow
5. Explore the dashboard!

### Test Bot Engine
```bash
# In a new terminal
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### Test WhatsApp Bot (with ngrok)

1. Install ngrok:
   ```bash
   brew install ngrok  # macOS
   # or download from https://ngrok.com
   ```

2. Start ngrok:
   ```bash
   ngrok http 3001
   ```

3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. Go to Twilio Console → WhatsApp Sandbox Settings

5. Set "When a message comes in" to:
   ```
   https://abc123.ngrok.io/webhook/twilio/whatsapp
   ```

6. Send a WhatsApp message to your Twilio sandbox number

7. The bot should respond with your welcome message!

## Common Issues

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection failed
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### Prisma client not generated
```bash
cd packages/database
npm run generate
```

### Module not found errors
```bash
# Rebuild everything from root
npm install
cd packages/shared-types && npm run build
cd ../database && npm run build
cd ../widget && npm run build
```

## Next Steps

1. **Customize your bot** - Go to Dashboard → Bot Config
2. **Add webhook URL** - Go to Dashboard → Settings
3. **Get widget code** - Go to Dashboard → Widget
4. **Read full docs** - See SETUP.md and DEPLOYMENT.md

## Need Help?

- Setup issues: See [SETUP.md](./SETUP.md)
- Deployment: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- Project structure: See [PROJECT_STATUS.md](./PROJECT_STATUS.md)

## What You Built

🎉 Congratulations! You now have:

- ✅ A multi-tenant SaaS platform
- ✅ WhatsApp bot with AI-powered lead qualification
- ✅ Beautiful dashboard for managing conversations
- ✅ Embeddable widget for websites
- ✅ Full conversation tracking
- ✅ Webhook integration for CRMs

**Total time: ~10 minutes** ⚡

Now you can:
- Configure your bot questions
- Add your website widget
- Start capturing leads 24/7!
