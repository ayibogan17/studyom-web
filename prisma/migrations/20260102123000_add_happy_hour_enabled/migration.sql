-- Add happy hour enabled flag to calendar settings
ALTER TABLE "StudioCalendarSettings"
  ADD COLUMN IF NOT EXISTS "happyHourEnabled" BOOLEAN NOT NULL DEFAULT false;
