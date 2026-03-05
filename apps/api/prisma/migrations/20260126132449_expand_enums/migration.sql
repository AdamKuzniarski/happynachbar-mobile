/*
  Warnings:

  - Changed the type of `action` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entityType` on the `AuditLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'ACTIVITY', 'USER_WARNING');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_ROLE_CHANGED', 'USER_BANNED', 'USER_UNBANNED', 'USER_WARNING_CREATED', 'ACTIVITY_ARCHIVED', 'ACTIVITY_RESTORED', 'ACTIVITIES_BULK_STATUS_CHANGED');

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL,
DROP COLUMN "entityType",
ADD COLUMN     "entityType" "AuditEntityType" NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
