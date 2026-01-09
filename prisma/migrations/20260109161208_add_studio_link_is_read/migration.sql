-- AlterTable
ALTER TABLE "ProducerStudioLink" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TeacherStudioLink" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;
