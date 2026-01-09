import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  studioId: z.string().trim().min(1),
  roomId: z.string().trim().optional(),
  channel: z.enum(["in_app", "whatsapp", "phone"]),
  anonymousId: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  try {
    await prisma.contactEvent.create({
      data: {
        entityType: "studio",
        entityId: parsed.data.studioId,
        userId: userId || null,
        roomId: parsed.data.roomId || null,
        anonymousId: parsed.data.anonymousId || null,
        channel: parsed.data.channel,
      },
    });
    await prisma.studioContactEvent.create({
      data: {
        studioId: parsed.data.studioId,
        userId: userId || null,
        roomId: parsed.data.roomId || null,
        anonymousId: parsed.data.anonymousId || null,
        channel: parsed.data.channel,
      },
    });
  } catch (err) {
    console.error("studio contact event failed", err);
    return NextResponse.json({ error: "Kaydedilemedi" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
