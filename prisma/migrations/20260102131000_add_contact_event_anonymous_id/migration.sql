-- Add anonymous id to contact events
ALTER TABLE "StudioContactEvent"
  ADD COLUMN IF NOT EXISTS "anonymousId" TEXT;
