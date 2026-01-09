"use client";

import { useState } from "react";
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
  applicationStatus: string;
  applicationAdminNote: string | null;
  applicationAdminTags: string[];
  applicationRejectReason: string | null;
  visibilityStatus: string | null;
  moderationNote: string | null;
  notifications: { message: string; createdAt: Date }[];
  createdAt: Date;
  isActive: boolean;
};

type AppRow = {
  id: number;
  userId: string;
  status: string;
  adminNote: string | null;
  adminTags: string[];
  rejectReason: string | null;
  visibilityStatus: string | null;
  moderationNote: string | null;
  createdAt: Date;
  data: unknown;
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
  const [saving, setSaving] = useState<{ id: string; action: string } | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const updateRow = (id: string, patch: Partial<StudioRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const buildNotesPayload = (row: StudioRow) => ({
    applicationAdminNote: row.applicationAdminNote ?? null,
    applicationAdminTags: row.applicationAdminTags ?? [],
    applicationRejectReason: row.applicationRejectReason ?? null,
  });

  const updateApplication = async (id: string, action: string, payload: Record<string, unknown>) => {
    setSaving({ id, action });
    try {
      const res = await fetch(`/api/admin/studios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                ...payload,
              }
            : row,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const approve = (row: StudioRow) =>
    updateApplication(row.id, "approve", {
      applicationStatus: "approved",
      ...buildNotesPayload(row),
    });

  const reject = (row: StudioRow) =>
    updateApplication(row.id, "reject", {
      applicationStatus: "rejected",
      ...buildNotesPayload(row),
    });

  const saveNotes = (row: StudioRow) =>
    updateApplication(row.id, "notes", buildNotesPayload(row));

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
              <p className="text-xs text-[var(--color-muted)]">
                Durum: <span className="text-[var(--color-primary)]">{studio.applicationStatus}</span>
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
                onClick={() => reject(studio)}
                className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                {saving?.id === studio.id && saving.action === "reject" ? "Reddediliyor..." : "Reddet"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving?.id === studio.id}
                onClick={() => approve(studio)}
              >
                {saving?.id === studio.id && saving.action === "approve" ? "Onaylanıyor..." : "Onayla"}
              </Button>
            </div>
          </div>
          {openRow === studio.id ? (
            <StudioDetails
              studio={studio}
              onChange={updateRow}
              onSaveNotes={saveNotes}
              saving={saving?.id === studio.id}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function RoleApplications({ initial, apiBase }: { initial: AppRow[]; apiBase: string }) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState<{ id: number; action: string } | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const updateRow = (id: number, patch: Partial<AppRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const buildNotesPayload = (row: AppRow) => ({
    adminNote: row.adminNote ?? null,
    adminTags: row.adminTags ?? [],
    rejectReason: row.rejectReason ?? null,
  });

  const updateApplication = async (id: number, action: string, payload: Record<string, unknown>) => {
    setSaving({ id, action });
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...(payload as Partial<AppRow>) } : row)),
      );
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const approve = (row: AppRow) =>
    updateApplication(row.id, "approve", {
      status: "approved",
      visibilityStatus: "published",
      ...buildNotesPayload(row),
    });

  const reject = (row: AppRow) =>
    updateApplication(row.id, "reject", {
      status: "rejected",
      ...buildNotesPayload(row),
    });

  const saveNotes = (row: AppRow) => updateApplication(row.id, "notes", buildNotesPayload(row));

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
                disabled={saving?.id === row.id}
                onClick={() => reject(row)}
                className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                {saving?.id === row.id && saving.action === "reject" ? "Reddediliyor..." : "Reddet"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving?.id === row.id}
                onClick={() => approve(row)}
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
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-xs">
                <div>
                  <div className="font-semibold text-[var(--color-primary)]">Admin notu</div>
                  <textarea
                    value={row.adminNote ?? ""}
                    onChange={(e) => updateRow(row.id, { adminNote: e.target.value })}
                    className="mt-2 h-20 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
                    placeholder="Başvuru notu"
                  />
                </div>
                <div>
                  <div className="font-semibold text-[var(--color-primary)]">Admin etiketleri (virgülle)</div>
                  <input
                    value={formatTags(row.adminTags)}
                    onChange={(e) => updateRow(row.id, { adminTags: parseTags(e.target.value) })}
                    className="mt-2 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
                    placeholder="quality, follow-up"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="font-semibold text-[var(--color-primary)]">Reddetme nedeni</div>
                    <input
                      value={row.rejectReason ?? ""}
                      onChange={(e) => updateRow(row.id, { rejectReason: e.target.value })}
                      className="mt-2 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
                      placeholder="Sebep"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => saveNotes(row)}
                    disabled={saving?.id === row.id}
                  >
                    {saving?.id === row.id && saving.action === "notes" ? "Kaydediliyor..." : "Notları kaydet"}
                  </Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-2 text-[10px] text-[var(--color-primary)]">
                {JSON.stringify(row.data, null, 2)}
              </pre>
            </div>
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
  data: unknown;
  userCity: string | null;
}) {
  const payload = normalizeApplicationData(data);
  const instruments = toStringArray(payload.instruments);
  const areas = toStringArray(payload.areas);
  const isTeacher = instruments.length > 0;
  const isProducer = areas.length > 0;

  const cityValue = toString(payload.city) || userCity || "-";
  const statement = toString(payload.statement) || "Açıklama yok.";
  const links = toStringArray(payload.links);

  const fields = isTeacher
    ? [
        { label: "Alanlar", value: <ChipList items={instruments} /> },
        { label: "Seviyeler", value: <ChipList items={toStringArray(payload.levels)} /> },
        { label: "Format", value: <ChipList items={toStringArray(payload.formats)} /> },
        { label: "Şehir", value: cityValue },
        { label: "Diller", value: <ChipList items={toStringArray(payload.languages)} /> },
        { label: "Ücret", value: toString(payload.price) || "-" },
        { label: "Yıl", value: toString(payload.years) || "-" },
        { label: "Öğrenci", value: toString(payload.students) || "-" },
      ]
    : isProducer
      ? [
          { label: "Üretim alanları", value: <ChipList items={areas} /> },
          { label: "Çalışma türü", value: <ChipList items={toStringArray(payload.workTypes)} /> },
          { label: "Mod", value: <ChipList items={toStringArray(payload.modes)} /> },
          { label: "Şehir", value: cityValue },
          { label: "Türler", value: <ChipList items={toStringArray(payload.genres)} /> },
          { label: "Ücret", value: toString(payload.price) || "-" },
          { label: "Proje", value: toString(payload.projects) || "-" },
          { label: "Yıl", value: toString(payload.years) || "-" },
        ]
      : [];

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

function normalizeApplicationData(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function toString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function formatTags(tags: string[] | null | undefined): string {
  return (tags || []).join(", ");
}

function StudioDetails({
  studio,
  onChange,
  onSaveNotes,
  saving,
}: {
  studio: StudioRow;
  onChange: (id: string, patch: Partial<StudioRow>) => void;
  onSaveNotes: (studio: StudioRow) => void;
  saving: boolean;
}) {
  const details = parseNotifications(studio.notifications || []);
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-xs">
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Admin notu</div>
          <textarea
            value={studio.applicationAdminNote ?? ""}
            onChange={(e) => onChange(studio.id, { applicationAdminNote: e.target.value })}
            className="mt-2 h-20 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
            placeholder="Başvuru notu"
          />
        </div>
        <div>
          <div className="font-semibold text-[var(--color-primary)]">Admin etiketleri (virgülle)</div>
          <input
            value={formatTags(studio.applicationAdminTags)}
            onChange={(e) => onChange(studio.id, { applicationAdminTags: parseTags(e.target.value) })}
            className="mt-2 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
            placeholder="quality, follow-up"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="font-semibold text-[var(--color-primary)]">Reddetme nedeni</div>
            <input
              value={studio.applicationRejectReason ?? ""}
              onChange={(e) => onChange(studio.id, { applicationRejectReason: e.target.value })}
              className="mt-2 h-9 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-[var(--color-primary)]"
              placeholder="Sebep"
            />
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSaveNotes(studio)}
            disabled={saving}
          >
            {saving ? "Kaydediliyor..." : "Notları kaydet"}
          </Button>
        </div>
      </div>
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
