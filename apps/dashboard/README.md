# Dashboard

Next.js frontend application for the Hola Tattoo bot platform.

## Features

- Studio management
- Bot configuration
- Conversation monitoring
- Widget code generation
- User authentication with Clerk
- Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Clerk (Authentication)
- Prisma (Database)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Configure `.env.local` with your credentials

4. Run database migrations:
   ```bash
   cd ../../packages/database
   npm run migrate
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── sign-in/             # Sign in page
│   ├── sign-up/             # Sign up page
│   ├── onboarding/          # Onboarding flow
│   ├── dashboard/           # Dashboard pages
│   │   ├── page.tsx         # Conversations list
│   │   ├── settings/        # Studio settings
│   │   ├── bot-config/      # Bot configuration
│   │   └── widget/          # Widget code
│   └── api/                 # API routes
│       ├── studio/          # Studio CRUD
│       └── bot-config/      # Bot config CRUD
└── middleware.ts            # Auth middleware
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for required environment variables.

## Authentication

This app uses Clerk for authentication. Set up:

1. Create a Clerk account
2. Create a new application
3. Copy API keys to `.env.local`
4. Configure redirect URLs

## Database Access

The dashboard shares the same database as the bot-engine through the `@hola-tattoo/database` package.

## Deployment

Deploy to Vercel:

```bash
vercel
```

See [DEPLOYMENT.md](../../DEPLOYMENT.md) for detailed instructions.

## Features Overview

### Landing Page
- Marketing content
- Sign up CTA
- Feature highlights

### Onboarding Flow
1. Studio information
2. Bot configuration
3. Completion + next steps

### Dashboard
- Conversation statistics
- Recent conversations list
- Quick access to settings

### Settings Page
- Studio name
- WhatsApp number
- Webhook URL configuration

### Bot Config Page
- Welcome message
- Question builder
- Brand color picker

### Widget Page
- Generated widget code
- Copy to clipboard
- Preview
- Installation instructions

## License

MIT
