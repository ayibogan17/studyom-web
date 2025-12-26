-- Producer message requests (controlled messaging)

CREATE TABLE IF NOT EXISTS "ProducerMessageRequest" (
  "id" TEXT PRIMARY KEY,
  "fromUserId" TEXT NOT NULL,
  "producerUserId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ProducerMessageRequest_producer_status_idx"
  ON "ProducerMessageRequest" ("producerUserId", "status");

CREATE INDEX IF NOT EXISTS "ProducerMessageRequest_sender_producer_status_idx"
  ON "ProducerMessageRequest" ("fromUserId", "producerUserId", "status");

ALTER TABLE "ProducerMessageRequest"
  ADD CONSTRAINT "ProducerMessageRequest_fromUser_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "ProducerMessageRequest"
  ADD CONSTRAINT "ProducerMessageRequest_producerUser_fkey"
  FOREIGN KEY ("producerUserId") REFERENCES "User"("id") ON DELETE CASCADE;
