CREATE TABLE "StudioReservationRequest" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentUserId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "note" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'TRY',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userUnread" BOOLEAN NOT NULL DEFAULT true,
    "studioUnread" BOOLEAN NOT NULL DEFAULT true,
    "calendarBlockId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioReservationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudioReservationRequest_calendarBlockId_key" ON "StudioReservationRequest"("calendarBlockId");
CREATE INDEX "StudioReservationRequest_studioId_createdAt_idx" ON "StudioReservationRequest"("studioId", "createdAt");
CREATE INDEX "StudioReservationRequest_roomId_startAt_idx" ON "StudioReservationRequest"("roomId", "startAt");
CREATE INDEX "StudioReservationRequest_studentUserId_updatedAt_idx" ON "StudioReservationRequest"("studentUserId", "updatedAt");

ALTER TABLE "StudioReservationRequest" ADD CONSTRAINT "StudioReservationRequest_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioReservationRequest" ADD CONSTRAINT "StudioReservationRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudioReservationRequest" ADD CONSTRAINT "StudioReservationRequest_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudioReservationRequest" ADD CONSTRAINT "StudioReservationRequest_calendarBlockId_fkey" FOREIGN KEY ("calendarBlockId") REFERENCES "StudioCalendarBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
