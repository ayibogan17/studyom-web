/*
  Warnings:

  - Made the column `createdAt` on table `ContactEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ContentBlock` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ContentBlock` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ProducerMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ProducerThread` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ProducerThread` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `StudioCalendarBlock` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `StudioCalendarBlock` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `StudioCalendarSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `StudioCalendarSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `StudioContactEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `StudioHappyHourSlot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `StudioHappyHourSlot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `StudioMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `StudioThread` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `StudioThread` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `SystemFlag` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `SystemFlag` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProducerMessage" DROP CONSTRAINT "ProducerMessage_thread_fkey";

-- DropForeignKey
ALTER TABLE "ProducerThread" DROP CONSTRAINT "ProducerThread_producerUser_fkey";

-- DropForeignKey
ALTER TABLE "ProducerThread" DROP CONSTRAINT "ProducerThread_studentUser_fkey";

-- DropForeignKey
ALTER TABLE "StudioCalendarBlock" DROP CONSTRAINT "StudioCalendarBlock_room_fkey";

-- DropForeignKey
ALTER TABLE "StudioCalendarBlock" DROP CONSTRAINT "StudioCalendarBlock_studio_fkey";

-- DropForeignKey
ALTER TABLE "StudioCalendarBlock" DROP CONSTRAINT "StudioCalendarBlock_user_fkey";

-- DropForeignKey
ALTER TABLE "StudioCalendarSettings" DROP CONSTRAINT "StudioCalendarSettings_studio_fkey";

-- DropForeignKey
ALTER TABLE "StudioContactEvent" DROP CONSTRAINT "StudioContactEvent_studio_fkey";

-- DropForeignKey
ALTER TABLE "StudioContactEvent" DROP CONSTRAINT "StudioContactEvent_user_fkey";

-- DropForeignKey
ALTER TABLE "StudioHappyHourSlot" DROP CONSTRAINT "StudioHappyHourSlot_room_fkey";

-- DropForeignKey
ALTER TABLE "StudioHappyHourSlot" DROP CONSTRAINT "StudioHappyHourSlot_studio_fkey";

-- DropForeignKey
ALTER TABLE "StudioHappyHourSlot" DROP CONSTRAINT "StudioHappyHourSlot_user_fkey";

-- DropForeignKey
ALTER TABLE "StudioMessage" DROP CONSTRAINT "StudioMessage_thread_fkey";

-- DropForeignKey
ALTER TABLE "StudioThread" DROP CONSTRAINT "StudioThread_studentUser_fkey";

-- DropForeignKey
ALTER TABLE "StudioThread" DROP CONSTRAINT "StudioThread_studio_fkey";

-- AlterTable
ALTER TABLE "ContactEvent" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ContentBlock" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProducerApplication" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProducerMessage" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProducerThread" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioCalendarBlock" ALTER COLUMN "startAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioCalendarSettings" ADD COLUMN     "bookingApprovalMode" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "bookingCutoffUnit" TEXT,
ADD COLUMN     "bookingCutoffValue" INTEGER,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioContactEvent" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioHappyHourSlot" ALTER COLUMN "startAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "endAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioMessage" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudioThread" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SystemFlag" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherApplication" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherMessage" ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TeacherMessage_threadId_readAt_idx" ON "TeacherMessage"("threadId", "readAt");

-- AddForeignKey
ALTER TABLE "StudioCalendarSettings" ADD CONSTRAINT "StudioCalendarSettings_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioCalendarBlock" ADD CONSTRAINT "StudioCalendarBlock_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioCalendarBlock" ADD CONSTRAINT "StudioCalendarBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioCalendarBlock" ADD CONSTRAINT "StudioCalendarBlock_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioHappyHourSlot" ADD CONSTRAINT "StudioHappyHourSlot_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioHappyHourSlot" ADD CONSTRAINT "StudioHappyHourSlot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioHappyHourSlot" ADD CONSTRAINT "StudioHappyHourSlot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerThread" ADD CONSTRAINT "ProducerThread_producerUserId_fkey" FOREIGN KEY ("producerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerThread" ADD CONSTRAINT "ProducerThread_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerMessage" ADD CONSTRAINT "ProducerMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ProducerThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioThread" ADD CONSTRAINT "StudioThread_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioThread" ADD CONSTRAINT "StudioThread_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioMessage" ADD CONSTRAINT "StudioMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "StudioThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContactEvent" ADD CONSTRAINT "StudioContactEvent_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioContactEvent" ADD CONSTRAINT "StudioContactEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEvent" ADD CONSTRAINT "ContactEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ContactEvent_entity_idx" RENAME TO "ContactEvent_entityType_entityId_createdAt_idx";

-- RenameIndex
ALTER INDEX "ContactEvent_user_idx" RENAME TO "ContactEvent_userId_createdAt_idx";

-- RenameIndex
ALTER INDEX "ProducerMessage_thread_idx" RENAME TO "ProducerMessage_threadId_createdAt_idx";

-- RenameIndex
ALTER INDEX "ProducerMessage_thread_read_idx" RENAME TO "ProducerMessage_threadId_readAt_idx";

-- RenameIndex
ALTER INDEX "ProducerThread_producer_idx" RENAME TO "ProducerThread_producerUserId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "ProducerThread_student_idx" RENAME TO "ProducerThread_studentUserId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "ProducerThread_unique_producer_student" RENAME TO "ProducerThread_producerSlug_studentUserId_key";

-- RenameIndex
ALTER INDEX "StudioCalendarBlock_room_start_idx" RENAME TO "StudioCalendarBlock_roomId_startAt_idx";

-- RenameIndex
ALTER INDEX "StudioCalendarBlock_studio_room_start_idx" RENAME TO "StudioCalendarBlock_studioId_roomId_startAt_idx";

-- RenameIndex
ALTER INDEX "StudioContactEvent_studio_idx" RENAME TO "StudioContactEvent_studioId_createdAt_idx";

-- RenameIndex
ALTER INDEX "StudioContactEvent_user_idx" RENAME TO "StudioContactEvent_userId_createdAt_idx";

-- RenameIndex
ALTER INDEX "StudioHappyHourSlot_room_start_end_key" RENAME TO "StudioHappyHourSlot_roomId_startAt_endAt_key";

-- RenameIndex
ALTER INDEX "StudioHappyHourSlot_room_start_idx" RENAME TO "StudioHappyHourSlot_roomId_startAt_idx";

-- RenameIndex
ALTER INDEX "StudioHappyHourSlot_studio_room_start_idx" RENAME TO "StudioHappyHourSlot_studioId_roomId_startAt_idx";

-- RenameIndex
ALTER INDEX "StudioMessage_thread_idx" RENAME TO "StudioMessage_threadId_createdAt_idx";

-- RenameIndex
ALTER INDEX "StudioMessage_thread_read_idx" RENAME TO "StudioMessage_threadId_readAt_idx";

-- RenameIndex
ALTER INDEX "StudioThread_student_idx" RENAME TO "StudioThread_studentUserId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "StudioThread_studio_idx" RENAME TO "StudioThread_studioId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "StudioThread_unique_studio_student" RENAME TO "StudioThread_studioId_studentUserId_key";
