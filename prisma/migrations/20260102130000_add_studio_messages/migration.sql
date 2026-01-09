-- Studio messaging (threads + messages) and contact events

CREATE TABLE IF NOT EXISTS "StudioThread" (
  "id" TEXT PRIMARY KEY,
  "studioId" TEXT NOT NULL,
  "studentUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "StudioMessage" (
  "id" TEXT PRIMARY KEY,
  "threadId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "senderUserId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "readAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "StudioContactEvent" (
  "id" TEXT PRIMARY KEY,
  "studioId" TEXT NOT NULL,
  "userId" TEXT,
  "roomId" TEXT,
  "channel" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "StudioThread_unique_studio_student"
  ON "StudioThread" ("studioId", "studentUserId");

CREATE INDEX IF NOT EXISTS "StudioThread_studio_idx"
  ON "StudioThread" ("studioId", "updatedAt");

CREATE INDEX IF NOT EXISTS "StudioThread_student_idx"
  ON "StudioThread" ("studentUserId", "updatedAt");

CREATE INDEX IF NOT EXISTS "StudioMessage_thread_idx"
  ON "StudioMessage" ("threadId", "createdAt");

CREATE INDEX IF NOT EXISTS "StudioMessage_thread_read_idx"
  ON "StudioMessage" ("threadId", "readAt");

CREATE INDEX IF NOT EXISTS "StudioContactEvent_studio_idx"
  ON "StudioContactEvent" ("studioId", "createdAt");

CREATE INDEX IF NOT EXISTS "StudioContactEvent_user_idx"
  ON "StudioContactEvent" ("userId", "createdAt");

ALTER TABLE "StudioThread"
  ADD CONSTRAINT "StudioThread_studio_fkey"
  FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE;

ALTER TABLE "StudioThread"
  ADD CONSTRAINT "StudioThread_studentUser_fkey"
  FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "StudioMessage"
  ADD CONSTRAINT "StudioMessage_thread_fkey"
  FOREIGN KEY ("threadId") REFERENCES "StudioThread"("id") ON DELETE CASCADE;

ALTER TABLE "StudioContactEvent"
  ADD CONSTRAINT "StudioContactEvent_studio_fkey"
  FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE;

ALTER TABLE "StudioContactEvent"
  ADD CONSTRAINT "StudioContactEvent_user_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
