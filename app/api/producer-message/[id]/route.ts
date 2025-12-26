"use server";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  status: z.enum(["accepted", "declined"]),
});

async function getUserIdFromSession() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
  if (sessionUser?.id) return sessionUser.id;
  if (sessionUser?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: sessionUser.email.toLowerCase() },
      select: { id: true },
    });
    return dbUser?.id ?? null;
  }
  return null;
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  }

  const limiter = rateLimit(`producer-message:${userId}:${id}`, 5, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Çok sık işlem yaptın." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const request = await prisma.producerMessageRequest.findUnique({
    where: { id },
    select: { id: true, producerUserId: true, status: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Mesaj bulunamadı" }, { status: 404 });
  }
  if (request.producerUserId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  if (request.status === parsed.data.status) {
    return NextResponse.json({ ok: true, status: request.status });
  }

  try {
    const updated = await prisma.producerMessageRequest.update({
      where: { id: request.id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error("producer message update failed", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }
}
