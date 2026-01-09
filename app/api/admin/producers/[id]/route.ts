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
  const limiter = rateLimit(`admin:${admin.id}:producer:${id}`, 20, 60_000);
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
    const beforeRows = await prisma.$queryRaw<{ status: string; userId: string }[]>`
      SELECT status, "userId", "adminNote", "adminTags", "rejectReason", "changesRequestedNote", "visibilityStatus", "moderationNote"
      FROM "ProducerApplication" WHERE id = ${appId} LIMIT 1
    `;
    const before = beforeRows[0];
    if (!before) {
      return NextResponse.json({ ok: false, error: "Başvuru bulunamadı" }, { status: 404 });
    }

    const updateFields: string[] = [];
    const values: unknown[] = [];
    const pushField = (field: string, value: unknown) => {
      updateFields.push(`"${field}" = $${updateFields.length + 1}`);
      values.push(value);
    };
    if (parsed.data.status) pushField("status", parsed.data.status);
    if (typeof parsed.data.adminNote !== "undefined") pushField("adminNote", parsed.data.adminNote || null);
    if (typeof parsed.data.adminTags !== "undefined") pushField("adminTags", parsed.data.adminTags);
    if (typeof parsed.data.rejectReason !== "undefined") pushField("rejectReason", parsed.data.rejectReason || null);
    if (typeof parsed.data.changesRequestedNote !== "undefined") {
      pushField("changesRequestedNote", parsed.data.changesRequestedNote || null);
    }
    if (parsed.data.visibilityStatus) pushField("visibilityStatus", parsed.data.visibilityStatus);
    if (typeof parsed.data.moderationNote !== "undefined") pushField("moderationNote", parsed.data.moderationNote || null);

    if (updateFields.length === 0) {
      return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "ProducerApplication" SET ${updateFields.join(", ")} WHERE id = $${updateFields.length + 1}`,
      ...values,
      appId,
    );
    const updated = {
      id: appId,
      status: parsed.data.status ?? before.status,
      adminNote: typeof parsed.data.adminNote !== "undefined" ? parsed.data.adminNote : before.adminNote,
      adminTags: typeof parsed.data.adminTags !== "undefined" ? parsed.data.adminTags : before.adminTags,
      rejectReason: typeof parsed.data.rejectReason !== "undefined" ? parsed.data.rejectReason : before.rejectReason,
      changesRequestedNote:
        typeof parsed.data.changesRequestedNote !== "undefined" ? parsed.data.changesRequestedNote : before.changesRequestedNote,
      visibilityStatus:
        typeof parsed.data.visibilityStatus !== "undefined" ? parsed.data.visibilityStatus : before.visibilityStatus,
      moderationNote:
        typeof parsed.data.moderationNote !== "undefined" ? parsed.data.moderationNote : before.moderationNote,
    };
    await logAdminAction({
      adminId: admin.id,
      entityType: "producerApplication",
      entityId: id,
      action: "update",
      before: before ?? null,
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
          const nextRoles = mergeRoles(normalizeRoles(user), ["producer"]);
          await prisma.user.update({
            where: { id: user.id },
            data: { roles: { set: nextRoles }, isProducer: true },
          });
        } else if (updated.status === "rejected") {
          const nextRoles = removeRoles(normalizeRoles(user), ["producer"]);
          await prisma.user.update({
            where: { id: user.id },
            data: { roles: { set: nextRoles }, isProducer: false },
          });
        }

        if (updated.status === "approved" || updated.status === "rejected") {
          const subject =
            updated.status === "approved"
              ? "Studyom – Üretici başvurun onaylandı"
              : "Studyom – Üretici başvurun reddedildi";
          const text =
            updated.status === "approved"
              ? `Merhaba ${name || ""},

Üretici başvurun onaylandı. Artık Üretici Panelini görebilir, mesajlarını buradan yönetebilirsin. Yeni mesajlar için mail bildirimi de göndereceğiz.
Profilindeki uzmanlık alanlarını ve çalışma türlerini güncel tutmanı öneririz; bu sayede doğru talepler sana ulaşır.

Müzikle kal. Bir sorun olursa studyom.net/iletisim üzerinden bize yazabilirsin.
Studyom ekibi`
              : `Merhaba ${name || ""},

Başvurunu inceledik ancak bazı bilgileri doğrulayamadık. Kullanıcılar için güvenli ve iyi bir deneyim sağlamak adına şimdilik reddediyoruz. Bir hata olduğunu düşünüyorsan daha fazla bilgiyle yeniden başvurabilir ve studyom.net/iletisim üzerinden bize yazabilirsin.

Müzikle kal.
Studyom ekibi`;
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
