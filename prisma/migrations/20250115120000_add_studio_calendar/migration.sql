-- Studio calendar settings and blocks

CREATE TABLE IF NOT EXISTS "StudioCalendarSettings" (
  "id" TEXT PRIMARY KEY,
  "studioId" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  "slotStepMinutes" INTEGER NOT NULL DEFAULT 60,
  "dayCutoffHour" INTEGER NOT NULL DEFAULT 4,
  "weeklyHours" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudioCalendarSettings_studioId_key"
  ON "StudioCalendarSettings" ("studioId");

CREATE TABLE IF NOT EXISTS "StudioCalendarBlock" (
  "id" TEXT PRIMARY KEY,
  "studioId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT,
  "note" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "StudioCalendarBlock_studio_room_start_idx"
  ON "StudioCalendarBlock" ("studioId", "roomId", "startAt");

CREATE INDEX IF NOT EXISTS "StudioCalendarBlock_room_start_idx"
  ON "StudioCalendarBlock" ("roomId", "startAt");

ALTER TABLE "StudioCalendarSettings"
  ADD CONSTRAINT "StudioCalendarSettings_studio_fkey"
  FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE;

ALTER TABLE "StudioCalendarBlock"
  ADD CONSTRAINT "StudioCalendarBlock_studio_fkey"
  FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE;

ALTER TABLE "StudioCalendarBlock"
  ADD CONSTRAINT "StudioCalendarBlock_room_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE;

ALTER TABLE "StudioCalendarBlock"
  ADD CONSTRAINT "StudioCalendarBlock_user_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
