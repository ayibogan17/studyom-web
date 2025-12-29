-- CreateTable
CREATE TABLE "TeacherMessageRequest" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "teacherUserId" TEXT NOT NULL,
    "teacherSlug" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherMessageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherMessageRequest_teacherUserId_status_idx" ON "TeacherMessageRequest"("teacherUserId", "status");

-- CreateIndex
CREATE INDEX "TeacherMessageRequest_studentUserId_teacherUserId_status_idx" ON "TeacherMessageRequest"("studentUserId", "teacherUserId", "status");

-- AddForeignKey
ALTER TABLE "TeacherMessageRequest" ADD CONSTRAINT "TeacherMessageRequest_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherMessageRequest" ADD CONSTRAINT "TeacherMessageRequest_teacherUserId_fkey" FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
