import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaInit?: Promise<void>;
};

async function ensureAdminSchema(client: PrismaClient) {
  // Add columns used by admin/guard flows
  await client.$executeRawUnsafe(
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isDisabled" BOOLEAN NOT NULL DEFAULT false',
  );
  await client.$executeRawUnsafe(
    'ALTER TABLE "Studio" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true',
  );

  // Ensure teacher application table exists (legacy raw table)
  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "TeacherApplication" ("id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL, "data" JSONB NOT NULL, "status" TEXT NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT now())',
  );
  await client.$executeRawUnsafe(
    'ALTER TABLE "TeacherApplication" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'pending\'',
  );

  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "ProducerApplication" ("id" SERIAL PRIMARY KEY, "userId" TEXT NOT NULL, "data" JSONB NOT NULL, "status" TEXT NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT now())',
  );
  await client.$executeRawUnsafe(
    'ALTER TABLE "ProducerApplication" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'pending\'',
  );

  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "ProducerMessageRequest" ("id" TEXT PRIMARY KEY, "fromUserId" TEXT NOT NULL, "producerUserId" TEXT NOT NULL, "message" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT \'pending\', "createdAt" TIMESTAMPTZ DEFAULT now(), "updatedAt" TIMESTAMPTZ DEFAULT now())',
  );

  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "ProducerThread" ("id" TEXT PRIMARY KEY, "producerSlug" TEXT NOT NULL, "producerUserId" TEXT NOT NULL, "studentUserId" TEXT NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT now(), "updatedAt" TIMESTAMPTZ DEFAULT now())',
  );
  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "ProducerMessage" ("id" TEXT PRIMARY KEY, "threadId" TEXT NOT NULL, "senderRole" TEXT NOT NULL, "senderUserId" TEXT, "body" TEXT NOT NULL, "createdAt" TIMESTAMPTZ DEFAULT now(), "readAt" TIMESTAMPTZ)',
  );

  await client.$executeRawUnsafe(
    'ALTER TABLE "TeacherMessage" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMPTZ',
  );

  // Teacher leads table
  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "TeacherLead" ("id" TEXT PRIMARY KEY, "teacherSlug" TEXT NOT NULL, "teacherName" TEXT, "studentName" TEXT NOT NULL, "studentEmail" TEXT NOT NULL, "city" TEXT NOT NULL, "preferredLessonType" TEXT, "message" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT \'new\', "createdAt" TIMESTAMPTZ DEFAULT now())',
  );

  // Generic leads table
  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Lead" ("id" TEXT PRIMARY KEY, "name" TEXT, "email" TEXT NOT NULL, "note" TEXT, "source" TEXT, "status" TEXT NOT NULL DEFAULT \'new\', "createdAt" TIMESTAMPTZ DEFAULT now())',
  );
  await client.$executeRawUnsafe(
    'ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT \'new\'',
  );

  // Admin audit log
  await client.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "AdminAuditLog" ("id" TEXT PRIMARY KEY, "adminId" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "action" TEXT NOT NULL, "before" JSONB, "after" JSONB, "createdAt" TIMESTAMPTZ DEFAULT now())',
  );
}

function createPrismaClient() {
  return new PrismaClient({
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

const shouldInitSchema =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  process.env.SKIP_PRISMA_INIT !== "true";

if (shouldInitSchema) {
  // Run one-time schema ensure on startup to keep client schema in sync with DB.
  globalForPrisma.prismaInit =
    globalForPrisma.prismaInit ||
    ensureAdminSchema(prisma).catch((err) => {
      console.error("Prisma admin schema init failed:", err);
    });

  // Await init so subsequent imports have columns ready
  await globalForPrisma.prismaInit;
}
