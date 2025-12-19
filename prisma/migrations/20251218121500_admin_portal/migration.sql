-- Admin portal baseline migration (safe, idempotent)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isDisabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "TeacherApplication" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ProducerApplication" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "TeacherLead" (
  "id" TEXT PRIMARY KEY,
  "teacherSlug" TEXT NOT NULL,
  "teacherName" TEXT,
  "studentName" TEXT NOT NULL,
  "studentEmail" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "preferredLessonType" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "note" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT PRIMARY KEY,
  "adminId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);
