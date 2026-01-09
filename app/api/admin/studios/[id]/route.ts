import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/admin-audit";
import { notifyUser } from "@/lib/user-notify";
import { mergeRoles, normalizeRoles } from "@/lib/roles";

export const runtime = "nodejs";

const schema = z.object({
  isActive: z.boolean().optional(),
  decision: z.enum(["approved", "rejected"]).optional(),
  applicationStatus: z.enum(["pending", "approved", "rejected", "changes_requested"]).optional(),
  applicationAdminNote: z.string().trim().optional().nullable(),
  applicationAdminTags: z.array(z.string().trim().min(1)).optional(),
  applicationRejectReason: z.string().trim().optional().nullable(),
  applicationChangesRequestedNote: z.string().trim().optional().nullable(),
  visibilityStatus: z.enum(["draft", "published", "hidden"]).optional(),
  moderationNote: z.string().trim().optional().nullable(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const admin = await requireAdmin();
  const limiter = rateLimit(`admin:${admin.id}:studio:${id}`, 20, 60_000);
  if (!limiter.ok) {
    return NextResponse.json({ ok: false, error: "Çok hızlı" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Geçersiz veri" }, { status: 400 });
  }

  const payload = parsed.data;
  const desiredDecision = payload.decision ?? payload.applicationStatus;
  const hasUpdates =
    typeof payload.isActive === "boolean" ||
    Boolean(desiredDecision) ||
    typeof payload.applicationAdminNote !== "undefined" ||
    typeof payload.applicationAdminTags !== "undefined" ||
    typeof payload.applicationRejectReason !== "undefined" ||
    typeof payload.applicationChangesRequestedNote !== "undefined" ||
    typeof payload.visibilityStatus !== "undefined" ||
    typeof payload.moderationNote !== "undefined";

  if (!hasUpdates) {
    return NextResponse.json({ ok: false, error: "Değişiklik yok" }, { status: 400 });
  }

  try {
    const before = await prisma.studio.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        ownerEmail: true,
        isActive: true,
        applicationStatus: true,
        applicationAdminNote: true,
        applicationAdminTags: true,
        applicationRejectReason: true,
        applicationChangesRequestedNote: true,
        visibilityStatus: true,
        moderationNote: true,
      },
    });
    if (!before) {
      return NextResponse.json({ ok: false, error: "Stüdyo bulunamadı" }, { status: 404 });
    }
    const updateData: {
      isActive?: boolean;
      applicationStatus?: string;
      applicationAdminNote?: string | null;
      applicationAdminTags?: string[];
      applicationRejectReason?: string | null;
      applicationChangesRequestedNote?: string | null;
      visibilityStatus?: string;
      moderationNote?: string | null;
      notifications?: { create: { message: string } };
    } = {};

    if (payload.applicationStatus) {
      updateData.applicationStatus = payload.applicationStatus;
      if (payload.applicationStatus === "approved") {
        updateData.isActive = true;
        updateData.visibilityStatus = "published";
      }
      if (payload.applicationStatus === "rejected") {
        updateData.isActive = false;
        updateData.visibilityStatus = "hidden";
      }
      if (payload.applicationStatus === "changes_requested" || payload.applicationStatus === "pending") {
        updateData.isActive = false;
        updateData.visibilityStatus = "draft";
      }
    }
    if (payload.decision) {
      updateData.applicationStatus = payload.decision;
      if (payload.decision === "approved") {
        updateData.isActive = true;
        updateData.visibilityStatus = "published";
      }
      if (payload.decision === "rejected") {
        updateData.isActive = false;
        updateData.visibilityStatus = "hidden";
      }
      updateData.notifications = {
        create: { message: `Başvuru durumu: ${payload.decision}` },
      };
    }
    if (typeof payload.applicationAdminNote !== "undefined") {
      updateData.applicationAdminNote = payload.applicationAdminNote || null;
    }
    if (typeof payload.applicationAdminTags !== "undefined") {
      updateData.applicationAdminTags = payload.applicationAdminTags;
    }
    if (typeof payload.applicationRejectReason !== "undefined") {
      updateData.applicationRejectReason = payload.applicationRejectReason || null;
    }
    if (typeof payload.applicationChangesRequestedNote !== "undefined") {
      updateData.applicationChangesRequestedNote = payload.applicationChangesRequestedNote || null;
    }
    if (payload.visibilityStatus) {
      updateData.visibilityStatus = payload.visibilityStatus;
      updateData.isActive = payload.visibilityStatus === "published";
    }
    if (typeof payload.isActive === "boolean") {
      updateData.isActive = payload.isActive;
      updateData.visibilityStatus = payload.isActive ? "published" : updateData.visibilityStatus ?? "hidden";
    }
    if (typeof payload.moderationNote !== "undefined") {
      updateData.moderationNote = payload.moderationNote || null;
    }

    const updated = await prisma.studio.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        isActive: true,
        applicationStatus: true,
        visibilityStatus: true,
        moderationNote: true,
      },
    });
    await logAdminAction({
      adminId: admin.id,
      entityType: "studio",
      entityId: id,
      action: "update",
      before,
      after: updated,
    });

    if ((payload.decision || payload.applicationStatus) && before.ownerEmail) {
      const status = payload.decision || payload.applicationStatus;
      const subject =
        status === "approved"
          ? "Studyom – Stüdyo başvurun onaylandı"
          : "Studyom – Stüdyo başvurun reddedildi";
      const text =
        status === "approved"
          ? `Merhaba,

${before.name} için yaptığın başvuru onaylandı. Artık Stüdyo Paneline erişebilir, stüdyo bilgilerini düzenleyebilir, odalar ekleyebilir ve takvimini yönetebilirsin. Rezervasyon taleplerini panelden takip edip yanıtlayabilir, uygunluk ve fiyat bilgilerini güncelleyebilirsin.

Müzikle kal. Bir sorun olursa studyom.net/iletisim üzerinden bize yazabilirsin.
Studyom ekibi`
          : `Merhaba,

Başvurunu inceledik ancak bazı bilgileri doğrulayamadık. Kullanıcılar için güvenli ve iyi bir deneyim sağlamak adına şimdilik reddediyoruz. Bir hata olduğunu düşünüyorsan daha fazla bilgiyle yeniden başvurabilir ve studyom.net/iletisim üzerinden bize yazabilirsin.

Müzikle kal.
Studyom ekibi`;
      if (status === "approved" || status === "rejected") {
        await notifyUser(before.ownerEmail, subject, text);
      }
    }

    if (
      (payload.decision === "approved" || payload.applicationStatus === "approved") &&
      before.ownerEmail
    ) {
      const owner = await prisma.user.findUnique({
        where: { email: before.ownerEmail.toLowerCase() },
        select: {
          id: true,
          roles: true,
          role: true,
          isTeacher: true,
          isProducer: true,
          isStudioOwner: true,
        },
      });
      if (owner) {
        const nextRoles = mergeRoles(normalizeRoles(owner), ["studio_owner"]);
        await prisma.user.update({
          where: { id: owner.id },
          data: { roles: { set: nextRoles }, role: "STUDIO", isStudioOwner: true },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Kaydedilemedi" }, { status: 500 });
  }
}
