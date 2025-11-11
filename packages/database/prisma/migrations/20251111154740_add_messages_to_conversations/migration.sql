-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "messages" JSONB NOT NULL DEFAULT '[]';
