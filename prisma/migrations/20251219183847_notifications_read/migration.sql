/*
  Warnings:

  - Made the column `createdAt` on table `AdminAuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ProducerApplication` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `TeacherApplication` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `TeacherLead` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AdminAuditLog" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProducerApplication" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherApplication" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeacherLead" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
