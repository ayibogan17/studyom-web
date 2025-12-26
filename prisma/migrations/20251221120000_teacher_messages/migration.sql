-- Teacher messaging (threads + messages)

CREATE TABLE IF NOT EXISTS "TeacherThread" (
  "id" TEXT PRIMARY KEY,
  "teacherSlug" TEXT NOT NULL,
  "teacherUserId" TEXT NOT NULL,
  "studentUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "TeacherMessage" (
  "id" TEXT PRIMARY KEY,
  "threadId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "senderUserId" TEXT,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeacherThread_unique_teacher_student"
  ON "TeacherThread" ("teacherSlug", "studentUserId");

CREATE INDEX IF NOT EXISTS "TeacherThread_teacher_idx"
  ON "TeacherThread" ("teacherUserId", "updatedAt");

CREATE INDEX IF NOT EXISTS "TeacherThread_student_idx"
  ON "TeacherThread" ("studentUserId", "updatedAt");

CREATE INDEX IF NOT EXISTS "TeacherMessage_thread_idx"
  ON "TeacherMessage" ("threadId", "createdAt");

ALTER TABLE "TeacherThread"
  ADD CONSTRAINT "TeacherThread_teacherUser_fkey"
  FOREIGN KEY ("teacherUserId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "TeacherThread"
  ADD CONSTRAINT "TeacherThread_studentUser_fkey"
  FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE;

ALTER TABLE "TeacherMessage"
  ADD CONSTRAINT "TeacherMessage_thread_fkey"
  FOREIGN KEY ("threadId") REFERENCES "TeacherThread"("id") ON DELETE CASCADE;
