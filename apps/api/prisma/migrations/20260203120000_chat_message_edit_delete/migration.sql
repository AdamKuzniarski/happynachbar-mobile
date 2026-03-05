-- Add edit/delete metadata for chat messages
ALTER TABLE "Message"
  ADD COLUMN "editedAt" TIMESTAMP(3),
  ADD COLUMN "deletedAt" TIMESTAMP(3);
