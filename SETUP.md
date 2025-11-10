# Setup Guide

Complete guide to setting up the Hola Tattoo WhatsApp Lead Qualification Bot Platform.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Twilio account with WhatsApp Business API access
- Anthropic API key (for Claude)
- Clerk account (for authentication)

## Installation Steps

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hola-tattoo
npm install
```

This will install all dependencies for all workspaces.

### 2. Database Setup

#### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE hola_tattoo;

# Create user (optional)
CREATE USER hola_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hola_tattoo TO hola_user;

# Exit
\q
```

### 3. Environment Configuration

#### Backend (bot-engine)

```bash
cd apps/bot-engine
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=development

DATABASE_URL="postgresql://user:password@localhost:5432/hola_tattoo?schema=public"

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

ANTHROPIC_API_KEY=your_anthropic_api_key

JWT_SECRET=your_random_secret_here
```

#### Frontend (dashboard)

```bash
cd apps/dashboard
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hola_tattoo?schema=public"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

NEXT_PUBLIC_BOT_ENGINE_URL=http://localhost:3001
```

#### Database Package

```bash
cd packages/database
cp .env.example .env
```

Edit `.env` with your database URL.

### 4. Run Database Migrations

```bash
cd packages/database
npm run generate
npm run migrate
npm run seed
```

This will:
- Generate Prisma client
- Run database migrations
- Seed with test data

### 5. Build Shared Packages

```bash
# From root directory
cd packages/shared-types
npm run build

cd ../database
npm run build

cd ../widget
npm run build
```

### 6. Start Development Servers

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

**Terminal 3 - Widget (optional):**
```bash
cd packages/widget
npm run dev
```

## Service Setup

### Twilio WhatsApp Setup

1. Create a Twilio account at https://twilio.com
2. Get a WhatsApp Business number:
   - For testing: Use Twilio Sandbox (free)
   - For production: Apply for WhatsApp Business API access
3. Configure webhook:
   - Go to Twilio Console → WhatsApp → Sandbox Settings
   - Set "When a message comes in" to: `https://your-domain.com/webhook/twilio/whatsapp`
   - For local development, use ngrok (see below)

### Ngrok Setup (Local Development)

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start ngrok
ngrok http 3001

# Copy the HTTPS URL and set it in Twilio webhook
# Example: https://abc123.ngrok.io/webhook/twilio/whatsapp
```

### Clerk Authentication Setup

1. Create account at https://clerk.com
2. Create a new application
3. Enable email/password authentication
4. Copy API keys to dashboard `.env.local`
5. Configure redirect URLs in Clerk dashboard

### Anthropic API Setup

1. Sign up at https://console.anthropic.com
2. Create an API key
3. Add to bot-engine `.env`

## Testing

### Test the Bot Engine

```bash
curl -X POST http://localhost:3001/webhook/twilio/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM123456" \
  -d "From=whatsapp:+1234567890" \
  -d "To=whatsapp:+14155238886" \
  -d "Body=John"
```

### Test the Dashboard

1. Open http://localhost:3000
2. Sign up for an account
3. Complete onboarding
4. Configure your bot

### Test the Widget

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Page</h1>

  <script>
    (function() {
      const config = {
        whatsappNumber: 'whatsapp:+14155238886',
        message: 'Hola! Test message',
        brandingColor: '#FF6B6B',
        position: 'bottom-right'
      };

      const script = document.createElement('script');
      script.src = 'http://localhost:3000/widget.js';
      script.async = true;
      script.onload = function() {
        if (window.HolaTattooWidget) {
          window.HolaTattooWidget.init(config);
        }
      };
      document.head.appendChild(script);
    })();
  </script>
</body>
</html>
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql -h localhost -U your_user -d hola_tattoo
```

### Prisma Issues

```bash
# Regenerate client
cd packages/database
rm -rf node_modules/.prisma
npm run generate

# Reset database
npm run migrate -- reset
```

### Port Already in Use

```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.
