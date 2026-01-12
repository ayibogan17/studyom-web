CREATE TABLE "OpenJamMemory" (
  "id" TEXT PRIMARY KEY,
  "jamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "photoUrl" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "OpenJamMemory_jamId_fkey" FOREIGN KEY ("jamId") REFERENCES "OpenJam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpenJamMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OpenJamMemory_jamId_createdAt_idx" ON "OpenJamMemory"("jamId", "createdAt");
CREATE INDEX "OpenJamMemory_userId_createdAt_idx" ON "OpenJamMemory"("userId", "createdAt");

CREATE TABLE "OpenJamGalleryImage" (
  "id" TEXT PRIMARY KEY,
  "memoryId" TEXT,
  "photoUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "OpenJamGalleryImage_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "OpenJamMemory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "OpenJamGalleryImage_createdAt_idx" ON "OpenJamGalleryImage"("createdAt");
CREATE INDEX "OpenJamGalleryImage_memoryId_idx" ON "OpenJamGalleryImage"("memoryId");
