import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  studentId: z.string().trim().min(1),
  studentName: z.string().trim().min(1).max(120),
  studentImage: z.string().trim().url().optional().nullable(),
});

type StudyomStudent = { id: string; name: string; addedAt: string; image?: string | null };

function normalizeStudents(value: unknown): StudyomStudent[] {
  if (!Array.isArray(value)) return [];
  const list: StudyomStudent[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { id?: unknown; name?: unknown; addedAt?: unknown };
    if (typeof record.id !== "string" || typeof record.name !== "string") continue;
    const addedAt =
      typeof record.addedAt === "string" && record.addedAt.trim()
        ? record.addedAt
        : new Date().toISOString();
    const image =
      typeof (record as { image?: unknown }).image === "string"
        ? (record as { image?: string }).image
        : null;
    list.push({ id: record.id, name: record.name.trim(), addedAt, image });
  }
  return list;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const application = await prisma.teacherApplication.findFirst({
    where: { userId, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  if (!application) {
    return NextResponse.json({ error: "Başvuru bulunamadı" }, { status: 404 });
  }

  const data = (application.data || {}) as Record<string, unknown>;
  const existing = normalizeStudents(data.studyomStudents);
  const already = existing.find((item) => item.id === parsed.data.studentId);
  if (already) {
    return NextResponse.json({ ok: true, students: existing });
  }

  const next: StudyomStudent[] = [
    ...existing,
    {
      id: parsed.data.studentId,
      name: parsed.data.studentName.trim(),
      addedAt: new Date().toISOString(),
      image: parsed.data.studentImage ?? null,
    },
  ];

  await prisma.teacherApplication.update({
    where: { id: application.id },
    data: { data: { ...data, studyomStudents: next } },
  });

  return NextResponse.json({ ok: true, students: next });
}
