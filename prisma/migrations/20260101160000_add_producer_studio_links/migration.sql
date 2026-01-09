-- CreateTable
CREATE TABLE "ProducerStudioLink" (
    "id" TEXT NOT NULL,
    "producerUserId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProducerStudioLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProducerStudioLink_studioId_status_idx" ON "ProducerStudioLink"("studioId", "status");

-- CreateIndex
CREATE INDEX "ProducerStudioLink_producerUserId_status_idx" ON "ProducerStudioLink"("producerUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ProducerStudioLink_producerUserId_studioId_key" ON "ProducerStudioLink"("producerUserId", "studioId");

-- AddForeignKey
ALTER TABLE "ProducerStudioLink" ADD CONSTRAINT "ProducerStudioLink_producerUserId_fkey" FOREIGN KEY ("producerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerStudioLink" ADD CONSTRAINT "ProducerStudioLink_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
