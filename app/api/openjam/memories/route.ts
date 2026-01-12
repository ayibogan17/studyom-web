import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const memorySchema = z.object({
  jamId: z.string().min(1),
  text: z.string().trim().min(1).max(400),
  photoUrl: z.string().url().optional().nullable(),
});
const updateSchema = memorySchema.extend({
  mode: z.enum(["create", "update"]).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jamId = searchParams.get("jamId");
  const mine = searchParams.get("mine") === "1";

  if (mine) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!jamId) return NextResponse.json({ error: "jamId gerekli" }, { status: 400 });

    const memory = await prisma.openJamMemory.findUnique({
      where: { jamId_userId: { jamId, userId } },
      select: { id: true, text: true, photoUrl: true },
    });
    return NextResponse.json({ memory });
  }

  const memories = await prisma.openJamMemory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      text: true,
      photoUrl: true,
      createdAt: true,
      jam: { select: { id: true, title: true, studio: { select: { name: true, district: true, city: true } } } },
      user: { select: { name: true, fullName: true, image: true } },
    },
  });

  return NextResponse.json({ memories });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const jam = await prisma.openJam.findUnique({
    where: { id: parsed.data.jamId },
    select: { id: true, capacity: true, status: true },
  });
  if (!jam || jam.status !== "active") {
    return NextResponse.json({ error: "Jam bulunamadı" }, { status: 404 });
  }

  const isParticipant = await prisma.openJamParticipant.findUnique({
    where: { jamId_userId: { jamId: jam.id, userId } },
    select: { id: true },
  });
  if (!isParticipant) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const participantCount = await prisma.openJamParticipant.count({ where: { jamId: jam.id } });
  if (participantCount < jam.capacity) {
    return NextResponse.json({ error: "Jam dolu değil" }, { status: 400 });
  }

  const existing = await prisma.openJamMemory.findUnique({
    where: { jamId_userId: { jamId: jam.id, userId } },
    select: { id: true },
  });
  if (existing && parsed.data.mode !== "update") {
    return NextResponse.json({ error: "Hatıra zaten var" }, { status: 400 });
  }

  const memory = await prisma.openJamMemory.create({
    data: {
      jamId: jam.id,
      userId,
      text: parsed.data.text.trim(),
      photoUrl: parsed.data.photoUrl ?? null,
    },
  });

  if (memory.photoUrl) {
    await prisma.openJamGalleryImage.create({
      data: {
        memoryId: memory.id,
        photoUrl: memory.photoUrl,
      },
    });
  }

  return NextResponse.json({ ok: true, id: memory.id });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const existing = await prisma.openJamMemory.findUnique({
    where: { jamId_userId: { jamId: parsed.data.jamId, userId } },
    select: { id: true, photoUrl: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Hatıra bulunamadı" }, { status: 404 });
  }

  const updated = await prisma.openJamMemory.update({
    where: { id: existing.id },
    data: {
      text: parsed.data.text.trim(),
      photoUrl: parsed.data.photoUrl ?? null,
    },
  });

  if (parsed.data.photoUrl) {
    await prisma.openJamGalleryImage.upsert({
      where: { memoryId: updated.id },
      update: { photoUrl: parsed.data.photoUrl },
      create: { memoryId: updated.id, photoUrl: parsed.data.photoUrl },
    });
  } else if (existing.photoUrl) {
    await prisma.openJamGalleryImage.deleteMany({ where: { memoryId: updated.id } });
  }

  return NextResponse.json({ ok: true, id: updated.id });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jamId = searchParams.get("jamId");
  if (!jamId) return NextResponse.json({ error: "jamId gerekli" }, { status: 400 });

  const existing = await prisma.openJamMemory.findUnique({
    where: { jamId_userId: { jamId, userId } },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Hatıra bulunamadı" }, { status: 404 });
  }

  await prisma.openJamGalleryImage.deleteMany({ where: { memoryId: existing.id } });
  await prisma.openJamMemory.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
