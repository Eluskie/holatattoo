# Hola Tattoo - WhatsApp Lead Qualification Bot Platform

A multi-tenant SaaS platform that allows tattoo studios (and other businesses) to create WhatsApp chatbots that qualify leads and send them to custom webhooks.

## Project Structure

```
/
├── apps/
│   ├── dashboard/          # Next.js frontend (studio dashboard)
│   └── bot-engine/         # Express backend (WhatsApp bot)
├── packages/
│   ├── database/           # Prisma schema + migrations
│   ├── shared-types/       # TypeScript types
│   └── widget/             # Embeddable widget (vanilla JS)
└── package.json            # npm workspaces
```

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL + Prisma
- Twilio WhatsApp Business API
- Anthropic Claude API

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS
- Clerk/NextAuth for authentication

### Widget
- Vanilla JavaScript
- Lightweight (<10kb)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Twilio account with WhatsApp Business API
- Anthropic API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see `.env.example` files in each app)

4. Run database migrations:
   ```bash
   cd packages/database
   npm run migrate
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## Development

- **Bot Engine**: `cd apps/bot-engine && npm run dev`
- **Dashboard**: `cd apps/dashboard && npm run dev`
- **Database**: `cd packages/database && npm run studio`

## Environment Variables

See individual `.env.example` files in:
- `apps/bot-engine/.env.example`
- `apps/dashboard/.env.example`

## License

MIT
