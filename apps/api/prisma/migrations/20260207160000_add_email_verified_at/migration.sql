-- Add email verification timestamp
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
