-- DropIndex
DROP INDEX "studios_email_key";

-- CreateTable
CREATE TABLE "test_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "finalData" JSONB NOT NULL DEFAULT '{}',
    "finalStatus" TEXT NOT NULL DEFAULT 'active',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "leadSent" BOOLEAN NOT NULL DEFAULT false,
    "events" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_templates_pkey" PRIMARY KEY ("id")
);
