import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/user-notify";

const schema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const url = new URL(req.url);
    const fallbackId = url.pathname.split("/").filter(Boolean).pop();
    const resolvedParams = await Promise.resolve(params);
    const linkId = resolvedParams?.id || fallbackId;

    if (!linkId) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; email?: string | null } | undefined;
    if (!sessionUser?.id && !sessionUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    const ownerEmail =
      sessionUser.email?.toLowerCase() ??
      (sessionUser.id
        ? (await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { email: true } }))?.email?.toLowerCase()
        : null);
    if (!ownerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const link = await prisma.producerStudioLink.findUnique({
      where: { id: linkId },
      include: {
        studio: { select: { id: true, name: true, ownerEmail: true } },
        producerUser: { select: { id: true, email: true, fullName: true, name: true } },
      },
    });
    if (!link) {
      return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    }

    if (link.studio.ownerEmail.toLowerCase() !== ownerEmail) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    if (link.status !== "pending") {
      return NextResponse.json({ error: "Talep zaten sonuçlandı" }, { status: 400 });
    }

    const updated = await prisma.producerStudioLink.update({
      where: { id: link.id },
      data: { status: parsed.data.status },
    });

    const producerEmail = link.producerUser.email;
    const producerName = link.producerUser.fullName || link.producerUser.name || producerEmail || "Üretici";
    const studioName = link.studio.name;
    const actionText = parsed.data.status === "approved" ? "onaylandı" : "reddedildi";
    const messageText = `Merhaba ${producerName},\n\n${studioName} stüdyosu için gönderdiğin üretim talebi ${actionText}.\n\nDetayları Üretici Paneli'nden takip edebilirsin.`;
    await notifyUser(producerEmail, "Stüdyo talebi güncellendi", messageText);

    return NextResponse.json({ link: updated });
  } catch (err) {
    console.error("producer studio link update failed", err);
    const message = err instanceof Error ? err.message : "Güncellenemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
