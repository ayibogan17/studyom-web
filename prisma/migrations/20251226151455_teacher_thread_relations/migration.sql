/*
  Warnings:

  - Made the column `createdAt` on table `ProducerMessageRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ProducerMessageRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `TeacherMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `TeacherThread` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `TeacherThread` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProducerMessageRequest" DROP CONSTRAINT "ProducerMessageRequest_fromUser_fkey";

-- DropForeignKey
ALTER TABLE "ProducerMessageRequest" DROP CONSTRAINT "ProducerMessageRequest_producerUser_fkey";

-- DropForeignKey
ALTER TABLE "TeacherMessage" DROP CONSTRAINT "TeacherMessage_thread_fkey";

-- DropForeignKey
ALTER TABLE "TeacherThread" DROP CONSTRAINT "TeacherThread_studentUser_fkey";

-- DropForeignKey
ALTER TABLE "TeacherThread" DROP CONSTRAINT "TeacherThread_teacherUser_fkey";

-- AlterTable
ALTER TABLE "ProducerMessageRequest" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherMessage" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherThread" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ProducerMessageRequest" ADD CONSTRAINT "ProducerMessageRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProducerMessageRequest" ADD CONSTRAINT "ProducerMessageRequest_producerUserId_fkey" FOREIGN KEY ("producerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherThread" ADD CONSTRAINT "TeacherThread_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherThread" ADD CONSTRAINT "TeacherThread_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMessage" ADD CONSTRAINT "TeacherMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "TeacherThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ProducerMessageRequest_producer_status_idx" RENAME TO "ProducerMessageRequest_producerUserId_status_idx";

-- RenameIndex
ALTER INDEX "ProducerMessageRequest_sender_producer_status_idx" RENAME TO "ProducerMessageRequest_fromUserId_producerUserId_status_idx";

-- RenameIndex
ALTER INDEX "TeacherMessage_thread_idx" RENAME TO "TeacherMessage_threadId_createdAt_idx";

-- RenameIndex
ALTER INDEX "TeacherThread_student_idx" RENAME TO "TeacherThread_studentUserId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "TeacherThread_teacher_idx" RENAME TO "TeacherThread_teacherUserId_updatedAt_idx";

-- RenameIndex
ALTER INDEX "TeacherThread_unique_teacher_student" RENAME TO "TeacherThread_teacherSlug_studentUserId_key";
