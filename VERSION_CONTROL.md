# Version Control Guide

## Current Versions

### Bot Engine v2.0.0 - "Pep - Flexible Conversational Bot"
**Release Date:** 2024-11-13

**Features:**
- ✅ Flexible conversation flow (not pushy)
- ✅ Passive tattoo info extraction with `extract_tattoo_info`
- ✅ Lead management (`send_to_studio`, `update_lead`, `close_conversation`)
- ✅ Price estimation with natural recap
- ✅ "Alguna cosa més?" pattern (1 yes, 2 no) for natural flow
- ✅ Smart response generation when GPT calls tools without text
- ✅ Support for general studio questions (location, hours, etc.)

**Active Config:** `PEP_CONFIG` (gpt-4o-mini)

---

### Dashboard v2.0.0 - "Dashboard with Bot Test & Templates"
**Release Date:** 2024-11-13

**Features:**
- ✅ Bot Test Chat (cost-free testing without Twilio)
- ✅ Template system for conversation testing & A/B testing
- ✅ Conversation history & debug info display
- ✅ Event tracking (send/update/close actions)
- ✅ Multi-tenant support
- ✅ Studio configuration management

---

## How to Check Version

### Bot Engine (Production)
```bash
curl https://your-bot-engine-url.com/health
```

Response:
```json
{
  "status": "healthy",
  "version": {
    "number": "2.0.0",
    "name": "Pep - Flexible Conversational Bot",
    "releaseDate": "2024-11-13",
    "config": "Pep",
    "full": "Bot Engine v2.0.0 (Pep - Flexible Conversational Bot)"
  },
  "services": {
    "database": "connected",
    "api": "running"
  }
}
```

### Dashboard (Production)
```bash
curl https://your-dashboard-url.com/api/health
```

Response:
```json
{
  "status": "healthy",
  "version": {
    "number": "2.0.0",
    "name": "Dashboard with Bot Test & Templates",
    "releaseDate": "2024-11-13",
    "full": "Dashboard v2.0.0 (Dashboard with Bot Test & Templates)"
  },
  "database": "connected"
}
```

---

## Deployment Checklist

### Before Deploying Bot Engine:
1. ✅ Update version in `apps/bot-engine/src/version.ts`
2. ✅ Update `BOT_VERSION.changes` array with new features
3. ✅ Verify `ACTIVE_CONFIG` in `botConfigs.ts`
4. ✅ Test with bot-test in dashboard first
5. ✅ Commit and push
6. ✅ Redeploy in Coolify
7. ✅ Check `/health` endpoint for version confirmation

### Before Deploying Dashboard:
1. ✅ Update version in `apps/dashboard/src/version.ts`
2. ✅ Update `DASHBOARD_VERSION.features` array with new features
3. ✅ Test locally first
4. ✅ Commit and push
5. ✅ Redeploy in Coolify
6. ✅ Check `/api/health` endpoint for version confirmation

---

## Version History

### v2.0.0 (2024-11-13)
**Major Update: Flexible Conversational Bot**
- Complete rewrite of conversation flow
- New tool-calling architecture (extract, send, update, close)
- Natural conversation patterns
- Cost-free testing system
- Template-based evaluation

### v1.0.0 (Initial)
- Basic qualification flow
- Direct extraction approach
- Simple confirmation system

---

## How to Update Version

### Bot Engine:
Edit `apps/bot-engine/src/version.ts`:
```typescript
export const BOT_VERSION = {
  version: '2.1.0', // Update this
  name: 'Pep - Flexible Conversational Bot',
  releaseDate: '2024-11-XX', // Update this
  changes: [
    // Add your new changes here
  ],
  config: 'PEP_CONFIG'
};
```

### Dashboard:
Edit `apps/dashboard/src/version.ts`:
```typescript
export const DASHBOARD_VERSION = {
  version: '2.1.0', // Update this
  name: 'Dashboard with Bot Test & Templates',
  releaseDate: '2024-11-XX', // Update this
  features: [
    // Add your new features here
  ]
};
```

---

## Troubleshooting

### "Version mismatch between test and production"
- Check bot-engine has been redeployed recently
- Verify `/health` endpoint shows correct version
- Redeploy bot-engine if version is old

### "Bot behaving differently in Twilio vs Test"
- Both use the same `conversationService.ts` and `ACTIVE_CONFIG`
- If behavior differs, likely old deployment (check version!)
- Redeploy bot-engine to sync

---

## Quick Commands

Check bot-engine version (production):
```bash
curl https://bot.holatattoo.co/health | jq '.version'
```

Check dashboard version (production):
```bash
curl https://dashboard.holatattoo.co/api/health | jq '.version'
```

Check both at once:
```bash
echo "Bot Engine:" && curl -s https://bot.holatattoo.co/health | jq '.version'
echo "Dashboard:" && curl -s https://dashboard.holatattoo.co/api/health | jq '.version'
```

