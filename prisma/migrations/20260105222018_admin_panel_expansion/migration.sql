-- Add roles/admin fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isSuspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

-- Studio application + moderation fields
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "applicationStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "applicationAdminNote" TEXT;
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "applicationAdminTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "applicationRejectReason" TEXT;
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "applicationChangesRequestedNote" TEXT;
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "visibilityStatus" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "complaintsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "flagsCount" INTEGER NOT NULL DEFAULT 0;

-- Teacher application admin fields
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "adminTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "changesRequestedNote" TEXT;
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "visibilityStatus" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "complaintsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "flagsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();

-- Producer application admin fields
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "adminTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "rejectReason" TEXT;
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "changesRequestedNote" TEXT;
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "visibilityStatus" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "complaintsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "flagsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();

-- Thread moderation fields
ALTER TABLE "StudioThread" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudioThread" ADD COLUMN IF NOT EXISTS "complaintsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StudioThread" ADD COLUMN IF NOT EXISTS "internalNote" TEXT;
ALTER TABLE "StudioThread" ADD COLUMN IF NOT EXISTS "investigationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudioThread" ADD COLUMN IF NOT EXISTS "resolved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "TeacherThread" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TeacherThread" ADD COLUMN IF NOT EXISTS "complaintsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TeacherThread" ADD COLUMN IF NOT EXISTS "internalNote" TEXT;
ALTER TABLE "TeacherThread" ADD COLUMN IF NOT EXISTS "investigationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TeacherThread" ADD COLUMN IF NOT EXISTS "resolved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProducerThread" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProducerThread" ADD COLUMN IF NOT EXISTS "complaintsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProducerThread" ADD COLUMN IF NOT EXISTS "internalNote" TEXT;
ALTER TABLE "ProducerThread" ADD COLUMN IF NOT EXISTS "investigationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProducerThread" ADD COLUMN IF NOT EXISTS "resolved" BOOLEAN NOT NULL DEFAULT false;

-- Audit log metadata
ALTER TABLE "AdminAuditLog" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Contact events (generic)
CREATE TABLE IF NOT EXISTS "ContactEvent" (
  "id" TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "userId" TEXT,
  "roomId" TEXT,
  "anonymousId" TEXT,
  "channel" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ContactEvent_entity_idx" ON "ContactEvent" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactEvent_user_idx" ON "ContactEvent" ("userId", "createdAt");

-- Content blocks
CREATE TABLE IF NOT EXISTS "ContentBlock" (
  "id" TEXT PRIMARY KEY,
  "contentKey" TEXT UNIQUE NOT NULL,
  "title" TEXT,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- System flags
CREATE TABLE IF NOT EXISTS "SystemFlag" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT UNIQUE NOT NULL,
  "value" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Data backfill for roles and visibility/status
UPDATE "User"
SET "roles" = (
  SELECT ARRAY(
    SELECT DISTINCT role
    FROM unnest(ARRAY[
      'musician',
      CASE WHEN "isTeacher" THEN 'teacher' END,
      CASE WHEN "isProducer" THEN 'producer' END,
      CASE WHEN "isStudioOwner" THEN 'studio_owner' END,
      CASE WHEN "role" = 'ADMIN' THEN 'admin' END,
      CASE WHEN "role" = 'STUDIO' THEN 'studio_owner' END
    ]) AS role
    WHERE role IS NOT NULL
  )
)
WHERE "roles" = '{}' OR "roles" IS NULL;

UPDATE "Studio"
SET "applicationStatus" = CASE WHEN "isActive" THEN 'approved' ELSE 'pending' END
WHERE "applicationStatus" IS NULL OR "applicationStatus" = '';

UPDATE "Studio"
SET "visibilityStatus" = CASE WHEN "isActive" THEN 'published' ELSE 'hidden' END
WHERE "visibilityStatus" IS NULL OR "visibilityStatus" = '';

UPDATE "TeacherApplication"
SET "visibilityStatus" = CASE WHEN status = 'approved' THEN 'published' ELSE 'draft' END
WHERE "visibilityStatus" IS NULL OR "visibilityStatus" = '';

UPDATE "ProducerApplication"
SET "visibilityStatus" = CASE WHEN status = 'approved' THEN 'published' ELSE 'draft' END
WHERE "visibilityStatus" IS NULL OR "visibilityStatus" = '';
