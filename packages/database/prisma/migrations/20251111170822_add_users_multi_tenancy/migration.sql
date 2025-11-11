-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AlterTable
ALTER TABLE "studios" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "studios_user_id_idx" ON "studios"("user_id");

-- AddForeignKey
ALTER TABLE "studios" ADD CONSTRAINT "studios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: Create a default system user for existing studios
INSERT INTO "users" ("id", "email", "name", "created_at", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000000', 'system@holatattoo.com', 'System', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;

-- Link existing studios to system user
UPDATE "studios" SET "user_id" = '00000000-0000-0000-0000-000000000000' WHERE "user_id" IS NULL;

-- Make user_id NOT NULL after data migration
ALTER TABLE "studios" ALTER COLUMN "user_id" SET NOT NULL;

