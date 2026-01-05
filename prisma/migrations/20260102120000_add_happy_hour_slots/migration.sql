-- Happy Hour slots for studio calendar

CREATE TABLE IF NOT EXISTS "StudioHappyHourSlot" (
  "id" TEXT PRIMARY KEY,
  "studioId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudioHappyHourSlot_room_start_end_key"
  ON "StudioHappyHourSlot" ("roomId", "startAt", "endAt");

CREATE INDEX IF NOT EXISTS "StudioHappyHourSlot_studio_room_start_idx"
  ON "StudioHappyHourSlot" ("studioId", "roomId", "startAt");

CREATE INDEX IF NOT EXISTS "StudioHappyHourSlot_room_start_idx"
  ON "StudioHappyHourSlot" ("roomId", "startAt");

ALTER TABLE "StudioHappyHourSlot"
  ADD CONSTRAINT "StudioHappyHourSlot_studio_fkey"
  FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE;

ALTER TABLE "StudioHappyHourSlot"
  ADD CONSTRAINT "StudioHappyHourSlot_room_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE;

ALTER TABLE "StudioHappyHourSlot"
  ADD CONSTRAINT "StudioHappyHourSlot_user_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL;
