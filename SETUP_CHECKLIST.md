# Multi-Tenant Hola Tattoo - Setup Checklist

## ✅ What's Done

- [x] Database schema updated (User → Studio → Conversations)
- [x] Migration created and ready to run
- [x] Supabase packages installed in dashboard
- [x] Auth pages created (login/signup)
- [x] Protected routes with middleware
- [x] User-specific data filtering
- [x] Onboarding flow for new users
- [x] Updated all API routes to be user-specific

## 📋 What You Need To Do

### 1. Create Supabase Project (5 minutes)

- [ ] Go to https://supabase.com
- [ ] Create new project
- [ ] Copy Project URL and Anon Key
- [ ] Go to Authentication → URL Configuration
- [ ] Set Site URL and Redirect URLs (see MULTI_TENANT_SETUP.md)

### 2. Configure Environment Variables (2 minutes)

Create `apps/dashboard/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
DATABASE_URL=[YOUR-EXISTING-DATABASE-URL]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migration (1 minute)

```bash
cd packages/database
npx prisma migrate deploy  # or npm run migrate for dev
npx prisma generate        # regenerate Prisma client
```

### 4. Test Locally (5 minutes)

```bash
# Terminal 1
cd apps/dashboard
npm run dev

# Terminal 2
cd apps/bot-engine  
npm run dev
```

Visit http://localhost:3000 and sign up!

### 5. Deploy (15 minutes)

**Option A: Dashboard on Vercel**
```bash
cd apps/dashboard
vercel
# Add environment variables in Vercel UI
```

**Option B: Dashboard on Coolify**
- Same process as bot-engine
- Point to `apps/dashboard`
- Add environment variables

## 🚀 Your URLs

Based on your existing deployment:

- **Bot Engine**: `https://bot.withflare.so` ✅ Already deployed
- **Dashboard**: `https://dashboard.withflare.so` (or wherever you deploy it)

## 🧪 Testing Multi-Tenancy

1. Create Account 1: `user1@example.com`
2. Complete onboarding → Create "Studio A"
3. Logout
4. Create Account 2: `user2@example.com`
5. Complete onboarding → Create "Studio B"
6. Send WhatsApp messages to both studios
7. Verify each user only sees their own conversations ✅

## 📞 WhatsApp Setup Reminder

Each studio can have its own Twilio WhatsApp number! To add more:

1. Get new Twilio WhatsApp number
2. User adds it in their Settings page
3. Update Twilio webhook to point to `https://bot.withflare.so/webhook/twilio/whatsapp`
4. Bot engine automatically routes based on the number

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Unauthorized" | Check Supabase keys in .env.local |
| Can't sign up | Check Supabase email provider is enabled |
| Migration fails | Make sure DATABASE_URL is correct |
| Bot not working | Bot engine doesn't need changes! Already works |

## 🎯 Next Features (Optional)

- [ ] Email templates in Supabase
- [ ] Custom domains for studios
- [ ] Billing with Stripe
- [ ] Team members (multiple users per studio)
- [ ] Analytics dashboard
- [ ] SMS fallback

## 📚 Documentation

- **Multi-tenant setup**: `MULTI_TENANT_SETUP.md`
- **Bot deployment**: `COOLIFY_DEPLOYMENT.md`
- **Project README**: `README.md`

---

**Questions?** Check the `MULTI_TENANT_SETUP.md` file for detailed instructions!

