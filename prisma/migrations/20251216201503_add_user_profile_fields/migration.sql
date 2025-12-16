-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "intent" TEXT[],
ADD COLUMN     "isProducer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isStudioOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTeacher" BOOLEAN NOT NULL DEFAULT false;
