"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type StudioRow = {
  id: string;
  name: string;
  city: string | null;
  district: string | null;
  address: string | null;
  ownerEmail: string;
  phone: string | null;
  openingHours: unknown;
  notifications: { message: string; createdAt: Date }[];
  createdAt: Date;
  isActive: boolean;
};

type AppRow = {
  id: number;
  userId: string;
  status: string;
  createdAt: Date;
  data: any;
  user: { id: string; email: string; fullName: string | null; city: string | null } | null;
};

export default function ApplicationsClient({
  kind,
  studios,
  teacherApps,
  producerApps,
}: {
  kind: "studio" | "teacher" | "producer";
  studios: StudioRow[];
  teacherApps: AppRow[];
  producerApps: AppRow[];
}) {
  if (kind === "studio") {
    return <StudioApplications initial={studios} />;
  }
  if (kind === "teacher") {
    return <RoleApplications initial={teacherApps} apiBase="/api/admin/teachers" />;
  }
  return <RoleApplications initial={producerApps} apiBase="/api/admin/producers" />;
}

function StudioApplications({ initial }: { initial: StudioRow[] }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const approve = async (id: string) => {
    setSaving({ id, action: "approve" });
    try {
      const res = await fetch(`/api/admin/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true, decision: "approved" }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const reject = async (id: string) => {
    setSaving({ id, action: "reject" });
    try {
      const res = await fetch(`/api/admin/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false, decision: "rejected" }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Bekleyen başvuru yok.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((studio) => (
        <div key={studio.id} className="rounded-xl border border-[var(--color-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">{studio.name}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {studio.city || "-"} / {studio.district || "-"} · {studio.ownerEmail} ·{" "}
                {new Date(studio.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenRow(openRow === studio.id ? null : studio.id)}
              >
                {openRow === studio.id ? "Detay gizle" : "Detaylar"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={saving?.id === studio.id}
                onClick={() => reject(studio.id)}
                className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                {saving?.id === studio.id && saving.action === "reject" ? "Reddediliyor..." : "Reddet"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving?.id === studio.id}
                onClick={() => approve(studio.id)}
              >
                {saving?.id === studio.id && saving.action === "approve" ? "Onaylanıyor..." : "Onayla"}
              </Button>
            </div>
          </div>
          {openRow === studio.id ? <StudioDetails studio={studio} /> : null}
        </div>
      ))}
    </div>
  );
}

function RoleApplications({ initial, apiBase }: { initial: AppRow[]; apiBase: string }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const updateStatus = async (id: number, status: "approved" | "rejected") => {
    setSaving({ id, action: status === "approved" ? "approve" : "reject" });
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">Bekleyen başvuru yok.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl border border-[var(--color-border)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {row.user?.fullName || "İsim yok"} — {row.user?.email || row.userId}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {row.user?.city || "-"} · {new Date(row.createdAt).toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
              >
                {openRow === row.id ? "Detay gizle" : "Detaylar"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={saving?.id === row.id || row.status === "rejected"}
                onClick={() => updateStatus(row.id, "rejected")}
                className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                {saving?.id === row.id && saving.action === "reject" ? "Reddediliyor..." : "Reddet"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving?.id === row.id || row.status === "approved"}
                onClick={() => updateStatus(row.id, "approved")}
              >
                {saving?.id === row.id && saving.action === "approve" ? "Onaylanıyor..." : "Onayla"}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            Durum: <span className="text-[var(--color-primary)]">{row.status}</span>
          </div>
          <ApplicationDetails data={row.data} userCity={row.user?.city || null} />
          {openRow === row.id ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[10px] text-[var(--color-primary)]">
              {JSON.stringify(row.data, null, 2)}
            </pre>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ApplicationDetails({
  data,
  userCity,
}: {
  data: Record<string, any> | null;
  userCity: string | null;
}) {
  const payload = normalizeApplicationData(data);
  const isTeacher = Array.isArray(payload?.instruments);
  const isProducer = Array.isArray(payload?.areas);

  const cityValue = payload?.city || userCity || "-";
  const statement = payload?.statement || "Açıklama yok.";
  const links: string[] = Array.isArray(payload?.links) ? payload.links.filter((l: string) => l) : [];

  const fields = useMemo(() => {
    if (isTeacher) {
      return [
        { label: "Alanlar", value: <ChipList items={payload.instruments} /> },
        { label: "Seviyeler", value: <ChipList items={payload.levels} /> },
        { label: "Format", value: <ChipList items={payload.formats} /> },
        { label: "Şehir", value: cityValue },
        { label: "Diller", value: <ChipList items={payload.languages} /> },
        { label: "Ücret", value: payload.price || "-" },
        { label: "Yıl", value: payload.years || "-" },
        { label: "Öğrenci", value: payload.students || "-" },
      ];
    }
    if (isProducer) {
      return [
        { label: "Üretim alanları", value: <ChipList items={payload.areas} /> },
        { label: "Çalışma türü", value: <ChipList items={payload.workTypes} /> },
        { label: "Mod", value: <ChipList items={payload.modes} /> },
        { label: "Şehir", value: cityValue },
        { label: "Türler", value: <ChipList items={payload.genres} /> },
        { label: "Ücret", value: payload.price || "-" },
        { label: "Proje", value: payload.projects || "-" },
        { label: "Yıl", value: payload.years || "-" },
      ];
    }
    return [];
  }, [cityValue, isProducer, isTeacher, payload]);

  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label}>
            <div className="font-semibold text-[var(--color-primary)]">{field.label}</div>
            <div>{field.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--color-primary)]">Kısa açıklama</div>
        <p className="text-sm text-[var(--color-primary)]">{statement}</p>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--color-primary)]">Bağlantılar</div>
        {links.length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">Bağlantı yok.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-primary)]">
            {links.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChipList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <span>-</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-[10px] text-[var(--color-primary)]">
          {item}
        </span>
      ))}
    </div>
  );
}

function normalizeApplicationData(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, any>;
    } catch {
      return {};
    }
  }
  if (typeof value === "object") {
    return value as Record<string, any>;
  }
  return {};
}

function StudioDetails({ studio }: { studio: StudioRow }) {
  const details = parseNotifications(studio.notifications || []);
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Adres</div>
          <div>{studio.address || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Telefon</div>
          <div>{studio.phone || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Açılış saatleri</div>
          <div>{formatHours(studio.openingHours)}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">İletişim tercihleri</div>
          <div>{details.contactMethods || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Başvuru durumu</div>
          <div>{details.applicationStatus || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">İletişim saatleri</div>
          <div>{details.contactHours || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Booking modu</div>
          <div>{details.bookingMode || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Oda bilgisi</div>
          <div>{details.roomInfo || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Ekipman setleri</div>
          <div>{details.equipmentSignal || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Öne çıkan ekipman</div>
          <div>{details.equipmentHighlight || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Instagram / Web</div>
          {details.portfolioLink ? (
            <a
              href={details.portfolioLink}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Link
            </a>
          ) : (
            <div>-</div>
          )}
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Google Business</div>
          {details.businessLink ? (
            <a
              href={details.businessLink}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Link
            </a>
          ) : (
            <div>-</div>
          )}
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Fiyat aralığı</div>
          <div>{details.priceRange || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Manuel inceleme</div>
          <div>{details.manualReview || "-"}</div>
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Maps</div>
          {details.mapsUrl ? (
            <a
              href={details.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Link
            </a>
          ) : (
            <div>-</div>
          )}
        </div>
      </div>
      {details.other.length ? (
        <div>
          <div className="text-xs font-semibold text-[var(--color-primary)]">Diğer notlar</div>
          <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--color-primary)]">
            {details.other.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type StudioDetailsParsed = {
  applicationStatus?: string | null;
  contactMethods?: string | null;
  bookingMode?: string | null;
  roomInfo?: string | null;
  equipmentSignal?: string | null;
  equipmentHighlight?: string | null;
  portfolioLink?: string | null;
  businessLink?: string | null;
  mapsUrl?: string | null;
  contactHours?: string | null;
  priceRange?: string | null;
  manualReview?: string | null;
  other: string[];
};

function parseNotifications(notifications: { message: string }[]): StudioDetailsParsed {
  const details: StudioDetailsParsed = { other: [] };
  notifications.forEach((note) => {
    const msg = note.message || "";
    if (msg.startsWith("İletişim tercihleri:")) {
      details.contactMethods = msg.replace("İletişim tercihleri:", "").trim();
      return;
    }
    if (msg.startsWith("Başvuru durumu:")) {
      details.applicationStatus = msg.replace("Başvuru durumu:", "").trim();
      return;
    }
    if (msg.startsWith("Booking modu:")) {
      details.bookingMode = msg.replace("Booking modu:", "").trim();
      return;
    }
    if (msg.startsWith("Oda sayısı:")) {
      details.roomInfo = msg.replace("Oda sayısı:", "").trim();
      return;
    }
    if (msg.startsWith("Ekipman sinyali:")) {
      details.equipmentSignal = msg.replace("Ekipman sinyali:", "").trim();
      return;
    }
    if (msg.startsWith("Öne çıkan ekipman:")) {
      details.equipmentHighlight = msg.replace("Öne çıkan ekipman:", "").trim();
      return;
    }
    if (msg.startsWith("Instagram/Web:")) {
      details.portfolioLink = msg.replace("Instagram/Web:", "").trim();
      return;
    }
    if (msg.startsWith("Google Business:")) {
      details.businessLink = msg.replace("Google Business:", "").trim();
      return;
    }
    if (msg.startsWith("Maps:")) {
      details.mapsUrl = msg.replace("Maps:", "").trim();
      return;
    }
    if (msg.startsWith("İletişim saatleri:")) {
      details.contactHours = msg.replace("İletişim saatleri:", "").trim();
      return;
    }
    if (msg.startsWith("Fiyat aralığı:")) {
      details.priceRange = msg.replace("Fiyat aralığı:", "").trim();
      return;
    }
    if (msg.startsWith("Manuel inceleme:")) {
      details.manualReview = msg.replace("Manuel inceleme:", "").trim();
      return;
    }
    if (msg) details.other.push(msg);
  });
  return details;
}

function formatHours(hours: unknown): string {
  if (!Array.isArray(hours)) return "-";
  const entries = hours
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { open?: boolean; openTime?: string; closeTime?: string };
      const openTime = row.openTime || "—";
      const closeTime = row.closeTime || "—";
      return row.open === false ? "Kapalı" : `${openTime} - ${closeTime}`;
    })
    .filter(Boolean) as string[];
  if (!entries.length) return "-";
  if (entries.length === 1) return entries[0];
  return `Hafta içi: ${entries[0]} · Hafta sonu: ${entries[1] ?? "Belirtilmedi"}`;
}
