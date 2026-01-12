-- Create OpenJam tables
CREATE TABLE "OpenJam" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdByUserId" TEXT NOT NULL,
  "studioId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "note" TEXT,
  "startAt" TIMESTAMPTZ NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "neededInstruments" TEXT[] NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "capacity" INTEGER NOT NULL DEFAULT 5,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "OpenJam_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "OpenJam_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OpenJamParticipant" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "instrument" TEXT,
  "status" TEXT NOT NULL DEFAULT 'joined',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "OpenJamParticipant_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "OpenJam"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpenJamParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OpenJamMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "OpenJamMessage_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "OpenJam"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpenJamMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OpenJamParticipant_jamId_userId_key" ON "OpenJamParticipant"("jamId", "userId");
CREATE INDEX "OpenJam_studioId_idx" ON "OpenJam"("studioId");
CREATE INDEX "OpenJam_city_idx" ON "OpenJam"("city");
CREATE INDEX "OpenJam_startAt_idx" ON "OpenJam"("startAt");
CREATE INDEX "OpenJamParticipant_jamId_idx" ON "OpenJamParticipant"("jamId");
CREATE INDEX "OpenJamMessage_jamId_createdAt_idx" ON "OpenJamMessage"("jamId", "createdAt");
