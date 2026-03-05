-- Add fields for "Forgot Password" (Option A: hashed reset token + expiry)

ALTER TABLE "User"
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3);

-- Unique hash so a token maps to exactly one user (NULL is allowed multiple times in Postgres)
CREATE UNIQUE INDEX "User_passwordResetTokenHash_key" ON "User"("passwordResetTokenHash");
