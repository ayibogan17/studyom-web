-- Add happy hour rate to rooms

ALTER TABLE "Room"
  ADD COLUMN IF NOT EXISTS "happyHourRate" TEXT;
