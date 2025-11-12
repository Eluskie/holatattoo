# How to Switch Bot Configurations

This bot now supports multiple configurations that can be easily switched.

## Available Configurations

### 🎯 **Pep** (Default - Recommended)
- Structured conversational approach
- Can answer studio questions naturally
- Clear goal-driven flow with flexibility
- Multiple tools: answer questions, extract info, send to studio, close conversation
- Inspired by production-grade systems
- Better handling of edge cases

### 📝 **Current** (Backup)
- Original conversational approach
- Passive extraction
- Confirmation-based flow
- Good for comparison

## How to Switch

**Option 1: Change the default (Affects all conversations)**

Edit `/apps/bot-engine/src/config/botConfigs.ts`:

```typescript
// Line ~218
export const ACTIVE_CONFIG = PEP_CONFIG; // <-- Change this line

// Options:
// PEP_CONFIG - Use Pep (recommended)
// CURRENT_CONFIG - Use original approach
```

**Option 2: Per-conversation testing**

In `/apps/bot-engine/src/services/conversationService.ts`, you can temporarily override:

```typescript
// Line ~255
const aiResponse = await getConversationalResponse(
  userMessage, 
  context, 
  CURRENT_CONFIG  // <-- Force specific config for testing
);
```

## What Changes Between Configs

| Aspect | Pep | Current |
|--------|-----|---------|
| **System Prompt** | Structured with clear script | Conversational guidelines |
| **Tools** | 4 tools (answer, extract, send, close) | 1 tool (extract only) |
| **Questions** | Can answer studio info | Limited |
| **Flow** | Flexible script-based | Confirmation-based |
| **Completion** | Bot decides when ready | Fixed rules |

## Monitoring

Both configs log metrics:
- Check console for `📊 [METRICS]` logs
- Shows: config used, outcome, message count, tools used

## Rollback Plan

If Pep has issues:
1. Open `/apps/bot-engine/src/config/botConfigs.ts`
2. Change `ACTIVE_CONFIG = PEP_CONFIG` to `ACTIVE_CONFIG = CURRENT_CONFIG`
3. Redeploy

That's it! One line change.

## Future: A/B Testing

To A/B test both configs:
1. Add variant field to conversation when created
2. Random assignment (50% Pep, 50% Current)
3. Compare metrics after 100+ conversations each

(Not implemented yet - start with Pep first)

