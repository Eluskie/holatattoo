-- Add lead tracking fields to conversations table
ALTER TABLE "conversations" ADD COLUMN "lead_status" TEXT;
ALTER TABLE "conversations" ADD COLUMN "lead_sent_at" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN "last_updated_at" TIMESTAMP(3);

-- Add conversation closure fields
ALTER TABLE "conversations" ADD COLUMN "closed_at" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN "close_reason" TEXT;

-- Add pending update field for confirmation flow
ALTER TABLE "conversations" ADD COLUMN "pending_update" JSONB;

-- Add index for leadStatus
CREATE INDEX "conversations_lead_status_idx" ON "conversations"("lead_status");

-- Update existing conversations to have leadStatus = 'pending'
UPDATE "conversations" SET "lead_status" = 'pending' WHERE "lead_status" IS NULL;
