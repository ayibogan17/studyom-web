-- CreateTable
CREATE TABLE "TeacherStudioLink" (
    "id" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherStudioLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherStudioLink_studioId_status_idx" ON "TeacherStudioLink"("studioId", "status");

-- CreateIndex
CREATE INDEX "TeacherStudioLink_teacherUserId_status_idx" ON "TeacherStudioLink"("teacherUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherStudioLink_teacherUserId_studioId_key" ON "TeacherStudioLink"("teacherUserId", "studioId");

-- AddForeignKey
ALTER TABLE "TeacherStudioLink" ADD CONSTRAINT "TeacherStudioLink_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherStudioLink" ADD CONSTRAINT "TeacherStudioLink_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
