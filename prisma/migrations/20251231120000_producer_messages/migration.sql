-- Producer messaging (threads + messages)

CREATE TABLE IF NOT EXISTS "ProducerThread" (
  "id" TEXT PRIMARY KEY,
  "producerSlug" TEXT NOT NULL,
  "producerUserId" TEXT NOT NULL,
  "studentUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ProducerMessage" (
  "id" TEXT PRIMARY KEY,
  "threadId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "senderUserId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "readAt" TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProducerThread_unique_producer_student"
  ON "ProducerThread" ("producerSlug", "studentUserId");

CREATE INDEX IF NOT EXISTS "ProducerThread_producer_idx"
  ON "ProducerThread" ("producerUserId", "updatedAt");

CREATE INDEX IF NOT EXISTS "ProducerThread_student_idx"
  ON "ProducerThread" ("studentUserId", "updatedAt");

CREATE INDEX IF NOT EXISTS "ProducerMessage_thread_idx"
  ON "ProducerMessage" ("threadId", "createdAt");

CREATE INDEX IF NOT EXISTS "ProducerMessage_thread_read_idx"
  ON "ProducerMessage" ("threadId", "readAt");

ALTER TABLE "ProducerThread"
  ADD CONSTRAINT "ProducerThread_producerUser_fkey"
  FOREIGN KEY ("producerUserId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "ProducerThread"
  ADD CONSTRAINT "ProducerThread_studentUser_fkey"
  FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "ProducerMessage"
  ADD CONSTRAINT "ProducerMessage_thread_fkey"
  FOREIGN KEY ("threadId") REFERENCES "ProducerThread"("id") ON DELETE CASCADE;
