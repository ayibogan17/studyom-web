"use client";

import type { ReactNode } from "react";
import { Fragment, useState } from "react";
import { Button } from "@/components/design-system/components/ui/button";

type TeacherItem = {
  id: number;
  userId: string;
  status: string;
  visibilityStatus: string;
  moderationNote: string | null;
  complaintsCount: number;
  flagsCount: number;
  contactCount: number;
  createdAt: Date;
  data: unknown;
  user: { id: string; email: string; fullName: string | null; city: string | null } | null;
  slug: string;
};

export default function TeachersClient({ items }: { items: TeacherItem[] }) {
  const [rows, setRows] = useState(items);
  const [saving, setSaving] = useState<number | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const updateRow = (id: number, patch: Partial<TeacherItem>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const updateListing = async (id: number, payload: Record<string, unknown>) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Kaydedilemedi");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
    } catch (err) {
      console.error(err);
      alert("Kaydedilemedi");
    } finally {
      setSaving(null);
    }
  };

  const publish = (row: TeacherItem) =>
    updateListing(row.id, { visibilityStatus: "published" });
  const hide = (row: TeacherItem) =>
    updateListing(row.id, { visibilityStatus: "hidden" });
  const markNeedsChanges = (row: TeacherItem) =>
    updateListing(row.id, { visibilityStatus: "draft", moderationNote: row.moderationNote ?? null });

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Fragment key={row.id}>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {row.user?.fullName || "İsim yok"} — {row.user?.email || row.userId}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {row.user?.city || "-"} · {new Date(row.createdAt).toLocaleString("tr-TR")}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  Durum: <span className="text-[var(--color-primary)]">{row.visibilityStatus}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => publish(row)}
                >
                  {saving === row.id ? "Kaydediliyor..." : "Yayınla"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => hide(row)}
                  className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  Gizle
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving === row.id}
                  onClick={() => markNeedsChanges(row)}
                >
                  Değişiklik iste
                </Button>
                <a
                  href={`/hocalar/${row.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg px-2 py-1 text-xs font-semibold text-[var(--color-accent)]"
                >
                  Görüntüle
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
                >
                  {openRow === row.id ? "Detay gizle" : "Detaylar"}
                </Button>
              </div>
            </div>
            <TeacherDetails data={row.data} userCity={row.user?.city || null} />
          </div>
          {openRow === row.id ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/40 p-3 text-xs text-[var(--color-muted)]">
              <div className="mb-3 grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)] p-3">
                <div>
                  <div className="font-semibold text-[var(--color-primary)]">Moderasyon notu</div>
                  <textarea
                    value={row.moderationNote ?? ""}
                    onChange={(e) => updateRow(row.id, { moderationNote: e.target.value })}
                    className="mt-2 h-20 w-full resize-none rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-[var(--color-primary)]"
                    placeholder="Needs changes notu"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={saving === row.id}
                    onClick={() => updateListing(row.id, { moderationNote: row.moderationNote ?? null })}
                  >
                    {saving === row.id ? "Kaydediliyor..." : "Notu kaydet"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-[var(--color-primary)]">Etkileşim (30g):</span>{" "}
                  {row.contactCount ?? 0}
                </div>
                <div>
                  <span className="font-semibold text-[var(--color-primary)]">Şikayet:</span>{" "}
                  {row.complaintsCount ?? 0}
                </div>
                <div>
                  <span className="font-semibold text-[var(--color-primary)]">Flag:</span> {row.flagsCount ?? 0}
                </div>
              </div>
              <p className="mt-3 font-semibold text-[var(--color-primary)]">Tüm veri</p>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-[var(--color-primary)]">
                {JSON.stringify(row.data, null, 2)}
              </pre>
            </div>
          ) : null}
        </Fragment>
      ))}
      {rows.length === 0 ? <p className="text-sm text-[var(--color-muted)]">Başvuru yok.</p> : null}
    </div>
  );
}

function TeacherDetails({ data, userCity }: { data: unknown; userCity: string | null }) {
  const payload = normalizeData(data);
  const links = toStringArray(payload.links);
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Alanlar" value={<ChipList items={toStringArray(payload.instruments)} />} />
        <Field label="Seviyeler" value={<ChipList items={toStringArray(payload.levels)} />} />
        <Field label="Format" value={<ChipList items={toStringArray(payload.formats)} />} />
        <Field label="Diller" value={<ChipList items={toStringArray(payload.languages)} />} />
        <Field label="Şehir" value={toString(payload.city) || userCity || "-"} />
        <Field label="Ücret" value={toString(payload.price) || "-"} />
        <Field label="Yıl" value={toString(payload.years) || "-"} />
        <Field label="Öğrenci" value={toString(payload.students) || "-"} />
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--color-primary)]">Kısa açıklama</div>
        <p className="text-sm text-[var(--color-primary)]">{toString(payload.statement) || "Açıklama yok."}</p>
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

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-[var(--color-primary)]">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function ChipList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <span>-</span>;
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

function normalizeData(value: unknown): Record<string, unknown> {
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
