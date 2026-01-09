import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";
import { notifyUser } from "@/lib/user-notify";
import { mergeRoles, normalizeRoles, removeRoles } from "@/lib/roles";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["pending", "approved", "rejected", "changes_requested", "closed"]).optional(),
  adminNote: z.string().trim().optional().nullable(),
  adminTags: z.array(z.string().trim().min(1)).optional(),
  rejectReason: z.string().trim().optional().nullable(),
  changesRequestedNote: z.string().trim().optional().nullable(),
  visibilityStatus: z.enum(["draft", "published", "hidden"]).optional(),
  moderationNote: z.string().trim().optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const limiter = rateLimit(`admin:${admin.id}:teacher:${id}`, 20, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "Çok hızlı" }, { status: 429 });
  }
  const appId = Number(id);
  if (!Number.isFinite(appId)) {
    return NextResponse.json({ ok: false, error: "Geçersiz id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  try {
    const before = await prisma.teacherApplication.findUnique({
      where: { id: appId },
      select: {
        id: true,
        status: true,
        userId: true,
        adminNote: true,
        adminTags: true,
        rejectReason: true,
        changesRequestedNote: true,
        visibilityStatus: true,
        moderationNote: true,
      },
    });
    if (!before) {
      return NextResponse.json({ ok: false, error: "Başvuru bulunamadı" }, { status: 404 });
    }
    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (typeof parsed.data.adminNote !== "undefined") updateData.adminNote = parsed.data.adminNote || null;
    if (typeof parsed.data.adminTags !== "undefined") updateData.adminTags = parsed.data.adminTags;
    if (typeof parsed.data.rejectReason !== "undefined") updateData.rejectReason = parsed.data.rejectReason || null;
    if (typeof parsed.data.changesRequestedNote !== "undefined") {
      updateData.changesRequestedNote = parsed.data.changesRequestedNote || null;
    }
    if (parsed.data.visibilityStatus) updateData.visibilityStatus = parsed.data.visibilityStatus;
    if (typeof parsed.data.moderationNote !== "undefined") updateData.moderationNote = parsed.data.moderationNote || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
    }

    const updated = await prisma.teacherApplication.update({
      where: { id: appId },
      data: updateData,
      select: {
        id: true,
        status: true,
        adminNote: true,
        adminTags: true,
        rejectReason: true,
        changesRequestedNote: true,
        visibilityStatus: true,
        moderationNote: true,
      },
    });
    await logAdminAction({
      adminId: admin.id,
      entityType: "teacherApplication",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });

    if (before.status !== updated.status) {
      const user = await prisma.user.findUnique({
        where: { id: before.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          name: true,
          role: true,
          roles: true,
          isTeacher: true,
          isProducer: true,
          isStudioOwner: true,
        },
      });
      const name = user?.fullName ?? user?.name;
      if (user) {
        if (updated.status === "approved") {
          const nextRoles = mergeRoles(normalizeRoles(user), ["teacher"]);
          await prisma.user.update({
            where: { id: user.id },
            data: { roles: { set: nextRoles }, isTeacher: true },
          });
        } else if (updated.status === "rejected") {
          const nextRoles = removeRoles(normalizeRoles(user), ["teacher"]);
          await prisma.user.update({
            where: { id: user.id },
            data: { roles: { set: nextRoles }, isTeacher: false },
          });
        }

        if (updated.status === "approved" || updated.status === "rejected") {
          const subject =
            updated.status === "approved"
              ? "Studyom – Hoca başvurun onaylandı"
              : "Studyom – Hoca başvurun reddedildi";
          const text =
            updated.status === "approved"
              ? `Merhaba ${name || ""},

Hoca başvurun incelendi ve onaylandı. Profilin kısa süre içinde listelerde görünecektir.
Giriş yaptığında artık Hoca Panelini görebiliyorsun. Mesajlarını bu panelden göreceksin, biz de mail olarak haber vereceğiz.
Potansiyel öğrencilerin sana Whatsapp'tan da ulaşabilmesini istiyorsan Whatsapp ayarını yapmayı unutma.
Ders vermek için beraber çalıştığın bir stüdyo varsa bunu da sergileyebilirsin.

Studyom hocalar için ücretsizdir. Ve ücretsiz kalacaktır.
Stüdyo sahiplerine de Hocalarımızla beraber çalışması için ''Stüdyonuz kurslara açık mı?'' diye sorduk ve Hocalarımıza %20 indirim yapmalarını önerdik.
Kurslara açık olan stüdyoları Stüdyo Bul kısmından görüp anlaşabilirsin.

Müzikle kal. Herhangi bir sorun varsa lütfen studyom.net/iletisim üzerinden iletişime geçmeye çekinme.

Studyom ekibi`
              : `Merhaba ${name || ""},

Hoca başvurunu inceledik; bazı bilgileri tam olarak doğrulayamadık. Öğrenciler için de güzel bir deneyim yaratmaya çalıştığımız için şimdilik başvurunu reddediyoruz. Bir hata olduğunu düşünüyorsan daha fazla bilgiyle tekrar dene, ve lütfen studyom.net/iletisim üzerinden bizimle iletişime geçmekten çekinme.

Müzikle kal. Studyom ekibi`;
          await notifyUser(user?.email, subject, text);
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
